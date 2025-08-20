export async function requireAdminAuth(event) {
  const session = await useSession(event, {
    maxAge: 24 * 60 * 60,
    password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    name: 'dayz-admin-session'
  })
  
  if (!session.data || !session.data.admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Admin authentication required'
    })
  }
  
  return session.data.admin
}