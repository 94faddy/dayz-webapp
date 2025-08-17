// utils/session-store.js
import { executeQuery } from './database.js'
import crypto from 'crypto'

export class DatabaseSessionStore {
  constructor() {
    this.tableName = 'sessions'
    this.isCleanupStarted = false
    
    // เริ่ม cleanup service หากยังไม่เริ่ม
    if (process.server && !this.isCleanupStarted) {
      this.startCleanupService()
    }
  }

  // เริ่ม cleanup service
  startCleanupService() {
    if (this.isCleanupStarted) return
    
    console.log('🔧 Starting session cleanup service...')
    
    // ทำ cleanup ทันทีเมื่อเริ่ม
    this.cleanupExpiredSessions()
      .then(deletedCount => {
        console.log(`🧹 Initial cleanup: removed ${deletedCount} expired sessions`)
      })
      .catch(error => {
        console.error('❌ Initial session cleanup error:', error)
      })
    
    // ตั้ง interval ทำ cleanup ทุก 30 นาที
    setInterval(async () => {
      try {
        const deletedCount = await this.cleanupExpiredSessions()
        if (deletedCount > 0) {
          console.log(`🧹 Cleaned up ${deletedCount} expired sessions`)
        }
      } catch (error) {
        console.error('❌ Session cleanup error:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    this.isCleanupStarted = true
    console.log('✅ Session cleanup service started')
  }

  // สร้าง session ID ใหม่
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex')
  }

  // บันทึก session ลง database
  async saveSession(sessionId, sessionData, maxAge) {
    try {
      const expires = new Date(Date.now() + maxAge * 1000)
      const data = JSON.stringify(sessionData)
      
      const query = `
        INSERT INTO ${this.tableName} (session_id, expires, data)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        expires = VALUES(expires),
        data = VALUES(data)
      `
      
      await executeQuery(query, [sessionId, expires.getTime(), data])
      console.log('✅ Session saved to database:', sessionId)
      
      return true
    } catch (error) {
      console.error('❌ Failed to save session:', error)
      return false
    }
  }

  // ดึง session จาก database
  async getSession(sessionId) {
    try {
      const query = `
        SELECT expires, data 
        FROM ${this.tableName} 
        WHERE session_id = ? AND expires > ?
      `
      
      const results = await executeQuery(query, [sessionId, Date.now()])
      
      if (results.length === 0) {
        return null
      }
      
      const session = results[0]
      return JSON.parse(session.data)
    } catch (error) {
      console.error('❌ Failed to get session:', error)
      return null
    }
  }

  // ลบ session จาก database
  async deleteSession(sessionId) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE session_id = ?`
      await executeQuery(query, [sessionId])
      console.log('✅ Session deleted from database:', sessionId)
      return true
    } catch (error) {
      console.error('❌ Failed to delete session:', error)
      return false
    }
  }

  // ล้าง sessions ที่หมดอายุ
  async cleanupExpiredSessions() {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE expires <= ?`
      const result = await executeQuery(query, [Date.now()])
      return result.affectedRows || 0
    } catch (error) {
      console.error('❌ Failed to cleanup sessions:', error)
      return 0
    }
  }

  // ดึง sessions ทั้งหมดของ user
  async getUserSessions(userId) {
    try {
      const query = `
        SELECT session_id, expires, data 
        FROM ${this.tableName} 
        WHERE JSON_EXTRACT(data, '$.user.id') = ? AND expires > ?
      `
      
      const results = await executeQuery(query, [userId, Date.now()])
      
      return results.map(session => ({
        sessionId: session.session_id,
        expires: new Date(session.expires),
        data: JSON.parse(session.data)
      }))
    } catch (error) {
      console.error('❌ Failed to get user sessions:', error)
      return []
    }
  }

  // ลบ sessions ทั้งหมดของ user (สำหรับ logout all devices)
  async deleteUserSessions(userId) {
    try {
      const query = `
        DELETE FROM ${this.tableName} 
        WHERE JSON_EXTRACT(data, '$.user.id') = ?
      `
      
      const result = await executeQuery(query, [userId])
      console.log(`✅ Deleted ${result.affectedRows} sessions for user:`, userId)
      return result.affectedRows || 0
    } catch (error) {
      console.error('❌ Failed to delete user sessions:', error)
      return 0
    }
  }
}

// Export singleton instance
export const sessionStore = new DatabaseSessionStore()