import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
async function executeQuery(query, params = []) {
  let connection = null;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "dayz_webapp",
      charset: "utf8mb4",
      timezone: "+07:00"
      // เอา invalid config options ออก
    });
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error("\u274C Database query error:", error.message);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error("\u274C Error closing connection:", closeError.message);
      }
    }
  }
}

export { executeQuery };
//# sourceMappingURL=database.mjs.map
