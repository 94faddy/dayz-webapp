#!/bin/bash

APP_NAME="dayz-webapp"

echo "🛑 Stopping application '$APP_NAME'..."

# ลบ process แค่ครั้งเดียวก็เพียงพอ
pm2 delete $APP_NAME 2>/dev/null || true

echo "✅ PM2 process stopped."