import { d as defineEventHandler, g as getHeader, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { executeQuery } from '../../../_/database.mjs';
import { r as requireAdminAuth } from '../../../_/admin-middleware.mjs';
import { a as logAdminActivity, h as hasAdminPermission } from '../../../_/admin-auth.mjs';
import bcrypt from 'bcryptjs';
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

const index = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const admin = await requireAdminAuth(event);
  const method = event.node.req.method;
  const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || ((_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.connection) == null ? void 0 : _c.remoteAddress) || "127.0.0.1";
  switch (method) {
    case "GET":
      return await getUsers(admin);
    case "PUT":
      return await updateUser(event, admin, ip);
    case "POST":
      return await performUserAction(event, admin, ip);
    case "DELETE":
      return await deleteUser(event, admin, ip);
    default:
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed"
      });
  }
});
async function getUsers(admin) {
  if (!await hasAdminPermission(admin.id, "users:read")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  const query = `
    SELECT 
      u.id,
      u.email,
      u.name,
      u.steamid64,
      u.points,
      u.is_active,
      u.is_banned,
      u.banned_reason,
      u.last_login,
      u.last_ip,
      u.mac_address,
      u.registration_ip,
      u.registration_mac,
      u.launcher_login_count,
      u.last_launcher_activity,
      u.created_at,
      u.updated_at,
      (SELECT COUNT(*) FROM user_purchases WHERE user_id = u.id) as total_purchases,
      (SELECT SUM(total_price) FROM user_purchases WHERE user_id = u.id AND status = 'completed') as total_spent
    FROM users u
    ORDER BY u.created_at DESC
  `;
  const users = await executeQuery(query);
  const bannedUserIds = users.filter((u) => u.is_banned).map((u) => u.id);
  let banRecords = {};
  if (bannedUserIds.length > 0) {
    const banQuery = `
      SELECT * FROM ban_records 
      WHERE user_id IN (${bannedUserIds.map(() => "?").join(",")}) 
      AND is_active = TRUE
      ORDER BY created_at DESC
    `;
    const bans = await executeQuery(banQuery, bannedUserIds);
    bans.forEach((ban) => {
      if (!banRecords[ban.user_id]) {
        banRecords[ban.user_id] = [];
      }
      banRecords[ban.user_id].push(ban);
    });
  }
  return {
    success: true,
    users: users.map((user) => ({
      ...user,
      banRecords: banRecords[user.id] || []
    }))
  };
}
async function updateUser(event, admin, ip) {
  if (!await hasAdminPermission(admin.id, "users:write")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  const body = await readBody(event);
  const { userId, field, value } = body;
  const [currentUser] = await executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
  if (!currentUser) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found"
    });
  }
  let updateQuery = "";
  let params = [];
  let oldValue = currentUser[field];
  switch (field) {
    case "name":
    case "email":
    case "steamid64":
      updateQuery = `UPDATE users SET ${field} = ? WHERE id = ?`;
      params = [value, userId];
      break;
    case "points":
      const pointChange = parseInt(value) - currentUser.points;
      updateQuery = "UPDATE users SET points = ? WHERE id = ?";
      params = [parseInt(value), userId];
      await executeQuery(
        `INSERT INTO point_transactions (user_id, amount, type, description)
         VALUES (?, ?, 'admin_adjust', ?)`,
        [userId, pointChange, `Admin adjustment by ${admin.username}`]
      );
      break;
    case "is_active":
    case "is_banned":
      updateQuery = `UPDATE users SET ${field} = ? WHERE id = ?`;
      params = [value ? 1 : 0, userId];
      break;
    case "password":
      const hashedPassword = await bcrypt.hash(value, 10);
      updateQuery = "UPDATE users SET password = ? WHERE id = ?";
      params = [hashedPassword, userId];
      oldValue = "[HIDDEN]";
      break;
    default:
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid field"
      });
  }
  await executeQuery(updateQuery, params);
  await logAdminActivity(
    admin.id,
    "update_user",
    "user",
    userId,
    `Updated user ${field}: ${currentUser.email}`,
    { [field]: oldValue },
    { [field]: value },
    ip
  );
  return {
    success: true,
    message: "User updated successfully"
  };
}
async function performUserAction(event, admin, ip) {
  const body = await readBody(event);
  const { action, userId, data } = body;
  switch (action) {
    case "ban":
      return await banUser(userId, data, admin, ip);
    case "unban":
      return await unbanUser(userId, admin, ip);
    case "approve":
      return await approveUser(userId, admin, ip);
    case "add_points":
      return await addPoints(userId, data.amount, data.reason, admin, ip);
    default:
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid action"
      });
  }
}
async function banUser(userId, data, admin, ip) {
  if (!await hasAdminPermission(admin.id, "users:ban")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  const { reason, duration, banIp, banMac } = data;
  const [user] = await executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found"
    });
  }
  let bannedUntil = null;
  if (duration && duration !== "permanent") {
    const durationHours = parseInt(duration);
    bannedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1e3);
  }
  await executeQuery(
    "UPDATE users SET is_banned = TRUE, banned_reason = ? WHERE id = ?",
    [reason, userId]
  );
  await executeQuery(
    `INSERT INTO ban_records (user_id, ip_address, mac_address, reason, banned_by, banned_until, is_active)
     VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
    [
      userId,
      banIp ? user.last_ip : null,
      banMac ? user.mac_address : null,
      reason,
      admin.id,
      bannedUntil
    ]
  );
  await logAdminActivity(
    admin.id,
    "ban_user",
    "user",
    userId,
    `Banned user: ${user.email}`,
    { is_banned: false },
    { is_banned: true, reason, duration },
    ip
  );
  return {
    success: true,
    message: "User banned successfully"
  };
}
async function unbanUser(userId, admin, ip) {
  if (!await hasAdminPermission(admin.id, "users:ban")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  const [user] = await executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found"
    });
  }
  await executeQuery(
    "UPDATE users SET is_banned = FALSE, banned_reason = NULL WHERE id = ?",
    [userId]
  );
  await executeQuery(
    "UPDATE ban_records SET is_active = FALSE WHERE user_id = ?",
    [userId]
  );
  await logAdminActivity(
    admin.id,
    "unban_user",
    "user",
    userId,
    `Unbanned user: ${user.email}`,
    { is_banned: true },
    { is_banned: false },
    ip
  );
  return {
    success: true,
    message: "User unbanned successfully"
  };
}
async function approveUser(userId, admin, ip) {
  if (!await hasAdminPermission(admin.id, "users:write")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  const [user] = await executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found"
    });
  }
  await executeQuery(
    "UPDATE users SET is_active = TRUE WHERE id = ?",
    [userId]
  );
  await logAdminActivity(
    admin.id,
    "approve_user",
    "user",
    userId,
    `Approved user: ${user.email}`,
    { is_active: false },
    { is_active: true },
    ip
  );
  return {
    success: true,
    message: "User approved successfully"
  };
}
async function addPoints(userId, amount, reason, admin, ip) {
  if (!await hasAdminPermission(admin.id, "users:write")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Permission denied"
    });
  }
  const [user] = await executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found"
    });
  }
  await executeQuery(
    "UPDATE users SET points = points + ? WHERE id = ?",
    [amount, userId]
  );
  await executeQuery(
    `INSERT INTO point_transactions (user_id, amount, type, description)
     VALUES (?, ?, 'admin_adjust', ?)`,
    [userId, amount, reason || `Admin adjustment by ${admin.username}`]
  );
  await logAdminActivity(
    admin.id,
    "adjust_points",
    "user",
    userId,
    `Adjusted points for user: ${user.email}`,
    { points: user.points },
    { points: user.points + amount, change: amount },
    ip
  );
  return {
    success: true,
    message: "Points adjusted successfully",
    newBalance: user.points + amount
  };
}
async function deleteUser(event, admin, ip) {
  if (admin.role !== "super_admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Only super admin can delete users"
    });
  }
  const { userId } = await readBody(event);
  const [user] = await executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found"
    });
  }
  await executeQuery("DELETE FROM users WHERE id = ?", [userId]);
  await logAdminActivity(
    admin.id,
    "delete_user",
    "user",
    userId,
    `Deleted user: ${user.email}`,
    user,
    null,
    ip
  );
  return {
    success: true,
    message: "User deleted successfully"
  };
}

export { index as default };
//# sourceMappingURL=index5.mjs.map
