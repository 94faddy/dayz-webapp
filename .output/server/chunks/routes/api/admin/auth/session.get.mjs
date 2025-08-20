import { d as defineEventHandler, u as useSession, c as createError } from '../../../../nitro/nitro.mjs';
import { executeQuery } from '../../../../_/database.mjs';
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
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-admin-session"
    });
    if (!session.data || !session.data.admin) {
      throw createError({
        statusCode: 401,
        statusMessage: "No active admin session"
      });
    }
    const adminId = session.data.admin.id;
    const query = `
      SELECT id, username, email, role, permissions, is_active
      FROM admin_users 
      WHERE id = ? AND is_active = TRUE
    `;
    const admins = await executeQuery(query, [adminId]);
    if (admins.length === 0) {
      await session.clear();
      throw createError({
        statusCode: 401,
        statusMessage: "Admin not found or inactive"
      });
    }
    const admin = admins[0];
    let permissions = {};
    if (admin.permissions) {
      try {
        permissions = typeof admin.permissions === "string" ? JSON.parse(admin.permissions) : admin.permissions;
      } catch (e) {
        console.error("Failed to parse permissions:", e);
      }
    }
    await session.update({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions
      },
      loginTime: session.data.loginTime,
      ip: session.data.ip,
      lastAccess: (/* @__PURE__ */ new Date()).toISOString()
    });
    return {
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Admin session check error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Session check failed"
    });
  }
});

export { session_get as default };
//# sourceMappingURL=session.get.mjs.map
