import { d as defineEventHandler, c as createError, b as useRuntimeConfig } from '../../../nitro/nitro.mjs';
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

const historicalSync_post = defineEventHandler(async (event) => {
  try {
    console.log("\u{1F504} Historical sync started");
    try {
      await executeQuery("SELECT 1 FROM historical_rankings LIMIT 1");
      console.log("\u2705 Historical rankings table exists");
    } catch (tableError) {
      console.log("\u274C Historical rankings table not found, creating...");
      await createHistoricalRankingsTable();
      console.log("\u2705 Historical rankings table created");
    }
    const rawData = await fetchPlayerDataFromDayZ();
    const result = await processAndSaveHistoricalData(rawData);
    return {
      success: true,
      message: "Historical sync completed successfully",
      ...result
    };
  } catch (error) {
    console.error("\u274C Historical sync error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Historical sync failed"
    });
  }
});
async function createHistoricalRankingsTable() {
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
}
async function fetchPlayerDataFromDayZ() {
  try {
    console.log("\u{1F4E1} Fetching data from DayZ Server...");
    const config = useRuntimeConfig();
    const dzsvApi = `${config.dzsvApi}/v1/leaderboard/raw`;
    const apiKey = config.dzsvApiKey || "fada233b805f23a37d141b5577241fac2a004f2bfc6607264e38e59a040b718d";
    console.log("\u{1F517} API URL:", dzsvApi);
    console.log("\u{1F511} Using API Key:", apiKey.substring(0, 8) + "...");
    const response = await $fetch(dzsvApi, {
      timeout: 15e3,
      headers: {
        "Accept": "application/json",
        "User-Agent": "DayZ-Historical-Sync/1.0",
        "X-API-Key": apiKey,
        "Authorization": `Bearer ${apiKey}`
      }
    });
    if (!response || typeof response !== "object") {
      console.error("\u274C Invalid response:", response);
      throw new Error("Invalid response from DayZ Server");
    }
    if (response.success === false) {
      console.error("\u274C API Error Response:", response);
      throw new Error(`API Error: ${response.message || response.error || "Unknown error"}`);
    }
    const playerData = response.data || response;
    console.log(`\u2705 Received data for ${Object.keys(playerData).length} players`);
    return playerData;
  } catch (error) {
    console.error("\u274C DayZ Server fetch error:", error);
    if (error.data) {
      console.error("\u274C Error response data:", error.data);
    }
    throw new Error(`Failed to fetch from DayZ Server: ${error.message}`);
  }
}
async function processAndSaveHistoricalData(rawData) {
  var _a, _b, _c, _d;
  let playersProcessed = 0;
  let newPlayers = 0;
  let updatedPlayers = 0;
  try {
    console.log("\u{1F4BE} Processing and saving historical data...");
    const playerStats = [];
    for (const [steamId, data] of Object.entries(rawData)) {
      const totalKills = ((_a = data.kills) == null ? void 0 : _a.length) || 0;
      const totalDeaths = ((_b = data.deaths) == null ? void 0 : _b.length) || 0;
      const kdr = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
      const timeHours = (data.timeSurvived || 0) / 3600;
      const score = calculateScore(kdr, totalKills, timeHours, data.longestShot || 0, data.zKilled || 0);
      playerStats.push({
        steamId,
        name: data.name || "Unknown Player",
        kdr: parseFloat(kdr.toFixed(2)),
        kills: totalKills,
        deaths: totalDeaths,
        timeHours: parseFloat(timeHours.toFixed(2)),
        longestShot: data.longestShot || 0,
        zombieKills: data.zKilled || 0,
        score: parseFloat(score.toFixed(2)),
        lastSeen: data.lastTimeSeen
      });
    }
    playerStats.sort((a, b) => b.score - a.score);
    for (let i = 0; i < playerStats.length; i++) {
      const player = playerStats[i];
      const currentRank = i + 1;
      const result = await savePlayerHistoricalData(player, currentRank);
      if (result.isNew) {
        newPlayers++;
      } else {
        updatedPlayers++;
      }
      playersProcessed++;
    }
    console.log(`\u2705 Processed ${playersProcessed} players (${newPlayers} new, ${updatedPlayers} updated)`);
    return {
      playersProcessed,
      newPlayers,
      updatedPlayers,
      topPlayer: ((_c = playerStats[0]) == null ? void 0 : _c.name) || "N/A",
      topScore: ((_d = playerStats[0]) == null ? void 0 : _d.score) || 0
    };
  } catch (error) {
    console.error("\u274C Processing error:", error);
    throw error;
  }
}
function calculateScore(kdr, kills, timeHours, longestShot, zombieKills) {
  const score = kdr * 100 + // KDR weight: 100
  kills * 10 + // Kills weight: 10
  timeHours * 2 + // Time weight: 2
  longestShot / 100 + // Shot bonus
  zombieKills / 10;
  return Math.max(0, score);
}
async function savePlayerHistoricalData(player, currentRank) {
  try {
    const existingData = await executeQuery(
      "SELECT * FROM historical_rankings WHERE steam_id = ?",
      [player.steamId]
    );
    const isNew = existingData.length === 0;
    const existing = existingData[0] || {};
    const newBestScore = player.score > (existing.best_score || 0);
    const newBestRank = currentRank < (existing.best_rank || 999999);
    const newPeakScore = player.score > (existing.peak_score || 0);
    let lastSeenDate = null;
    if (player.lastSeen) {
      try {
        const normalizedDate = player.lastSeen.replace(" ", "T");
        const dateObj = new Date(normalizedDate);
        if (!isNaN(dateObj.getTime())) {
          lastSeenDate = dateObj;
        }
      } catch (dateError) {
        console.warn("Invalid date format:", player.lastSeen);
      }
    }
    if (isNew) {
      await executeQuery(`
        INSERT INTO historical_rankings (
          steam_id, player_name, 
          current_kdr, current_kills, current_deaths, current_time_hours, 
          current_longest_shot, current_zombie_kills, current_score,
          best_kdr, best_kills, best_time_hours, best_longest_shot, 
          best_zombie_kills, best_score, best_rank,
          peak_score, peak_rank, peak_achieved_at, last_seen, total_updates
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        player.steamId,
        player.name,
        player.kdr,
        player.kills,
        player.deaths,
        player.timeHours,
        player.longestShot,
        player.zombieKills,
        player.score,
        player.kdr,
        player.kills,
        player.timeHours,
        player.longestShot,
        player.zombieKills,
        player.score,
        currentRank,
        player.score,
        currentRank,
        /* @__PURE__ */ new Date(),
        lastSeenDate,
        // ใช้ null ถ้าไม่มีข้อมูล
        1
      ]);
    } else {
      const updateParams = [
        player.name,
        player.kdr,
        player.kills,
        player.deaths,
        player.timeHours,
        player.longestShot,
        player.zombieKills,
        player.score,
        player.kdr,
        player.kills,
        player.timeHours,
        player.longestShot,
        player.zombieKills,
        player.score,
        currentRank,
        player.score
      ];
      let updateQuery = `
        UPDATE historical_rankings SET
          player_name = ?,
          current_kdr = ?, current_kills = ?, current_deaths = ?, 
          current_time_hours = ?, current_longest_shot = ?, 
          current_zombie_kills = ?, current_score = ?,
          best_kdr = GREATEST(best_kdr, ?),
          best_kills = GREATEST(best_kills, ?),
          best_time_hours = GREATEST(best_time_hours, ?),
          best_longest_shot = GREATEST(best_longest_shot, ?),
          best_zombie_kills = GREATEST(best_zombie_kills, ?),
          best_score = GREATEST(best_score, ?),
          best_rank = LEAST(best_rank, ?),
          peak_score = GREATEST(peak_score, ?)
      `;
      if (newPeakScore) {
        updateQuery += `, peak_rank = ?, peak_achieved_at = ?`;
        updateParams.push(currentRank, /* @__PURE__ */ new Date());
      }
      if (lastSeenDate) {
        updateQuery += `, last_seen = ?`;
        updateParams.push(lastSeenDate);
      }
      updateQuery += `, total_updates = total_updates + 1, updated_at = NOW() WHERE steam_id = ?`;
      updateParams.push(player.steamId);
      await executeQuery(updateQuery, updateParams);
    }
    return { isNew };
  } catch (error) {
    console.error(`\u274C Save error for player ${player.steamId}:`, error);
    throw error;
  }
}

export { historicalSync_post as default };
//# sourceMappingURL=historical-sync.post.mjs.map
