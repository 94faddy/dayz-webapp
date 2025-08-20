import { d as defineEventHandler, a as getQuery, c as createError } from '../../../nitro/nitro.mjs';
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

const historical_get = defineEventHandler(async (event) => {
  try {
    console.log("\u{1F3C6} Historical leaderboard API called");
    const query = getQuery(event);
    const view = query.view || "current";
    const limit = parseInt(query.limit) || 100;
    console.log("\u{1F4CA} Request params:", { view, limit });
    await ensureHistoricalTableExists();
    let leaderboardData;
    if (view === "all_time") {
      leaderboardData = await fetchAllTimeBestData(limit);
    } else {
      leaderboardData = await fetchCurrentRankingsData(limit);
    }
    return {
      success: true,
      data: leaderboardData.players,
      metadata: {
        totalPlayers: leaderboardData.totalPlayers,
        view,
        lastUpdated: leaderboardData.lastUpdated || (/* @__PURE__ */ new Date()).toISOString(),
        source: "historical_database"
      }
    };
  } catch (error) {
    console.error("\u274C Historical leaderboard API error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to fetch historical leaderboard"
    });
  }
});
async function ensureHistoricalTableExists() {
  try {
    await executeQuery("SELECT 1 FROM historical_rankings LIMIT 1");
    console.log("\u2705 Historical rankings table exists");
  } catch (error) {
    console.log("\u274C Historical rankings table not found, creating...");
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS historical_rankings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        steam_id VARCHAR(20) NOT NULL,
        player_name VARCHAR(255) NOT NULL,
        
        current_kdr DECIMAL(5,2) DEFAULT 0,
        current_kills INT DEFAULT 0,
        current_deaths INT DEFAULT 0,
        current_time_hours DECIMAL(8,2) DEFAULT 0,
        current_longest_shot DECIMAL(10,2) DEFAULT 0,
        current_zombie_kills INT DEFAULT 0,
        current_score DECIMAL(10,2) DEFAULT 0,
        
        best_kdr DECIMAL(5,2) DEFAULT 0,
        best_kills INT DEFAULT 0,
        best_time_hours DECIMAL(8,2) DEFAULT 0,
        best_longest_shot DECIMAL(10,2) DEFAULT 0,
        best_zombie_kills INT DEFAULT 0,
        best_score DECIMAL(10,2) DEFAULT 0,
        best_rank INT DEFAULT 999999,
        
        peak_score DECIMAL(10,2) DEFAULT 0,
        peak_rank INT DEFAULT 999999,
        peak_achieved_at DATETIME NULL,
        last_seen DATETIME NULL,
        
        total_updates INT DEFAULT 0,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_steam_id (steam_id),
        INDEX idx_current_score (current_score DESC),
        INDEX idx_peak_score (peak_score DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await executeQuery(createTableSQL);
    console.log("\u2705 Historical rankings table created");
  }
}
async function fetchCurrentRankingsData(limit) {
  try {
    console.log("\u{1F4CA} Fetching current rankings from database...");
    const countResult = await executeQuery("SELECT COUNT(*) as count FROM historical_rankings");
    const totalCount = countResult[0].count;
    if (totalCount === 0) {
      console.log("\u2139\uFE0F No data in historical_rankings table");
      return {
        players: [],
        totalPlayers: 0,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const playersQuery = `
      SELECT 
        hr.*,
        CASE 
          WHEN hr.current_score >= hr.peak_score THEN 1
          ELSE 0
        END as is_peak_performance,
        CASE 
          WHEN hr.current_kdr >= hr.best_kdr THEN 1
          ELSE 0
        END as is_best_kdr_ever
      FROM historical_rankings hr
      WHERE hr.player_name IS NOT NULL 
      AND hr.player_name != 'Unknown Player'
      AND hr.current_score > 0
      ORDER BY hr.current_score DESC, hr.current_kdr DESC, hr.current_kills DESC
      LIMIT ${limit}
    `;
    const players = await executeQuery(playersQuery);
    const statsQuery = `
      SELECT 
        COUNT(*) as total_players,
        MAX(updated_at) as last_updated
      FROM historical_rankings
      WHERE player_name IS NOT NULL 
      AND player_name != 'Unknown Player'
      AND current_score > 0
    `;
    const statsResult = await executeQuery(statsQuery);
    const stats = statsResult[0] || { total_players: 0, last_updated: null };
    console.log(`\u2705 Current rankings loaded: ${players.length} players`);
    return {
      players,
      totalPlayers: stats.total_players,
      lastUpdated: stats.last_updated
    };
  } catch (error) {
    console.error("\u274C Current rankings fetch error:", error);
    throw error;
  }
}
async function fetchAllTimeBestData(limit) {
  try {
    console.log("\u{1F451} Fetching all-time best from database...");
    const countResult = await executeQuery("SELECT COUNT(*) as count FROM historical_rankings WHERE peak_score > 0");
    const totalCount = countResult[0].count;
    if (totalCount === 0) {
      console.log("\u2139\uFE0F No peak data in historical_rankings table");
      return {
        players: [],
        totalPlayers: 0,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const playersQuery = `
      SELECT 
        hr.*,
        1 as is_peak_performance,
        1 as is_best_kdr_ever
      FROM historical_rankings hr
      WHERE hr.player_name IS NOT NULL 
      AND hr.player_name != 'Unknown Player'
      AND hr.peak_score > 0
      ORDER BY hr.peak_score DESC, hr.best_kdr DESC, hr.best_kills DESC
      LIMIT ${limit}
    `;
    const players = await executeQuery(playersQuery);
    const statsQuery = `
      SELECT 
        COUNT(*) as total_players,
        MAX(peak_achieved_at) as last_updated
      FROM historical_rankings
      WHERE player_name IS NOT NULL 
      AND player_name != 'Unknown Player'
      AND peak_score > 0
    `;
    const statsResult = await executeQuery(statsQuery);
    const stats = statsResult[0] || { total_players: 0, last_updated: null };
    console.log(`\u2705 All-time best loaded: ${players.length} players`);
    return {
      players,
      totalPlayers: stats.total_players,
      lastUpdated: stats.last_updated
    };
  } catch (error) {
    console.error("\u274C All-time best fetch error:", error);
    throw error;
  }
}

export { historical_get as default };
//# sourceMappingURL=historical.get.mjs.map
