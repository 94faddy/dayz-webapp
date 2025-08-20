import { d as defineEventHandler, u as useSession, c as createError } from '../../../nitro/nitro.mjs';
import { s as sessionStore } from '../../../_/session-store.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:url';
import '../../../_/database.mjs';
import 'mysql2/promise';
import 'dotenv';
import 'crypto';

const logout_post = defineEventHandler(async (event) => {
  var _a, _b;
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-session"
    });
    const sessionId = session.id;
    const userId = (_b = (_a = session.data) == null ? void 0 : _a.user) == null ? void 0 : _b.id;
    await session.clear();
    if (sessionId) {
      await sessionStore.deleteSession(sessionId);
    }
    if (userId) {
      console.log("\u2705 User logged out successfully:", userId);
    }
    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    console.error("Logout error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Logout failed"
    });
  }
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
