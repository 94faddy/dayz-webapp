import { d as defineEventHandler, b as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:url';

const status_get = defineEventHandler(async (event) => {
  var _a, _b, _c;
  try {
    const config = useRuntimeConfig();
    const dzlauncherApi = `${config.dzlauncherApi}/vpp/status-info`;
    console.log("\u{1F504} Fetching server status from:", dzlauncherApi);
    const response = await fetch(dzlauncherApi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DayZ-Nightro-Web/1.0"
      }
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log("\u2705 Server status data received:", data);
    const embedContent = extractEmbedContent((_a = data.latestLog) == null ? void 0 : _a.data);
    const stats = extractServerStats(embedContent);
    const serverStatus = {
      status: data.status || "unknown",
      isOnline: data.status === "online",
      success: data.success || false,
      message: data.message || null,
      lastUpdate: ((_b = data.latestLog) == null ? void 0 : _b.timestamp) || null,
      lastUpdateFormatted: ((_c = data.latestLog) == null ? void 0 : _c.timestamp) ? new Date(data.latestLog.timestamp).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) : null,
      serverName: extractServerName(embedContent),
      logContent: embedContent || null,
      // เพิ่มข้อมูลที่ดึงจาก content
      uptime: (stats == null ? void 0 : stats.uptime) || "Unknown",
      fps: (stats == null ? void 0 : stats.fps) || 0,
      players: (stats == null ? void 0 : stats.players) || { current: 0, max: 100 }
    };
    return {
      success: true,
      data: serverStatus
    };
  } catch (error) {
    console.error("\u274C Failed to fetch server status:", error.message);
    return {
      success: false,
      error: error.message,
      data: {
        status: "unknown",
        isOnline: false,
        success: false,
        message: "Unable to fetch server status",
        lastUpdate: null,
        lastUpdateFormatted: null,
        serverName: "DayZ Nightro Server",
        logContent: null,
        uptime: "Unknown",
        fps: 0,
        players: { current: 0, max: 100 }
      }
    };
  }
});
function extractEmbedContent(data) {
  if (!data) return null;
  try {
    if (data.embeds && Array.isArray(data.embeds) && data.embeds.length > 0) {
      const embed = data.embeds[0];
      if (embed.fields && Array.isArray(embed.fields) && embed.fields.length > 0) {
        const title = embed.title || "";
        const fieldValues = embed.fields.map((field) => field.value || "").join("\n");
        return `${title}
${fieldValues}`;
      }
      return embed.title || embed.description || null;
    }
    return data.content || null;
  } catch (error) {
    console.warn("\u26A0\uFE0F Error extracting embed content:", error);
    return null;
  }
}
function extractServerName(content) {
  if (!content) return "DayZ Nightro Server";
  try {
    const linkMatch = content.match(/\[([^\]]+)\]\([^)]*\)/);
    if (linkMatch && linkMatch[1]) {
      const serverName = linkMatch[1].replace(/\*\*/g, "").trim();
      if (serverName && !serverName.includes("SERVER STATUS")) {
        return serverName;
      }
    }
    const titleMatch = content.match(/\*\*([^*]+)\*\*/);
    if (titleMatch && titleMatch[1]) {
      const serverName = titleMatch[1].trim();
      if (serverName && !serverName.includes("SERVER STATUS")) {
        return serverName;
      }
    }
    const serverPatterns = [
      /CH\d+\|[^|\n]+/i,
      // CH1|DayZ-Nightro|...
      /DayZ[^|\n\s]*/i,
      // DayZ-xxx
      /#\d+[^|\n\s]*/i
      // #1NightroHardcore
    ];
    for (const pattern of serverPatterns) {
      const match = content.match(pattern);
      if (match && match[0]) {
        return match[0].replace(/\*\*/g, "").trim();
      }
    }
    return "DayZ Nightro Server";
  } catch (error) {
    console.warn("\u26A0\uFE0F Error extracting server name:", error);
    return "DayZ Nightro Server";
  }
}
function extractServerStats(content) {
  if (!content) return null;
  try {
    const stats = {
      uptime: null,
      fps: null,
      players: {
        current: 0,
        max: 100
      }
    };
    const uptimePatterns = [
      /Up-Time:\s*\*?\*?([^*\n]+)\*?\*?/i,
      /Uptime:\s*\*?\*?([^*\n]+)\*?\*?/i,
      /Runtime:\s*\*?\*?([^*\n]+)\*?\*?/i,
      /(?:Up|Online).*?(\d+d?\s*\d+h?\s*\d+m?\s*\d+s?)/i
    ];
    for (const pattern of uptimePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        stats.uptime = match[1].trim();
        break;
      }
    }
    const fpsPatterns = [
      /Server FPS:\s*\*?\*?(\d+)\*?\*?/i,
      /FPS:\s*\*?\*?(\d+)\*?\*?/i,
      /Frame.*?Rate.*?(\d+)/i,
      /Performance.*?(\d+)/i
    ];
    for (const pattern of fpsPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        stats.fps = parseInt(match[1]);
        break;
      }
    }
    const playerPatterns = [
      /Players:\s*\*?\*?(\d+)\/(\d+)\*?\*?/i,
      /Online:\s*\*?\*?(\d+)\/(\d+)\*?\*?/i,
      /Connected:\s*\*?\*?(\d+)\/(\d+)\*?\*?/i,
      /(\d+)\/(\d+)\s*players?/i,
      /(\d+)\s*\/\s*(\d+)\s*(?:online|connected|active)/i
    ];
    for (const pattern of playerPatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[2]) {
        stats.players.current = parseInt(match[1]);
        stats.players.max = parseInt(match[2]);
        break;
      }
    }
    if (stats.players.current === 0 && stats.players.max === 100) {
      const numberPairs = content.match(/(\d+)\/(\d+)/g);
      if (numberPairs && numberPairs.length > 0) {
        const lastPair = numberPairs[numberPairs.length - 1];
        const [current, max] = lastPair.split("/").map((n) => parseInt(n));
        if (current >= 0 && max > 0 && max <= 200) {
          stats.players.current = current;
          stats.players.max = max;
        }
      }
    }
    return stats;
  } catch (error) {
    console.warn("\u26A0\uFE0F Error extracting server stats:", error);
    return null;
  }
}

export { status_get as default };
//# sourceMappingURL=status.get.mjs.map
