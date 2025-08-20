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

const settings_get = defineEventHandler(async (event) => {
  try {
    const [autoDeliverySetting] = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'auto_delivery'"
    );
    const [storeEnabledSetting] = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'store_enabled'"
    );
    const [maintenanceSetting] = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode'"
    );
    return {
      success: true,
      autoDeliveryEnabled: (autoDeliverySetting == null ? void 0 : autoDeliverySetting.setting_value) === "true",
      storeEnabled: (storeEnabledSetting == null ? void 0 : storeEnabledSetting.setting_value) !== "false",
      // default true
      maintenanceMode: (maintenanceSetting == null ? void 0 : maintenanceSetting.setting_value) === "true",
      settings: {
        autoDelivery: (autoDeliverySetting == null ? void 0 : autoDeliverySetting.setting_value) === "true",
        storeEnabled: (storeEnabledSetting == null ? void 0 : storeEnabledSetting.setting_value) !== "false",
        maintenance: (maintenanceSetting == null ? void 0 : maintenanceSetting.setting_value) === "true"
      }
    };
  } catch (error) {
    console.error("Failed to get store settings:", error);
    return {
      success: true,
      autoDeliveryEnabled: false,
      storeEnabled: true,
      maintenanceMode: false,
      settings: {
        autoDelivery: false,
        storeEnabled: true,
        maintenance: false
      },
      error: "Database error"
    };
  }
});

export { settings_get as default };
//# sourceMappingURL=settings.get.mjs.map
