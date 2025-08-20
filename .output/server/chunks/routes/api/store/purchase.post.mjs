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

const purchase_post = defineEventHandler(async (event) => {
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
    const { itemId, quantity = 1 } = body;
    const userId = session.data.user.id;
    if (!itemId || quantity < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid item ID or quantity"
      });
    }
    const [item] = await executeQuery(
      "SELECT * FROM store_items WHERE id = ? AND is_active = TRUE",
      [itemId]
    );
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Item not found or not available"
      });
    }
    if (!item.stock_unlimited && item.stock_quantity < quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: "Insufficient stock"
      });
    }
    const [user] = await executeQuery(
      "SELECT points, steamid64, is_active, is_banned FROM users WHERE id = ?",
      [userId]
    );
    if (!user || !user.is_active || user.is_banned) {
      throw createError({
        statusCode: 403,
        statusMessage: "Account not active or banned"
      });
    }
    if (!user.steamid64 || !/^7656119[0-9]{10}$/.test(user.steamid64)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Steam ID. Please update your profile."
      });
    }
    const totalPrice = item.price * quantity;
    if (user.points < totalPrice) {
      throw createError({
        statusCode: 400,
        statusMessage: "Insufficient points"
      });
    }
    try {
      await executeQuery(
        "UPDATE users SET points = points - ? WHERE id = ?",
        [totalPrice, userId]
      );
      const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substr(2, 5).toUpperCase();
      const orderResult = await executeQuery(
        `INSERT INTO purchase_orders (order_number, user_id, total_amount, status, payment_method)
         VALUES (?, ?, ?, 'paid', 'points')`,
        [orderNumber, userId, totalPrice]
      );
      const orderId = orderResult.insertId;
      await executeQuery(
        `INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price, delivery_status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [orderId, itemId, quantity, item.price, totalPrice]
      );
      await executeQuery(
        `INSERT INTO user_purchases (user_id, item_id, quantity, total_price, status, delivery_status)
         VALUES (?, ?, ?, ?, 'completed', 'pending')`,
        [userId, itemId, quantity, totalPrice]
      );
      if (!item.stock_unlimited) {
        await executeQuery(
          "UPDATE store_items SET stock_quantity = stock_quantity - ? WHERE id = ?",
          [quantity, itemId]
        );
      }
      await executeQuery(
        `INSERT INTO point_transactions (user_id, amount, type, description)
         VALUES (?, ?, 'purchase', ?)`,
        [userId, -totalPrice, `Order ${orderNumber}: ${quantity}x ${item.name}`]
      );
      const [updatedUser] = await executeQuery(
        "SELECT points FROM users WHERE id = ?",
        [userId]
      );
      session.data.user.points = updatedUser.points;
      await session.update(session.data);
      let autoDeliveryEnabled = false;
      let deliveryAttempted = false;
      let deliverySuccess = false;
      let deliveryMessage = "Item purchased successfully. You can deliver it manually from your orders page.";
      try {
        const [autoDeliverySetting] = await executeQuery(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'auto_delivery'"
        );
        autoDeliveryEnabled = (autoDeliverySetting == null ? void 0 : autoDeliverySetting.setting_value) === "true";
        console.log("\u{1F50D} Auto delivery setting:", {
          enabled: autoDeliveryEnabled,
          settingValue: autoDeliverySetting == null ? void 0 : autoDeliverySetting.setting_value
        });
        if (autoDeliveryEnabled) {
          deliveryAttempted = true;
          console.log("\u{1F680} Attempting auto delivery for order:", orderNumber);
          const config = useRuntimeConfig();
          if (!config.dzsvApi || !config.dzsvApiKey) {
            throw new Error("DayZ API configuration missing");
          }
          const itemData = {
            classname: item.classname.trim(),
            quantity: parseInt(quantity)
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
                  // Add nested attachments if present
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
            steamId: user.steamid64,
            item: itemData
          };
          console.log("\u{1F680} Sending auto delivery request:", {
            url: `${config.dzsvApi}/v1/itemgiver/add-item`,
            steamId: user.steamid64,
            item: itemData
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
          });
          console.log("\u2705 Auto delivery API response:", deliveryResponse);
          if (deliveryResponse && deliveryResponse.success === true) {
            deliverySuccess = true;
            deliveryMessage = "Item delivered automatically to your character! Check your inventory in-game.";
            await executeQuery(
              `UPDATE purchase_order_items 
               SET delivery_status = 'delivered', delivered_at = NOW(), delivery_data = ?
               WHERE order_id = ?`,
              [JSON.stringify(deliveryResponse), orderId]
            );
            await executeQuery(
              `UPDATE user_purchases 
               SET delivery_status = 'delivered', delivered_at = NOW(), delivery_data = ?
               WHERE user_id = ? AND item_id = ? AND created_at >= NOW() - INTERVAL 1 MINUTE`,
              [JSON.stringify(deliveryResponse), userId, itemId]
            );
            await executeQuery(
              'UPDATE purchase_orders SET status = "completed", completed_at = NOW() WHERE id = ?',
              [orderId]
            );
          } else {
            const apiErrorMessage = (deliveryResponse == null ? void 0 : deliveryResponse.message) || (deliveryResponse == null ? void 0 : deliveryResponse.error) || "Auto delivery failed";
            deliveryMessage = `Auto delivery failed: ${apiErrorMessage}. You can try manual delivery from your orders page.`;
            console.error("\u274C Auto delivery API failure:", deliveryResponse);
            await executeQuery(
              `UPDATE purchase_order_items 
               SET delivery_status = 'failed', delivery_data = ?
               WHERE order_id = ?`,
              [JSON.stringify(deliveryResponse), orderId]
            );
          }
        } else {
          console.log("\u2139\uFE0F Auto delivery is disabled, manual delivery required");
        }
      } catch (deliveryError) {
        console.error("\u274C Auto delivery error:", deliveryError);
        if (autoDeliveryEnabled) {
          deliveryMessage = `Auto delivery failed: ${deliveryError.message}. You can try manual delivery from your orders page.`;
          await executeQuery(
            `UPDATE purchase_order_items 
             SET delivery_status = 'failed', delivery_data = ?
             WHERE order_id = ?`,
            [JSON.stringify({
              error: deliveryError.message,
              status: deliveryError.status || 500,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }), orderId]
          );
        }
      }
      return {
        success: true,
        message: "Purchase completed successfully",
        purchaseId: orderId,
        orderNumber,
        orderId,
        newBalance: updatedUser.points,
        item: {
          name: item.name,
          classname: item.classname,
          quantity,
          totalPrice
        },
        delivery: {
          autoDeliveryEnabled,
          attempted: deliveryAttempted,
          success: deliverySuccess,
          status: deliverySuccess ? "delivered" : deliveryAttempted ? "failed" : "pending",
          message: deliveryMessage
        }
      };
    } catch (error) {
      console.error("\u274C Purchase transaction error:", error);
      throw error;
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("\u274C Purchase error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Purchase failed"
    });
  }
});

export { purchase_post as default };
//# sourceMappingURL=purchase.post.mjs.map
