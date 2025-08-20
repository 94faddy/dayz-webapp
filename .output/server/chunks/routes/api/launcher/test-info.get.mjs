import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
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

const testInfo_get = defineEventHandler(async () => {
  const query = `
    SELECT
      id,
      name,
      email,
      steamid64,
      mac_address,
      last_ip,
      last_launcher_activity,
      launcher_login_count
    FROM users
    WHERE launcher_login_count > 0
    ORDER BY last_launcher_activity DESC
  `;
  const users = await executeQuery(query);
  return {
    success: true,
    total: users.length,
    users
  };
});

export { testInfo_get as default };
//# sourceMappingURL=test-info.get.mjs.map
