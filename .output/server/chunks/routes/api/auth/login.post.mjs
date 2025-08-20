import { d as defineEventHandler, r as readBody, g as getHeader, c as createError, u as useSession } from '../../../nitro/nitro.mjs';
import { loginUser } from '../../../_/auth.mjs';
import { s as sessionStore } from '../../../_/session-store.mjs';
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
import 'crypto';

const login_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    const body = await readBody(event);
    const { email, password } = body;
    const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || getHeader(event, "cf-connecting-ip") || ((_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.connection) == null ? void 0 : _c.remoteAddress) || ((_f = (_e = (_d = event.node) == null ? void 0 : _d.req) == null ? void 0 : _e.socket) == null ? void 0 : _f.remoteAddress) || "127.0.0.1";
    const macAddress = getHeader(event, "x-mac-address") || null;
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email and password are required"
      });
    }
    const result = await loginUser(email, password, ip, macAddress);
    if (result.status === "pending_approval") {
      return {
        success: false,
        status: "pending_approval",
        message: result.message,
        user: result.user
      };
    }
    const user = result.user;
    try {
      const sessionConfig = {
        maxAge: 24 * 60 * 60,
        // 24 hours
        password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        name: "dayz-session"
      };
      const session = await useSession(event, sessionConfig);
      const sessionData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          points: user.points
        },
        isAdmin: false,
        loginTime: (/* @__PURE__ */ new Date()).toISOString(),
        ip,
        userAgent: getHeader(event, "user-agent") || "Unknown",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastAccess: (/* @__PURE__ */ new Date()).toISOString()
      };
      await session.update(sessionData);
      const sessionId = session.id || sessionStore.generateSessionId();
      const sessionSaved = await sessionStore.saveSession(
        sessionId,
        sessionData,
        sessionConfig.maxAge
      );
      if (!sessionSaved) {
        console.warn("\u26A0\uFE0F Session saved to memory but failed to save to database");
      }
      console.log("\u2705 Session created successfully for user:", user.email);
    } catch (sessionError) {
      console.error("\u274C Session creation failed:", sessionError);
      throw createError({
        statusCode: 500,
        statusMessage: "Session creation failed. Please try again."
      });
    }
    return {
      success: true,
      message: "Login successful",
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
    console.error("Login error:", error);
    throw createError({
      statusCode: 401,
      statusMessage: error.message || "Login failed"
    });
  }
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
