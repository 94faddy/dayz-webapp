import { d as defineEventHandler, r as readBody, g as getHeader } from '../../../nitro/nitro.mjs';
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

const stats_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    const body = await readBody(event);
    const {
      userId,
      sessionToken,
      updateDuration,
      filesUpdated,
      bytesDownloaded,
      cacheHits,
      cacheMisses,
      launcherVersion,
      timestamp
    } = body;
    const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || getHeader(event, "cf-connecting-ip") || ((_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.connection) == null ? void 0 : _c.remoteAddress) || ((_f = (_e = (_d = event.node) == null ? void 0 : _d.req) == null ? void 0 : _e.socket) == null ? void 0 : _f.remoteAddress) || "127.0.0.1";
    if (!userId || !sessionToken) {
      return {
        success: false,
        message: "User ID and session token are required",
        code: "INVALID_INPUT"
      };
    }
    const userQuery = `
      SELECT id, email, name, is_active, is_banned
      FROM users 
      WHERE id = ? AND is_active = TRUE AND is_banned = FALSE
    `;
    const users = await executeQuery(userQuery, [userId]);
    if (users.length === 0) {
      return {
        success: false,
        message: "User not found or inactive",
        code: "USER_NOT_FOUND"
      };
    }
    const user = users[0];
    const statsQuery = `
      INSERT INTO launcher_statistics (
        user_id, 
        session_token, 
        update_duration, 
        files_updated, 
        bytes_downloaded, 
        cache_hits, 
        cache_misses, 
        launcher_version, 
        ip_address,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    await executeQuery(statsQuery, [
      userId,
      sessionToken,
      updateDuration || 0,
      filesUpdated || 0,
      bytesDownloaded || 0,
      cacheHits || 0,
      cacheMisses || 0,
      launcherVersion || "Unknown",
      ip
    ]);
    const updateUserQuery = `
      UPDATE users 
      SET last_launcher_activity = NOW(), last_ip = ?
      WHERE id = ?
    `;
    await executeQuery(updateUserQuery, [ip, userId]);
    console.log(`\u{1F4CA} Launcher stats saved for user: ${user.name} (${user.email})`);
    console.log(`   Files updated: ${filesUpdated}, Bytes: ${bytesDownloaded}, Duration: ${updateDuration}s`);
    return {
      success: true,
      message: "Statistics saved successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  } catch (error) {
    console.error("\u274C Launcher stats error:", error);
    return {
      success: false,
      message: "Failed to save statistics",
      code: "SERVER_ERROR"
    };
  }
});

export { stats_post as default };
//# sourceMappingURL=stats.post.mjs.map
