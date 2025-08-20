#!/bin/bash

APP_NAME="dayz-webapp"

echo "🛑 Stopping old PM2 process if it exists..."
# แก้ไข: ใช้ตัวแปร APP_NAME ที่ถูกต้อง
pm2 delete $APP_NAME 2>/dev/null || true

echo "🚀 Starting the application..."
# แก้ไข: ใช้ตัวแปร APP_NAME และใช้ 'start' เพื่อความชัดเจน
pm2 start npm --name "$APP_NAME" -- run start:prod

echo "💾 Saving PM2 process list..."
pm2 save

echo "✅ System started successfully with PM2!"

echo -e "\n📜 Opening logs for $APP_NAME...\n"
pm2 logs $APP_NAME