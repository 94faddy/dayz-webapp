// server/api/store/settings.get.js
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    // This endpoint is public (no authentication required)
    // Users need to know about auto delivery status and exchange rate before making purchases
    
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
    
    // Get point exchange rate setting
    const [exchangeRateSetting] = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'point_exchange_rate'"
    )
    
    const exchangeRate = parseInt(exchangeRateSetting?.setting_value) || 100 // Default 100 points per 1 THB
    
    console.log('🔍 Store settings loaded:', {
      autoDelivery: autoDeliverySetting?.setting_value === 'true',
      storeEnabled: storeEnabledSetting?.setting_value !== 'false',
      maintenance: maintenanceSetting?.setting_value === 'true',
      exchangeRate: exchangeRate
    })
    
    return {
      success: true,
      autoDeliveryEnabled: autoDeliverySetting?.setting_value === 'true',
      storeEnabled: storeEnabledSetting?.setting_value !== 'false', // default true
      maintenanceMode: maintenanceSetting?.setting_value === 'true',
      exchangeRate: exchangeRate,
      settings: {
        autoDelivery: autoDeliverySetting?.setting_value === 'true',
        storeEnabled: storeEnabledSetting?.setting_value !== 'false',
        maintenance: maintenanceSetting?.setting_value === 'true',
        exchangeRate: exchangeRate
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
      exchangeRate: 100, // Default exchange rate
      settings: {
        autoDelivery: false,
        storeEnabled: true,
        maintenance: false,
        exchangeRate: 100
      },
      error: 'Database error'
    }
  }
})