// server/api/store/items.get.js
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category || 'all'
    
    let sqlQuery = `
      SELECT 
        si.id,
        si.name,
        si.description,
        si.price,
        si.category,
        si.classname,
        si.attachments,
        si.item_data,
        si.image_url,
        si.stock_unlimited,
        si.stock_quantity,
        si.sort_order,
        (SELECT COUNT(*) FROM user_purchases WHERE item_id = si.id) as total_sold
      FROM store_items si
      WHERE si.is_active = TRUE
    `
    
    const params = []
    
    if (category !== 'all') {
      sqlQuery += ' AND si.category = ?'
      params.push(category)
    }
    
    sqlQuery += ' ORDER BY si.sort_order ASC, si.created_at DESC'
    
    const items = await executeQuery(sqlQuery, params)
    
    // Parse JSON fields
    items.forEach(item => {
      if (item.attachments) {
        try {
          item.attachments = typeof item.attachments === 'string' 
            ? JSON.parse(item.attachments) 
            : item.attachments
        } catch (e) {
          item.attachments = []
        }
      } else {
        item.attachments = []
      }
      
      if (item.item_data) {
        try {
          item.item_data = typeof item.item_data === 'string' 
            ? JSON.parse(item.item_data) 
            : item.item_data
        } catch (e) {
          item.item_data = null
        }
      }
    })
    
    // Get categories with count
    const categoriesQuery = `
      SELECT 
        category,
        COUNT(*) as count
      FROM store_items
      WHERE is_active = TRUE
      GROUP BY category
    `
    
    const categoriesResult = await executeQuery(categoriesQuery)
    
    const categories = [
      { name: 'All Items', value: 'all', count: items.length }
    ]
    
    categoriesResult.forEach(cat => {
      const categoryNames = {
        weapon: 'Weapons',
        item: 'Items',
        vehicle: 'Vehicles',
        money: 'Money'
      }
      
      categories.push({
        name: categoryNames[cat.category] || cat.category,
        value: cat.category,
        count: cat.count
      })
    })
    
    return {
      success: true,
      items,
      categories,
      total: items.length
    }
    
  } catch (error) {
    console.error('Failed to fetch store items:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load store items'
    })
  }
})