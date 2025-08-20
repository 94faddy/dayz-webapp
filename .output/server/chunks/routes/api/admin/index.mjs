import { d as defineEventHandler, c as createError, b as useRuntimeConfig, a as getQuery } from '../../../nitro/nitro.mjs';
import { r as requireAdminAuth } from '../../../_/admin-middleware.mjs';
import { h as hasAdminPermission } from '../../../_/admin-auth.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:url';
import 'bcryptjs';
import '../../../_/database.mjs';
import 'mysql2/promise';
import 'dotenv';

const index = defineEventHandler(async (event) => {
  const admin = await requireAdminAuth(event);
  if (!await hasAdminPermission(admin.id, "orders:read")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  try {
    const config = useRuntimeConfig();
    const query2 = getQuery(event);
    console.log("\u{1F50D} Fetching history from DayZ API with params:", query2);
    const apiQuery = {
      page: query2.page || 1,
      limit: query2.limit || 50
    };
    if (query2.steamId) {
      apiQuery.steamId = query2.steamId;
    }
    if (query2.playerName) {
      apiQuery.playerName = query2.playerName;
    }
    if (query2.status) {
      apiQuery.status = query2.status;
    }
    if (query2.startDate) {
      apiQuery.startDate = query2.startDate;
    }
    if (query2.endDate) {
      apiQuery.endDate = query2.endDate;
    }
    console.log("\u{1F50D} Fetching history from DayZ API:", `${config.dzsvApi}/v1/itemgiver/history`);
    const historyResponse = await $fetch(`${config.dzsvApi}/v1/itemgiver/history`, {
      method: "GET",
      headers: {
        "X-API-Key": config.dzsvApiKey
      },
      query: apiQuery,
      timeout: 15e3
      // 15 second timeout
    });
    console.log("\u2705 DayZ API History Response:", historyResponse);
    if (historyResponse && historyResponse.history && Array.isArray(historyResponse.history)) {
      const transformedHistory = historyResponse.history.map((record) => ({
        id: record.id,
        steamId: record.steam_id,
        playerName: record.player_name || "Unknown",
        item: {
          classname: record.item_classname,
          quantity: record.item_quantity || 1,
          attachments: record.attachments || []
        },
        status: record.status,
        deliveredAt: record.delivered_at,
        queuedAt: record.created_at,
        failedAt: record.status === "failed" ? record.updated_at : null,
        attempts: record.attempts || 1,
        source: record.source || "api",
        orderId: record.order_id || "N/A",
        error: record.error_message
      }));
      console.log(`\u2705 Transformed ${transformedHistory.length} history records`);
      return {
        success: true,
        history: transformedHistory,
        pagination: {
          page: parseInt(query2.page) || 1,
          limit: parseInt(query2.limit) || 50,
          total: historyResponse.total_records || transformedHistory.length,
          totalPages: Math.ceil((historyResponse.total_records || transformedHistory.length) / (parseInt(query2.limit) || 50))
        },
        stats: {
          total: historyResponse.total_records || transformedHistory.length,
          delivered: historyResponse.filtered_records || transformedHistory.filter((h) => h.status === "delivered").length,
          pending: transformedHistory.filter((h) => h.status === "pending").length,
          failed: transformedHistory.filter((h) => h.status === "failed").length
        }
      };
    } else {
      console.warn("\u26A0\uFE0F DayZ API returned unexpected format:", historyResponse);
      throw new Error("API returned unexpected response format");
    }
  } catch (error) {
    console.error("\u274C History API error:", error);
    try {
      console.log("\u{1F504} Falling back to local database...");
      const { executeQuery } = await import('../../../_/database.mjs');
      const whereConditions = [];
      const queryParams = [];
      if (query.steamId) {
        whereConditions.push("u.steamid64 = ?");
        queryParams.push(query.steamId);
      } else if (query.playerName) {
        whereConditions.push("u.name LIKE ?");
        queryParams.push(`%${query.playerName}%`);
      }
      if (query.status) {
        whereConditions.push("poi.delivery_status = ?");
        queryParams.push(query.status);
      }
      if (query.startDate) {
        whereConditions.push("poi.created_at >= ?");
        queryParams.push(query.startDate);
      }
      if (query.endDate) {
        whereConditions.push("poi.created_at <= ?");
        queryParams.push(query.endDate);
      }
      if (!query.status) {
        whereConditions.push('poi.delivery_status IN ("delivered", "failed", "pending")');
      }
      const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";
      const localHistory = await executeQuery(`
        SELECT 
          poi.id,
          u.steamid64 as steamId,
          u.name as playerName,
          si.classname,
          poi.quantity,
          poi.delivery_status as status,
          poi.delivered_at as deliveredAt,
          poi.delivery_attempts as attempts,
          po.order_number as orderId,
          poi.delivery_data as apiResponse,
          'web_store' as source,
          poi.created_at as queuedAt
        FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.order_id = po.id
        JOIN users u ON po.user_id = u.id
        JOIN store_items si ON poi.item_id = si.id
        ${whereClause}
        ORDER BY COALESCE(poi.delivered_at, poi.created_at) DESC
        LIMIT 50
      `, queryParams);
      const transformedHistory = localHistory.map((record) => ({
        id: record.id,
        steamId: record.steamId,
        playerName: record.playerName || "Unknown",
        item: {
          classname: record.classname,
          quantity: record.quantity || 1
        },
        status: record.status,
        deliveredAt: record.deliveredAt,
        queuedAt: record.queuedAt,
        failedAt: record.status === "failed" ? record.deliveredAt : null,
        attempts: record.attempts || 1,
        source: record.source,
        orderId: record.orderId
      }));
      console.log(`\u2705 Fallback successful: Found ${transformedHistory.length} records`);
      return {
        success: true,
        history: transformedHistory,
        pagination: {
          page: 1,
          limit: 50,
          total: transformedHistory.length,
          totalPages: 1
        },
        stats: {
          total: transformedHistory.length,
          delivered: transformedHistory.filter((h) => h.status === "delivered").length,
          pending: transformedHistory.filter((h) => h.status === "pending").length,
          failed: transformedHistory.filter((h) => h.status === "failed").length
        },
        source: "local_database"
      };
    } catch (fallbackError) {
      console.error("\u274C Fallback to local database failed:", fallbackError);
      return {
        success: true,
        history: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        },
        stats: {
          total: 0,
          delivered: 0,
          pending: 0,
          failed: 0
        },
        source: "empty_fallback",
        error: {
          api: error.message,
          fallback: fallbackError.message
        }
      };
    }
  }
});

export { index as default };
//# sourceMappingURL=index.mjs.map
