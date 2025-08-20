import { d as defineEventHandler, u as useSession, g as getHeader, c as createError } from '../../../../nitro/nitro.mjs';
import { a as logAdminActivity } from '../../../../_/admin-auth.mjs';
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

const logout_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e;
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-admin-session"
    });
    const adminId = (_b = (_a = session.data) == null ? void 0 : _a.admin) == null ? void 0 : _b.id;
    const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || ((_e = (_d = (_c = event.node) == null ? void 0 : _c.req) == null ? void 0 : _d.connection) == null ? void 0 : _e.remoteAddress) || "127.0.0.1";
    if (adminId) {
      await logAdminActivity(adminId, "logout", null, null, "Admin logged out", null, null, ip);
    }
    await session.clear();
    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    console.error("Admin logout error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Logout failed"
    });
  }
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
