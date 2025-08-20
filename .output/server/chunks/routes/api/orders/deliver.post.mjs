import { d as defineEventHandler, u as useSession, c as createError, r as readBody, b as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import { executeQuery } from '../../../_/database.mjs';
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

const deliver_post = defineEventHandler(async (event) => {
  var _a;
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
    const body = await readBody(event);
    const { orderId } = body;
    const userId = session.data.user.id;
    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Order ID is required"
      });
    }
    const [order] = await executeQuery(`
      SELECT po.*, u.steamid64, u.name as user_name
      FROM purchase_orders po
      JOIN users u ON po.user_id = u.id
      WHERE po.id = ? AND po.user_id = ?
    `, [orderId, userId]);
    if (!order) {
      throw createError({
        statusCode: 404,
        statusMessage: "Order not found"
      });
    }
    if (order.status !== "paid") {
      throw createError({
        statusCode: 400,
        statusMessage: "Order is not in valid status for delivery"
      });
    }
    if (!order.steamid64 || !/^7656119[0-9]{10}$/.test(order.steamid64)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Steam ID format"
      });
    }
    const orderItems = await executeQuery(`
      SELECT poi.*, si.name, si.classname, si.attachments, si.category
      FROM purchase_order_items poi
      JOIN store_items si ON poi.item_id = si.id
      WHERE poi.order_id = ? AND poi.delivery_status = 'pending'
    `, [orderId]);
    if (orderItems.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No pending items to deliver"
      });
    }
    const config = useRuntimeConfig();
    if (!config.dzsvApi || !config.dzsvApiKey) {
      console.error("\u274C DayZ API configuration missing:", {
        hasApi: !!config.dzsvApi,
        hasKey: !!config.dzsvApiKey
      });
      throw createError({
        statusCode: 500,
        statusMessage: "Server configuration error"
      });
    }
    let allDelivered = true;
    const deliveryResults = [];
    console.log("\u{1F680} Starting delivery for order:", orderId, "steamid64:", order.steamid64);
    for (const item of orderItems) {
      try {
        if (!item.classname || !item.quantity || item.quantity <= 0) {
          throw new Error(`Invalid item data: classname=${item.classname}, quantity=${item.quantity}`);
        }
        const itemData = {
          classname: item.classname.trim(),
          quantity: parseInt(item.quantity)
        };
        if (item.attachments) {
          try {
            let attachments;
            if (typeof item.attachments === "string") {
              attachments = JSON.parse(item.attachments);
            } else {
              attachments = item.attachments;
            }
            if (Array.isArray(attachments) && attachments.length > 0) {
              const validAttachments = attachments.filter(
                (att) => att.classname && typeof att.classname === "string"
              ).map((att) => ({
                classname: att.classname.trim(),
                quantity: parseInt(att.quantity) || 1,
                // Add nested attachments if present (supports up to 3 levels)
                ...att.attachments && Array.isArray(att.attachments) && att.attachments.length > 0 ? { attachments: att.attachments.map((nested) => ({
                  classname: nested.classname.trim(),
                  quantity: parseInt(nested.quantity) || 1
                })) } : {}
              }));
              if (validAttachments.length > 0) {
                itemData.attachments = validAttachments;
              }
            }
          } catch (e) {
            console.error("Failed to parse attachments:", e);
          }
        }
        const apiRequestBody = {
          steamId: order.steamid64,
          // ต้องเป็น steamId ไม่ใช่ steamid64
          item: itemData
        };
        console.log("\u{1F680} Sending to DayZ API:", {
          url: `${config.dzsvApi}/v1/itemgiver/add-item`,
          body: apiRequestBody
        });
        const deliveryResponse = await $fetch(`${config.dzsvApi}/v1/itemgiver/add-item`, {
          method: "POST",
          headers: {
            "X-API-Key": config.dzsvApiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: apiRequestBody,
          timeout: 3e4
          // 30 second timeout
        });
        console.log("\u2705 DayZ API Response:", deliveryResponse);
        if (deliveryResponse && deliveryResponse.success === true) {
          await executeQuery(
            `UPDATE purchase_order_items 
             SET delivery_status = 'delivered', delivered_at = NOW(), 
                 delivery_data = ?, delivery_attempts = delivery_attempts + 1
             WHERE id = ?`,
            [JSON.stringify(deliveryResponse), item.id]
          );
          await executeQuery(
            `UPDATE user_purchases 
             SET delivery_status = 'delivered', delivered_at = NOW(), 
                 delivery_data = ?, delivery_attempts = delivery_attempts + 1
             WHERE user_id = ? AND item_id = ? AND delivery_status = 'pending'
             ORDER BY created_at DESC LIMIT 1`,
            [JSON.stringify(deliveryResponse), userId, item.item_id]
          );
          deliveryResults.push({
            itemId: item.item_id,
            itemName: item.name,
            status: "delivered",
            message: "Item delivered successfully",
            apiResponse: deliveryResponse
          });
        } else {
          allDelivered = false;
          const errorMessage = (deliveryResponse == null ? void 0 : deliveryResponse.message) || (deliveryResponse == null ? void 0 : deliveryResponse.error) || "API returned unsuccessful response";
          console.error("\u274C API returned failure:", deliveryResponse);
          await executeQuery(
            `UPDATE purchase_order_items 
             SET delivery_status = 'failed', 
                 delivery_data = ?, delivery_attempts = delivery_attempts + 1
             WHERE id = ?`,
            [JSON.stringify(deliveryResponse), item.id]
          );
          deliveryResults.push({
            itemId: item.item_id,
            itemName: item.name,
            status: "failed",
            message: errorMessage,
            apiResponse: deliveryResponse
          });
        }
      } catch (itemError) {
        console.error("\u274C Item delivery error:", itemError);
        allDelivered = false;
        let errorMessage = "Delivery failed";
        let errorDetails = { error: itemError.message };
        if (itemError.status === 400) {
          errorMessage = "Invalid request data";
          errorDetails.status = 400;
        } else if (itemError.status === 401) {
          errorMessage = "API authentication failed";
          errorDetails.status = 401;
        } else if (itemError.status === 403) {
          errorMessage = "API access forbidden";
          errorDetails.status = 403;
        } else if (itemError.status === 404) {
          errorMessage = "API endpoint not found";
          errorDetails.status = 404;
        } else if (itemError.status === 500) {
          errorMessage = "DayZ server error";
          errorDetails.status = 500;
        }
        await executeQuery(
          `UPDATE purchase_order_items 
           SET delivery_status = 'failed', 
               delivery_data = ?, delivery_attempts = delivery_attempts + 1
           WHERE id = ?`,
          [JSON.stringify(errorDetails), item.id]
        );
        deliveryResults.push({
          itemId: item.item_id,
          itemName: item.name,
          status: "failed",
          message: errorMessage,
          error: itemError.message
        });
      }
    }
    if (allDelivered) {
      await executeQuery(
        'UPDATE purchase_orders SET status = "completed", completed_at = NOW() WHERE id = ?',
        [orderId]
      );
    }
    const successCount = deliveryResults.filter((r) => r.status === "delivered").length;
    const failedCount = deliveryResults.filter((r) => r.status === "failed").length;
    return {
      success: true,
      message: allDelivered ? "All items delivered successfully!" : `${successCount} items delivered, ${failedCount} items failed`,
      orderStatus: allDelivered ? "completed" : "processing",
      deliveryResults,
      stats: {
        total: orderItems.length,
        delivered: successCount,
        failed: failedCount
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("\u274C Manual delivery API error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Manual delivery failed"
    });
  }
});

export { deliver_post as default };
//# sourceMappingURL=deliver.post.mjs.map
