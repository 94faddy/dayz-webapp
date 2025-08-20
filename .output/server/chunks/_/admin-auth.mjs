import bcrypt from 'bcryptjs';
import { executeQuery } from './database.mjs';

async function loginAdmin(username, password, ip) {
  try {
    const query = `
      SELECT id, username, email, password, role, permissions, is_active
      FROM admin_users 
      WHERE (username = ? OR email = ?) AND is_active = TRUE
    `;
    const admins = await executeQuery(query, [username, username]);
    if (admins.length === 0) {
      throw new Error("Invalid credentials");
    }
    const admin = admins[0];
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      await logAdminActivity(null, "failed_login", null, null, `Failed login attempt for: ${username}`, null, null, ip);
      throw new Error("Invalid credentials");
    }
    await executeQuery(
      "UPDATE admin_users SET last_login = NOW(), last_ip = ? WHERE id = ?",
      [ip, admin.id]
    );
    await logAdminActivity(admin.id, "login", null, null, "Admin logged in", null, null, ip);
    let permissions = {};
    if (admin.permissions) {
      try {
        permissions = typeof admin.permissions === "string" ? JSON.parse(admin.permissions) : admin.permissions;
      } catch (e) {
        console.error("Failed to parse permissions:", e);
      }
    }
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions
    };
  } catch (error) {
    console.error("Admin login error:", error);
    throw error;
  }
}
async function logAdminActivity(adminId, action, targetType, targetId, description, oldData, newData, ipAddress, userAgent = null) {
  try {
    if (!adminId && action === "failed_login") {
      console.log("\u26A0\uFE0F Failed login attempt:", description);
      return;
    }
    const query = `
      INSERT INTO admin_activity_logs 
      (admin_id, action, target_type, target_id, description, old_data, new_data, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const oldDataJson = oldData ? JSON.stringify(oldData) : null;
    const newDataJson = newData ? JSON.stringify(newData) : null;
    await executeQuery(query, [
      adminId || null,
      action,
      targetType,
      targetId,
      description,
      oldDataJson,
      newDataJson,
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error("Failed to log admin activity:", error.message);
  }
}
async function hasAdminPermission(adminId, permission) {
  const query = `
    SELECT role, permissions 
    FROM admin_users 
    WHERE id = ? AND is_active = TRUE
  `;
  const result = await executeQuery(query, [adminId]);
  if (result.length === 0) return false;
  const admin = result[0];
  if (admin.role === "super_admin") return true;
  if (admin.permissions) {
    const permissions = typeof admin.permissions === "string" ? JSON.parse(admin.permissions) : admin.permissions;
    const [resource, action] = permission.split(":");
    return permissions[resource] === "all" || permissions[resource] === action || Array.isArray(permissions[resource]) && permissions[resource].includes(action);
  }
  return false;
}
async function createDefaultAdmin() {
  try {
    const existingAdmins = await executeQuery("SELECT COUNT(*) as count FROM admin_users");
    if (existingAdmins[0].count > 0) {
      console.log("\u2705 Admin users already exist");
      return;
    }
    const defaultPassword = await bcrypt.hash("admin123", 12);
    const query = `
      INSERT INTO admin_users (username, email, password, role, permissions, is_active)
      VALUES (?, ?, ?, 'super_admin', ?, TRUE)
    `;
    const permissions = JSON.stringify({
      users: "all",
      items: "all",
      orders: "all",
      settings: "all",
      logs: "all"
    });
    await executeQuery(query, [
      "admin",
      "admin@dayz.nightro.cc",
      defaultPassword,
      permissions
    ]);
    console.log("\u2705 Default admin created - Username: admin, Password: admin123");
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
}
{
  createDefaultAdmin();
}

export { logAdminActivity as a, hasAdminPermission as h, loginAdmin as l };
//# sourceMappingURL=admin-auth.mjs.map
