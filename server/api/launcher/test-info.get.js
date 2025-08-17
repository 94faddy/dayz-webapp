import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async () => {
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
  `

  const users = await executeQuery(query)

  return {
    success: true,
    total: users.length,
    users
  }
})
