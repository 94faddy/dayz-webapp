import { d as defineEventHandler, u as useSession, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { executeQuery } from '../../../_/database.mjs';
import { canChangeUserName } from '../../../_/auth.mjs';
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
import 'bcryptjs';

const updateProfile_post = defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || "my-super-secret-session-password-32-chars-minimum!",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      name: "dayz-session"
    });
    if (!session.data || !session.data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized"
      });
    }
    const userId = session.data.user.id;
    const body = await readBody(event);
    const { action, data } = body;
    console.log("\u{1F527} Profile update request:", { action, userId });
    switch (action) {
      case "change_name":
        return await handleNameChange(userId, data.newName, session);
      case "update_avatar":
        return await handleAvatarUpdate(userId, data.avatar, session);
      default:
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid action"
        });
    }
  } catch (error) {
    console.error("\u274C Profile update error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Profile update failed"
    });
  }
});
async function handleNameChange(userId, newName, session) {
  console.log("\u{1F527} Processing name change for userId:", userId, "to:", newName);
  if (!newName || typeof newName !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required"
    });
  }
  if (newName.length < 3 || newName.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name must be between 3-50 characters"
    });
  }
  const canChange = await canChangeUserName(userId);
  console.log("\u{1F50D} Can change name result:", canChange);
  if (!canChange) {
    throw createError({
      statusCode: 400,
      statusMessage: "You have reached the monthly name change limit"
    });
  }
  const existingUser = await executeQuery(
    "SELECT id FROM users WHERE name = ? AND id != ?",
    [newName, userId]
  );
  if (existingUser.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "This name is already taken"
    });
  }
  const currentUserData = await executeQuery(
    "SELECT name, name_change_count, last_name_change FROM users WHERE id = ?",
    [userId]
  );
  if (currentUserData.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found"
    });
  }
  const user = currentUserData[0];
  const currentDate = /* @__PURE__ */ new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  let newNameChangeCount = 1;
  if (user.last_name_change) {
    const lastChangeDate = new Date(user.last_name_change);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastChangeMonth = lastChangeDate.getMonth();
    const lastChangeYear = lastChangeDate.getFullYear();
    console.log("\u{1F4C5} Date calculation:", {
      currentMonth: currentMonth + 1,
      currentYear,
      lastChangeMonth: lastChangeMonth + 1,
      lastChangeYear
    });
    if (lastChangeMonth === currentMonth && lastChangeYear === currentYear) {
      newNameChangeCount = (user.name_change_count || 0) + 1;
      console.log("\u{1F4CA} Same month - incrementing count");
    } else {
      newNameChangeCount = 1;
      console.log("\u{1F4CA} Different month - resetting count to 1");
    }
  }
  console.log("\u{1F4CA} Name change calculation:", {
    oldName: user.name,
    newName,
    oldCount: user.name_change_count,
    newCount: newNameChangeCount,
    lastChange: user.last_name_change,
    currentDate: currentDateString
  });
  await executeQuery(`
    UPDATE users 
    SET name = ?, 
        name_change_count = ?,
        last_name_change = ?,
        updated_at = NOW()
    WHERE id = ?
  `, [newName, newNameChangeCount, currentDateString, userId]);
  await session.update({
    ...session.data,
    user: {
      ...session.data.user,
      name: newName
    }
  });
  const nextAllowedDate = new Date(currentDate);
  nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1);
  nextAllowedDate.setDate(1);
  console.log("\u2705 Name changed successfully for user:", userId);
  return {
    success: true,
    message: "Name changed successfully",
    newName,
    nameChangeCount: newNameChangeCount,
    lastNameChange: currentDateString,
    nextAllowedDate: nextAllowedDate.toISOString(),
    remainingChanges: Math.max(0, 1 - newNameChangeCount)
    // assuming max 1 per month
  };
}
async function handleAvatarUpdate(userId, avatarData, session) {
  console.log("\u{1F3A8} Processing avatar update for userId:", userId, avatarData);
  if (!avatarData || typeof avatarData !== "object") {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid avatar data"
    });
  }
  const { type, color, emoji, id } = avatarData;
  const validTypes = ["initial", "preset"];
  if (!type || !validTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid avatar type"
    });
  }
  if (type === "preset") {
    if (!emoji || !color) {
      throw createError({
        statusCode: 400,
        statusMessage: "Emoji and color are required for preset type"
      });
    }
  }
  const avatarDataToSave = {
    type,
    color: color || "#dc2626",
    emoji: emoji || "\u{1F9D4}",
    id: id || null,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const avatarJsonString = JSON.stringify(avatarDataToSave);
    console.log("\u{1F4BE} Saving avatar JSON:", avatarJsonString);
    await executeQuery(`
      UPDATE users 
      SET avatar_data = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [avatarJsonString, userId]);
    await session.update({
      ...session.data,
      user: {
        ...session.data.user,
        avatar_data: avatarDataToSave
      }
    });
    console.log("\u2705 Avatar updated successfully for user:", userId);
    return {
      success: true,
      message: "Avatar updated successfully",
      avatarData: avatarDataToSave
    };
  } catch (error) {
    console.error("\u274C Avatar update database error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to save avatar to database"
    });
  }
}

export { updateProfile_post as default };
//# sourceMappingURL=update-profile.post.mjs.map
