import { executeQuery } from './database.mjs';
import require$$1 from 'crypto';

class DatabaseSessionStore {
  constructor() {
    this.tableName = "sessions";
    this.isCleanupStarted = false;
    if (!this.isCleanupStarted) {
      this.startCleanupService();
    }
  }
  // เริ่ม cleanup service
  startCleanupService() {
    if (this.isCleanupStarted) return;
    console.log("\u{1F527} Starting session cleanup service...");
    this.cleanupExpiredSessions().then((deletedCount) => {
      console.log(`\u{1F9F9} Initial cleanup: removed ${deletedCount} expired sessions`);
    }).catch((error) => {
      console.error("\u274C Initial session cleanup error:", error);
    });
    setInterval(async () => {
      try {
        const deletedCount = await this.cleanupExpiredSessions();
        if (deletedCount > 0) {
          console.log(`\u{1F9F9} Cleaned up ${deletedCount} expired sessions`);
        }
      } catch (error) {
        console.error("\u274C Session cleanup error:", error);
      }
    }, 30 * 60 * 1e3);
    this.isCleanupStarted = true;
    console.log("\u2705 Session cleanup service started");
  }
  // สร้าง session ID ใหม่
  generateSessionId() {
    return require$$1.randomBytes(32).toString("hex");
  }
  // บันทึก session ลง database
  async saveSession(sessionId, sessionData, maxAge) {
    try {
      const expires = new Date(Date.now() + maxAge * 1e3);
      const data = JSON.stringify(sessionData);
      const query = `
        INSERT INTO ${this.tableName} (session_id, expires, data)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        expires = VALUES(expires),
        data = VALUES(data)
      `;
      await executeQuery(query, [sessionId, expires.getTime(), data]);
      console.log("\u2705 Session saved to database:", sessionId);
      return true;
    } catch (error) {
      console.error("\u274C Failed to save session:", error);
      return false;
    }
  }
  // ดึง session จาก database
  async getSession(sessionId) {
    try {
      const query = `
        SELECT expires, data 
        FROM ${this.tableName} 
        WHERE session_id = ? AND expires > ?
      `;
      const results = await executeQuery(query, [sessionId, Date.now()]);
      if (results.length === 0) {
        return null;
      }
      const session = results[0];
      return JSON.parse(session.data);
    } catch (error) {
      console.error("\u274C Failed to get session:", error);
      return null;
    }
  }
  // ลบ session จาก database
  async deleteSession(sessionId) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE session_id = ?`;
      await executeQuery(query, [sessionId]);
      console.log("\u2705 Session deleted from database:", sessionId);
      return true;
    } catch (error) {
      console.error("\u274C Failed to delete session:", error);
      return false;
    }
  }
  // ล้าง sessions ที่หมดอายุ
  async cleanupExpiredSessions() {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE expires <= ?`;
      const result = await executeQuery(query, [Date.now()]);
      return result.affectedRows || 0;
    } catch (error) {
      console.error("\u274C Failed to cleanup sessions:", error);
      return 0;
    }
  }
  // ดึง sessions ทั้งหมดของ user
  async getUserSessions(userId) {
    try {
      const query = `
        SELECT session_id, expires, data 
        FROM ${this.tableName} 
        WHERE JSON_EXTRACT(data, '$.user.id') = ? AND expires > ?
      `;
      const results = await executeQuery(query, [userId, Date.now()]);
      return results.map((session) => ({
        sessionId: session.session_id,
        expires: new Date(session.expires),
        data: JSON.parse(session.data)
      }));
    } catch (error) {
      console.error("\u274C Failed to get user sessions:", error);
      return [];
    }
  }
  // ลบ sessions ทั้งหมดของ user (สำหรับ logout all devices)
  async deleteUserSessions(userId) {
    try {
      const query = `
        DELETE FROM ${this.tableName} 
        WHERE JSON_EXTRACT(data, '$.user.id') = ?
      `;
      const result = await executeQuery(query, [userId]);
      console.log(`\u2705 Deleted ${result.affectedRows} sessions for user:`, userId);
      return result.affectedRows || 0;
    } catch (error) {
      console.error("\u274C Failed to delete user sessions:", error);
      return 0;
    }
  }
}
const sessionStore = new DatabaseSessionStore();

export { sessionStore as s };
//# sourceMappingURL=session-store.mjs.map
