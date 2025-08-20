import { d as defineEventHandler, b as useRuntimeConfig, c as createError } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:url';

const leaderboard_get = defineEventHandler(async (event) => {
  var _a;
  try {
    console.log("\u{1F3C6} Leaderboard API called");
    const config = useRuntimeConfig();
    const dzsvApi = `${config.dzsvApi}/v1/leaderboard/raw`;
    console.log("\u{1F4E1} Fetching data from:", dzsvApi);
    const response = await $fetch(dzsvApi, {
      timeout: 1e4,
      // 10 seconds timeout
      headers: {
        "Accept": "application/json",
        "User-Agent": "DayZ-Nightro-WebApp/1.0"
      }
    });
    console.log("\u2705 Raw data received, processing...");
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from external API");
    }
    const playerCount = Object.keys(response).length;
    console.log(`\u{1F4CA} Processing ${playerCount} players`);
    return {
      success: true,
      data: response,
      metadata: {
        totalPlayers: playerCount,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        source: "DayZ Server API"
      }
    };
  } catch (error) {
    console.error("\u274C Leaderboard API error:", error);
    if (((_a = error.cause) == null ? void 0 : _a.code) === "ECONNREFUSED") {
      throw createError({
        statusCode: 503,
        statusMessage: "DayZ server is currently unavailable"
      });
    }
    if (error.name === "TimeoutError") {
      throw createError({
        statusCode: 504,
        statusMessage: "Request to DayZ server timed out"
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to fetch leaderboard data"
    });
  }
});

export { leaderboard_get as default };
//# sourceMappingURL=leaderboard.get.mjs.map
