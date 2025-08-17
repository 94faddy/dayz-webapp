// utils/database.js
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export async function executeQuery(query, params = []) {
  let connection = null
  try {
    // สร้าง connection ใหม่ทุกครั้ง
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dayz_webapp',
      charset: 'utf8mb4',
      timezone: '+07:00'
      // เอา invalid config options ออก
    })
    
    const [results] = await connection.execute(query, params)
    return results
    
  } catch (error) {
    console.error('❌ Database query error:', error.message)
    throw error
  } finally {
    // ปิด connection ทุกครั้งหลังใช้งาน
    if (connection) {
      try {
        await connection.end()
      } catch (closeError) {
        console.error('❌ Error closing connection:', closeError.message)
      }
    }
  }
}

// Legacy functions for compatibility
export async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dayz_webapp',
    charset: 'utf8mb4',
    timezone: '+07:00'
  })
}

export async function closeConnection() {
  // No-op since we close connections after each query
  console.log('Connection management handled per query')
}