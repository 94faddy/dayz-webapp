import { d as defineEventHandler, b as useRuntimeConfig, g as getHeader, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
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

const webhook_post = defineEventHandler(async (event) => {
  try {
    console.log("\u{1F3AF} Leaderboard webhook received");
    const config = useRuntimeConfig();
    const authHeader = getHeader(event, "authorization");
    const expectedToken = config.webhookSecret || "dayz-webhook-secret";
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn("\u26A0\uFE0F Unauthorized webhook attempt");
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized"
      });
    }
    const body = await readBody(event);
    console.log("\u{1F4E6} Webhook data received:", Object.keys(body).length, "players");
    if (!body || typeof body !== "object") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid data format"
      });
    }
    const saveResult = await saveLeaderboardData(body);
    console.log("\u2705 Webhook processed successfully:", saveResult.playersProcessed, "players");
    return {
      success: true,
      message: "Leaderboard data updated successfully",
      playersProcessed: saveResult.playersProcessed,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (error) {
    console.error("\u274C Webhook error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process webhook data"
    });
  }
});
async function saveLeaderboardData(rawData) {
  var _a, _b, _c;
  const timestamp = /* @__PURE__ */ new Date();
  let playersProcessed = 0;
  try {
    for (const [steamId, playerData] of Object.entries(rawData)) {
      const totalKills = ((_a = playerData.kills) == null ? void 0 : _a.length) || 0;
      const totalDeaths = ((_b = playerData.deaths) == null ? void 0 : _b.length) || 0;
      const kdr = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
      let lastSeenDate = null;
      if (playerData.lastTimeSeen) {
        try {
          lastSeenDate = new Date(playerData.lastTimeSeen.replace(" ", "T"));
          if (isNaN(lastSeenDate.getTime())) {
            lastSeenDate = null;
          }
        } catch (dateError) {
          console.warn("Invalid date format:", playerData.lastTimeSeen);
          lastSeenDate = null;
        }
      }
      const leaderboardData = {
        steam_id: steamId,
        player_name: playerData.name || "Unknown Player",
        time_survived: playerData.timeSurvived || 0,
        distance_traveled: playerData.distTrav || 0,
        player_kills: totalKills,
        total_deaths: totalDeaths,
        kdr: parseFloat(kdr.toFixed(2)),
        longest_shot: playerData.longestShot || 0,
        zombie_kills: playerData.zKilled || 0,
        deaths_to_players: playerData.deathsToPlayerCount || 0,
        deaths_to_zombies: playerData.deathsToZCount || 0,
        deaths_to_nature: playerData.deathsToNaturalCauseCount || 0,
        deaths_to_animals: playerData.deathsToAnimalCount || 0,
        suicide_count: playerData.suicideCount || 0,
        animals_killed: ((_c = playerData.animalsKilled) == null ? void 0 : _c.length) || 0,
        last_seen: lastSeenDate,
        raw_data: JSON.stringify(playerData),
        updated_at: timestamp
      };
      const query = `
        INSERT INTO player_leaderboard (
          steam_id, player_name, time_survived, distance_traveled,
          player_kills, total_deaths, kdr, longest_shot, zombie_kills,
          deaths_to_players, deaths_to_zombies, deaths_to_nature,
          deaths_to_animals, suicide_count, animals_killed,
          last_seen, raw_data, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          player_name = VALUES(player_name),
          time_survived = VALUES(time_survived),
          distance_traveled = VALUES(distance_traveled),
          player_kills = VALUES(player_kills),
          total_deaths = VALUES(total_deaths),
          kdr = VALUES(kdr),
          longest_shot = VALUES(longest_shot),
          zombie_kills = VALUES(zombie_kills),
          deaths_to_players = VALUES(deaths_to_players),
          deaths_to_zombies = VALUES(deaths_to_zombies),
          deaths_to_nature = VALUES(deaths_to_nature),
          deaths_to_animals = VALUES(deaths_to_animals),
          suicide_count = VALUES(suicide_count),
          animals_killed = VALUES(animals_killed),
          last_seen = VALUES(last_seen),
          raw_data = VALUES(raw_data),
          updated_at = VALUES(updated_at)
      `;
      await executeQuery(query, [
        leaderboardData.steam_id,
        leaderboardData.player_name,
        leaderboardData.time_survived,
        leaderboardData.distance_traveled,
        leaderboardData.player_kills,
        leaderboardData.total_deaths,
        leaderboardData.kdr,
        leaderboardData.longest_shot,
        leaderboardData.zombie_kills,
        leaderboardData.deaths_to_players,
        leaderboardData.deaths_to_zombies,
        leaderboardData.deaths_to_nature,
        leaderboardData.deaths_to_animals,
        leaderboardData.suicide_count,
        leaderboardData.animals_killed,
        leaderboardData.last_seen,
        leaderboardData.raw_data,
        leaderboardData.updated_at
      ]);
      playersProcessed++;
    }
    try {
      await executeQuery(`
        INSERT INTO leaderboard_updates (total_players, updated_at)
        VALUES (?, ?)
      `, [playersProcessed, timestamp]);
    } catch (metaError) {
      console.warn("\u26A0\uFE0F Could not save update metadata:", metaError.message);
    }
    console.log(`\u2705 Leaderboard data saved: ${playersProcessed} players`);
    return {
      playersProcessed,
      timestamp
    };
  } catch (error) {
    console.error("\u274C Database save error:", error);
    throw error;
  }
}

export { webhook_post as default };
//# sourceMappingURL=webhook.post.mjs.map
