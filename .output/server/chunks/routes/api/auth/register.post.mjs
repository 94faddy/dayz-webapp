import { d as defineEventHandler, r as readBody, g as getHeader, c as createError } from '../../../nitro/nitro.mjs';
import { validateEmail, validateSteamID64, checkBanStatus, checkUserExists, createUser } from '../../../_/auth.mjs';
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

const register_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    const body = await readBody(event);
    const { email, name, steamid64, password, confirmPassword } = body;
    const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || getHeader(event, "cf-connecting-ip") || ((_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.connection) == null ? void 0 : _c.remoteAddress) || ((_f = (_e = (_d = event.node) == null ? void 0 : _d.req) == null ? void 0 : _e.socket) == null ? void 0 : _f.remoteAddress) || "127.0.0.1";
    const macAddress = getHeader(event, "x-mac-address") || null;
    if (!email || !name || !steamid64 || !password || !confirmPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "All fields are required"
      });
    }
    if (password !== confirmPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "Passwords do not match"
      });
    }
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: "Password must be at least 6 characters"
      });
    }
    if (!await validateEmail(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid email format"
      });
    }
    if (!await validateSteamID64(steamid64)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Steam ID64 format"
      });
    }
    if (name.length < 3 || name.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name must be between 3-50 characters"
      });
    }
    const banStatus = await checkBanStatus(ip, macAddress, steamid64);
    if (banStatus) {
      throw createError({
        statusCode: 403,
        statusMessage: `Registration blocked: ${banStatus.reason}`
      });
    }
    const existingUser = await checkUserExists(email, steamid64);
    if (existingUser) {
      if (existingUser.email === email) {
        throw createError({
          statusCode: 400,
          statusMessage: "Email already registered"
        });
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: "Steam ID64 already registered"
        });
      }
    }
    const userId = await createUser({
      email,
      name,
      steamid64,
      password,
      ip,
      macAddress
    });
    return {
      success: true,
      message: "Registration successful! Please wait for admin approval.",
      userId
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Registration error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Registration failed"
    });
  }
});

export { register_post as default };
//# sourceMappingURL=register.post.mjs.map
