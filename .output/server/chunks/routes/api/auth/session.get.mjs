import { d as defineEventHandler, u as useSession, c as createError } from '../../../nitro/nitro.mjs';
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

const session_get = defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      // 24 hours
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-session"
    });
    if (!session.data || !session.data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "No active session"
      });
    }
    const userId = session.data.user.id;
    const userQuery = `
      SELECT id, email, name, steamid64, points, is_active, is_banned
      FROM users 
      WHERE id = ? AND is_active = TRUE AND is_banned = FALSE
    `;
    const users = await executeQuery(userQuery, [userId]);
    if (users.length === 0) {
      await session.clear();
      throw createError({
        statusCode: 401,
        statusMessage: "User not found or inactive"
      });
    }
    const user = users[0];
    await session.update({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        steamid64: user.steamid64,
        points: user.points
      },
      isAdmin: session.data.isAdmin || false,
      loginTime: session.data.loginTime,
      ip: session.data.ip,
      lastAccess: (/* @__PURE__ */ new Date()).toISOString()
    });
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        steamid64: user.steamid64,
        points: user.points
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Session check error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Session check failed"
    });
  }
});

export { session_get as default };
//# sourceMappingURL=session.get.mjs.map
