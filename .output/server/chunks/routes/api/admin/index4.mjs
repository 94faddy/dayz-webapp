import { d as defineEventHandler, g as getHeader, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { executeQuery } from '../../../_/database.mjs';
import { r as requireAdminAuth } from '../../../_/admin-middleware.mjs';
import { h as hasAdminPermission, a as logAdminActivity } from '../../../_/admin-auth.mjs';
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
import 'bcryptjs';

const index = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const admin = await requireAdminAuth(event);
  const method = event.node.req.method;
  const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || ((_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.connection) == null ? void 0 : _c.remoteAddress) || "127.0.0.1";
  switch (method) {
    case "GET":
      return await getSettings(admin);
    case "PUT":
      return await updateSettings(event, admin, ip);
    default:
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed"
      });
  }
});
async function getSettings(admin) {
  if (!await hasAdminPermission(admin.id, "settings:read")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  try {
    const serverConfig = await executeQuery("SELECT * FROM server_config");
    const config = {};
    serverConfig.forEach((row) => {
      config[row.config_key] = row.config_value;
    });
    const systemSettings = await executeQuery('SELECT * FROM system_settings WHERE category != "internal"');
    const settings = {};
    systemSettings.forEach((row) => {
      if (!settings[row.category]) {
        settings[row.category] = {};
      }
      settings[row.category][row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        description: row.description,
        is_public: row.is_public
      };
    });
    return {
      success: true,
      serverConfig: config,
      systemSettings: settings
    };
  } catch (error) {
    console.error("Failed to get settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to load settings"
    });
  }
}
async function updateSettings(event, admin, ip) {
  if (!await hasAdminPermission(admin.id, "settings:write")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  const body = await readBody(event);
  const { type, key, value } = body;
  try {
    let oldValue = null;
    if (type === "server_config") {
      const [current] = await executeQuery(
        "SELECT config_value FROM server_config WHERE config_key = ?",
        [key]
      );
      oldValue = current ? current.config_value : null;
      await executeQuery(
        `INSERT INTO server_config (config_key, config_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [key, value]
      );
      if (key === "auto_approve_users") {
        if (value === "true") {
          const pendingUsers = await executeQuery(
            "SELECT id, email FROM users WHERE is_active = FALSE AND is_banned = FALSE"
          );
          if (pendingUsers.length > 0) {
            await executeQuery(
              "UPDATE users SET is_active = TRUE WHERE is_active = FALSE AND is_banned = FALSE"
            );
            console.log(`\u2705 Auto-approved ${pendingUsers.length} pending users`);
            await logAdminActivity(
              admin.id,
              "auto_approve_enabled",
              "setting",
              null,
              `Enabled auto-approval and approved ${pendingUsers.length} pending users`,
              { auto_approve: false, pending_count: pendingUsers.length },
              { auto_approve: true, approved_count: pendingUsers.length },
              ip
            );
          }
        }
      }
    } else if (type === "system_settings") {
      const [current] = await executeQuery(
        "SELECT setting_value FROM system_settings WHERE setting_key = ?",
        [key]
      );
      oldValue = current ? current.setting_value : null;
      await executeQuery(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value),
         updated_by = VALUES(updated_by)`,
        [key, value, admin.id]
      );
    }
    await logAdminActivity(
      admin.id,
      "update_setting",
      "setting",
      null,
      `Updated ${type}: ${key}`,
      { [key]: oldValue },
      { [key]: value },
      ip
    );
    return {
      success: true,
      message: "Setting updated successfully",
      key,
      value
    };
  } catch (error) {
    console.error("Failed to update setting:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update setting"
    });
  }
}

export { index as default };
//# sourceMappingURL=index4.mjs.map
