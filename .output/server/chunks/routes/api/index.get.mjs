import { d as defineEventHandler, u as useSession, c as createError } from '../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  var _a, _b, _c;
  try {
    console.log("\u{1F50D} Profile API called");
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-session"
    });
    console.log("\u{1F4CA} Session check:", {
      hasData: !!session.data,
      hasUser: !!((_a = session.data) == null ? void 0 : _a.user),
      userId: (_c = (_b = session.data) == null ? void 0 : _b.user) == null ? void 0 : _c.id
    });
    if (!session.data || !session.data.user) {
      console.log("\u274C No session found");
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized"
      });
    }
    const userId = session.data.user.id;
    console.log("\u{1F50D} Loading profile for user ID:", userId);
    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.steamid64,
        u.points,
        u.name_change_count,
        u.last_name_change,
        u.last_login,
        u.created_at,
        u.avatar_data,
        (SELECT COUNT(*) FROM user_purchases WHERE user_id = u.id) as total_purchases,
        (SELECT SUM(total_price) FROM user_purchases WHERE user_id = u.id AND status = 'completed') as total_spent
      FROM users u
      WHERE u.id = ?
    `;
    const result = await executeQuery(query, [userId]);
    if (result.length === 0) {
      console.log("\u274C User not found in database");
      throw createError({
        statusCode: 404,
        statusMessage: "User not found"
      });
    }
    const user = result[0];
    console.log("\u2705 User found:", user.email);
    let avatarData = null;
    if (user.avatar_data) {
      try {
        if (typeof user.avatar_data === "string") {
          if (user.avatar_data === "[object Object]" || user.avatar_data === "null") {
            console.warn("\u26A0\uFE0F Invalid avatar_data detected, setting to null");
            avatarData = null;
          } else {
            avatarData = JSON.parse(user.avatar_data);
          }
        } else if (typeof user.avatar_data === "object") {
          avatarData = user.avatar_data;
        }
        if (avatarData) {
          console.log("\u{1F3A8} Avatar data found:", avatarData.type);
        }
      } catch (error) {
        console.error("\u274C Failed to parse avatar_data:", error.message);
        console.error("Raw avatar_data:", user.avatar_data);
        avatarData = null;
      }
    }
    const transactionQuery = `
      SELECT id, type, amount, description, created_at
      FROM point_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const transactions = await executeQuery(transactionQuery, [userId]);
    console.log("\u{1F4CA} Transactions found:", transactions.length);
    const purchaseQuery = `
      SELECT 
        up.id,
        up.quantity,
        up.total_price,
        up.status,
        up.created_at,
        si.name as item_name,
        si.category
      FROM user_purchases up
      JOIN store_items si ON up.item_id = si.id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
      LIMIT 10
    `;
    const purchases = await executeQuery(purchaseQuery, [userId]);
    console.log("\u{1F6D2} Purchases found:", purchases.length);
    const response = {
      success: true,
      user: {
        ...user,
        avatar_data: avatarData,
        // เพิ่ม avatar data
        total_purchases: user.total_purchases || 0,
        total_spent: user.total_spent || 0
      },
      transactions,
      purchases
    };
    console.log("\u2705 Profile API response prepared");
    return response;
  } catch (error) {
    console.error("\u274C Profile API error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch profile"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
