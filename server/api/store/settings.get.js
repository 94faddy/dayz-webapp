// server/api/store/settings.get.js
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    // This endpoint is public (no authentication required)
    // Users need to know about auto delivery status before making purchases
    
    // Get auto delivery setting
    const [autoDeliverySetting] = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'auto_delivery'"
    )
    
    // Get store enabled setting
    const [storeEnabledSetting] = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'store_enabled'"
    )
    
    // Get maintenance mode setting
    const [maintenanceSetting] = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode'"
    )
    
    return {
      success: true,
      autoDeliveryEnabled: autoDeliverySetting?.setting_value === 'true',
      storeEnabled: storeEnabledSetting?.setting_value !== 'false', // default true
      maintenanceMode: maintenanceSetting?.setting_value === 'true',
      settings: {
        autoDelivery: autoDeliverySetting?.setting_value === 'true',
        storeEnabled: storeEnabledSetting?.setting_value !== 'false',
        maintenance: maintenanceSetting?.setting_value === 'true'
      }
    }
    
  } catch (error) {
    console.error('Failed to get store settings:', error)
    
    // Return safe defaults if database fails
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
      error: 'Database error'
    }
  }
})