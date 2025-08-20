import { d as defineEventHandler, r as readBody, g as getHeader, c as createError, u as useSession } from '../../../../nitro/nitro.mjs';
import { l as loginAdmin } from '../../../../_/admin-auth.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:url';
import 'bcryptjs';
import '../../../../_/database.mjs';
import 'mysql2/promise';
import 'dotenv';

const login_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    const body = await readBody(event);
    const { username, password } = body;
    const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || getHeader(event, "cf-connecting-ip") || ((_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.connection) == null ? void 0 : _c.remoteAddress) || ((_f = (_e = (_d = event.node) == null ? void 0 : _d.req) == null ? void 0 : _e.socket) == null ? void 0 : _f.remoteAddress) || "127.0.0.1";
    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Username and password are required"
      });
    }
    const admin = await loginAdmin(username, password, ip);
    const sessionConfig = {
      maxAge: 24 * 60 * 60,
      // 24 hours
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-admin-session"
    };
    const session = await useSession(event, sessionConfig);
    await session.update({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      loginTime: (/* @__PURE__ */ new Date()).toISOString(),
      ip,
      userAgent: getHeader(event, "user-agent") || "Unknown"
    });
    console.log("\u2705 Admin logged in successfully:", admin.username);
    return {
      success: true,
      message: "Login successful",
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    };
  } catch (error) {
    console.error("Admin login error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 401,
      statusMessage: error.message || "Login failed"
    });
  }
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
