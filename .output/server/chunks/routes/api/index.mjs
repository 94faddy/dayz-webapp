import { d as defineEventHandler, u as useSession, c as createError, a as getQuery } from '../../nitro/nitro.mjs';
import { executeQuery } from '../../_/database.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:url';
import 'mysql2/promise';
import 'dotenv';

const index = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-session"
    });
    if (!((_a = session.data) == null ? void 0 : _a.user)) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized"
      });
    }
    const userId = session.data.user.id;
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const orderNumber = ((_b = query.orderNumber) == null ? void 0 : _b.trim()) || "";
    const dateFrom = query.dateFrom || "";
    const dateTo = query.dateTo || "";
    const status = ((_c = query.status) == null ? void 0 : _c.trim()) || "";
    console.log("\u{1F50D} Loading orders for user:", userId, "with filters:", {
      page,
      limit,
      offset,
      orderNumber,
      dateFrom,
      dateTo,
      status
    });
    try {
      let whereClause = `po.user_id = ${parseInt(userId)}`;
      if (orderNumber) {
        const escapedOrderNumber = orderNumber.replace(/'/g, "''");
        whereClause += ` AND po.order_number LIKE '%${escapedOrderNumber}%'`;
      }
      if (dateFrom) {
        whereClause += ` AND DATE(po.created_at) >= '${dateFrom}'`;
      }
      if (dateTo) {
        whereClause += ` AND DATE(po.created_at) <= '${dateTo}'`;
      }
      if (status) {
        const escapedStatus = status.replace(/'/g, "''");
        whereClause += ` AND po.status = '${escapedStatus}'`;
      }
      console.log("\u{1F50D} WHERE clause:", whereClause);
      const countQuery = `
        SELECT COUNT(*) as total
        FROM purchase_orders po
        WHERE ${whereClause}
      `;
      const countResult = await executeQuery(countQuery);
      const total = ((_d = countResult[0]) == null ? void 0 : _d.total) || 0;
      const totalPages = Math.ceil(total / limit);
      console.log(`\u{1F4CA} Total orders matching filters: ${total}, Pages: ${totalPages}`);
      const ordersQuery = `
        SELECT 
          po.id,
          po.order_number,
          po.total_amount,
          po.status,
          po.payment_method,
          po.created_at,
          po.completed_at
        FROM purchase_orders po
        WHERE ${whereClause}
        ORDER BY po.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const orders = await executeQuery(ordersQuery);
      console.log(`\u2705 Found ${orders.length} orders for page ${page}`);
      for (const order of orders) {
        try {
          const itemsQuery = `
            SELECT 
              poi.id,
              poi.item_id,
              poi.quantity,
              poi.unit_price,
              poi.total_price,
              poi.delivery_status,
              poi.delivered_at,
              COALESCE(poi.delivery_attempts, 0) as delivery_attempts,
              si.name as item_name,
              si.classname,
              si.image_url,
              si.category
            FROM purchase_order_items poi
            JOIN store_items si ON poi.item_id = si.id
            WHERE poi.order_id = ${parseInt(order.id)}
            ORDER BY poi.id
          `;
          const items = await executeQuery(itemsQuery);
          order.items = items || [];
          console.log(`\u{1F4E6} Order ${order.order_number} has ${items.length} items`);
        } catch (itemError) {
          console.error(`\u274C Error loading items for order ${order.id}:`, itemError);
          order.items = [];
        }
      }
      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          orderNumber,
          dateFrom,
          dateTo,
          status
        }
      };
    } catch (dbError) {
      console.error("\u274C Database error in orders:", dbError);
      try {
        console.log("\u{1F504} Falling back to ultra-simple query...");
        const simpleQuery = `
          SELECT 
            po.id,
            po.order_number,
            po.total_amount,
            po.status,
            po.payment_method,
            po.created_at,
            po.completed_at
          FROM purchase_orders po
          WHERE po.user_id = ${parseInt(userId)}
          ORDER BY po.created_at DESC
          LIMIT ${limit}
        `;
        const fallbackOrders = await executeQuery(simpleQuery);
        for (const order of fallbackOrders) {
          try {
            const itemsQuery = `
              SELECT 
                poi.id,
                poi.item_id,
                poi.quantity,
                poi.unit_price,
                poi.total_price,
                poi.delivery_status,
                poi.delivered_at,
                COALESCE(poi.delivery_attempts, 0) as delivery_attempts,
                si.name as item_name,
                si.classname,
                si.image_url,
                si.category
              FROM purchase_order_items poi
              JOIN store_items si ON poi.item_id = si.id
              WHERE poi.order_id = ${parseInt(order.id)}
              ORDER BY poi.id
            `;
            const items = await executeQuery(itemsQuery);
            order.items = items || [];
          } catch (itemError) {
            console.error(`\u274C Error loading items for order ${order.id}:`, itemError);
            order.items = [];
          }
        }
        console.log(`\u2705 Fallback successful: ${fallbackOrders.length} orders loaded`);
        return {
          success: true,
          orders: fallbackOrders,
          pagination: {
            page: 1,
            limit,
            total: fallbackOrders.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          },
          filters: {
            orderNumber: "",
            dateFrom: "",
            dateTo: "",
            status: ""
          },
          fallback: true
        };
      } catch (fallbackError) {
        console.error("\u274C Fallback also failed:", fallbackError);
        return {
          success: true,
          orders: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          filters: {
            orderNumber: "",
            dateFrom: "",
            dateTo: "",
            status: ""
          },
          error: "Database connection failed"
        };
      }
    }
  } catch (error) {
    console.error("\u274C Orders API error:", error);
    if (error.statusCode) {
      throw error;
    }
    return {
      success: false,
      orders: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      },
      error: error.message || "Unknown error"
    };
  }
});

export { index as default };
//# sourceMappingURL=index.mjs.map
