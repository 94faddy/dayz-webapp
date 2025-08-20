// server/api/admin/items/index.js
import { executeQuery } from '~/utils/database.js'
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'
import { logAdminActivity, hasAdminPermission } from '~/utils/admin-auth.js'
import { getHeader } from 'h3'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminAuth(event)
  const method = event.node.req.method
  
  // Get IP for logging
  const ip = getHeader(event, 'x-forwarded-for') || 
             getHeader(event, 'x-real-ip') || 
             event.node?.req?.connection?.remoteAddress ||
             '127.0.0.1'
  
  switch (method) {
    case 'GET':
      return await getItems(admin)
    case 'POST':
      return await createItem(event, admin, ip)
    case 'PUT':
      return await updateItem(event, admin, ip)
    case 'DELETE':
      return await deleteItem(event, admin, ip)
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

async function getItems(admin) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'items:read')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const query = `
    SELECT 
      si.*,
      (SELECT COUNT(*) FROM user_purchases WHERE item_id = si.id) as total_sold,
      (SELECT SUM(quantity) FROM user_purchases WHERE item_id = si.id) as quantity_sold,
      (SELECT SUM(total_price) FROM user_purchases WHERE item_id = si.id) as revenue
    FROM store_items si
    ORDER BY si.sort_order ASC, si.created_at DESC
  `
  
  const items = await executeQuery(query)
  
  // Parse JSON fields
  items.forEach(item => {
    if (item.item_data) {
      try {
        item.item_data = typeof item.item_data === 'string' 
          ? JSON.parse(item.item_data) 
          : item.item_data
      } catch (e) {
        item.item_data = null
      }
    }
    
    if (item.attachments) {
      try {
        item.attachments = typeof item.attachments === 'string' 
          ? JSON.parse(item.attachments) 
          : item.attachments
      } catch (e) {
        item.attachments = null
      }
    }
  })
  
  return {
    success: true,
    items
  }
}

async function createItem(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'items:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const formData = await readMultipartFormData(event)
  
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No form data provided'
    })
  }
  
  // Parse form data
  const data = {}
  let imageFile = null
  
  for (const field of formData) {
    if (field.name === 'image' && field.filename) {
      imageFile = field
    } else if (field.data) {
      const value = field.data.toString('utf-8')
      
      // Parse JSON fields
      if (['attachments', 'item_data'].includes(field.name)) {
        try {
          data[field.name] = JSON.parse(value)
        } catch (e) {
          data[field.name] = value
        }
      } else {
        data[field.name] = value
      }
    }
  }
  
  // Validate required fields
  if (!data.name || !data.price || !data.category || !data.classname) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name, price, category and classname are required'
    })
  }
  
  // Handle image upload
  let imageUrl = null
  if (imageFile) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'items')
    await fs.mkdir(uploadDir, { recursive: true })
    
    const fileExt = path.extname(imageFile.filename)
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExt}`
    const filePath = path.join(uploadDir, fileName)
    
    await fs.writeFile(filePath, imageFile.data)
    imageUrl = `/uploads/items/${fileName}`
  }
  
  // Insert item
  const query = `
    INSERT INTO store_items (
      name, description, price, category, classname, 
      attachments, item_data, image_url, sort_order, 
      stock_unlimited, stock_quantity, admin_notes, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  
  const result = await executeQuery(query, [
    data.name,
    data.description || null,
    parseInt(data.price),
    data.category,
    data.classname,
    data.attachments ? JSON.stringify(data.attachments) : null,
    data.item_data ? JSON.stringify(data.item_data) : null,
    imageUrl,
    parseInt(data.sort_order) || 0,
    data.stock_unlimited !== 'false' ? 1 : 0,
    parseInt(data.stock_quantity) || 0,
    data.admin_notes || null,
    data.is_active !== 'false' ? 1 : 0
  ])
  
  // Log activity
  await logAdminActivity(
    admin.id,
    'create_item',
    'item',
    result.insertId,
    `Created item: ${data.name}`,
    null,
    data,
    ip
  )
  
  return {
    success: true,
    message: 'Item created successfully',
    itemId: result.insertId
  }
}

async function updateItem(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'items:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const formData = await readMultipartFormData(event)
  
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No form data provided'
    })
  }
  
  // Parse form data
  const data = {}
  let imageFile = null
  
  for (const field of formData) {
    if (field.name === 'image' && field.filename) {
      imageFile = field
    } else if (field.data) {
      const value = field.data.toString('utf-8')
      
      // Parse JSON fields
      if (['attachments', 'item_data'].includes(field.name)) {
        try {
          data[field.name] = JSON.parse(value)
        } catch (e) {
          data[field.name] = value
        }
      } else {
        data[field.name] = value
      }
    }
  }
  
  if (!data.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID is required'
    })
  }
  
  // Get current item
  const [currentItem] = await executeQuery('SELECT * FROM store_items WHERE id = ?', [data.id])
  if (!currentItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item not found'
    })
  }
  
  // Handle image upload
  let imageUrl = currentItem.image_url
  if (imageFile) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'items')
    await fs.mkdir(uploadDir, { recursive: true })
    
    const fileExt = path.extname(imageFile.filename)
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExt}`
    const filePath = path.join(uploadDir, fileName)
    
    await fs.writeFile(filePath, imageFile.data)
    imageUrl = `/uploads/items/${fileName}`
    
    // Delete old image if exists
    if (currentItem.image_url && currentItem.image_url.startsWith('/uploads/')) {
      const oldImagePath = path.join(process.cwd(), 'public', currentItem.image_url)
      try {
        await fs.unlink(oldImagePath)
      } catch (e) {
        console.error('Failed to delete old image:', e)
      }
    }
  }
  
  // Update item
  const query = `
    UPDATE store_items SET
      name = ?, description = ?, price = ?, category = ?, 
      classname = ?, attachments = ?, item_data = ?, 
      image_url = ?, sort_order = ?, stock_unlimited = ?, 
      stock_quantity = ?, admin_notes = ?, is_active = ?
    WHERE id = ?
  `
  
  await executeQuery(query, [
    data.name || currentItem.name,
    data.description || currentItem.description,
    parseInt(data.price) || currentItem.price,
    data.category || currentItem.category,
    data.classname || currentItem.classname,
    data.attachments ? JSON.stringify(data.attachments) : currentItem.attachments,
    data.item_data ? JSON.stringify(data.item_data) : currentItem.item_data,
    imageUrl,
    parseInt(data.sort_order) >= 0 ? parseInt(data.sort_order) : currentItem.sort_order,
    data.stock_unlimited !== undefined ? (data.stock_unlimited !== 'false' ? 1 : 0) : currentItem.stock_unlimited,
    parseInt(data.stock_quantity) >= 0 ? parseInt(data.stock_quantity) : currentItem.stock_quantity,
    data.admin_notes !== undefined ? data.admin_notes : currentItem.admin_notes,
    data.is_active !== undefined ? (data.is_active !== 'false' ? 1 : 0) : currentItem.is_active,
    data.id
  ])
  
  // Log activity
  await logAdminActivity(
    admin.id,
    'update_item',
    'item',
    data.id,
    `Updated item: ${data.name || currentItem.name}`,
    currentItem,
    data,
    ip
  )
  
  return {
    success: true,
    message: 'Item updated successfully'
  }
}

async function deleteItem(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'items:delete')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const { itemId } = await readBody(event)
  
  // Get item details
  const [item] = await executeQuery('SELECT * FROM store_items WHERE id = ?', [itemId])
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item not found'
    })
  }
  
  // Check if item has purchases
  const [purchases] = await executeQuery(
    'SELECT COUNT(*) as count FROM user_purchases WHERE item_id = ?',
    [itemId]
  )
  
  if (purchases.count > 0) {
    // Soft delete - just deactivate
    await executeQuery('UPDATE store_items SET is_active = FALSE WHERE id = ?', [itemId])
    
    await logAdminActivity(
      admin.id,
      'deactivate_item',
      'item',
      itemId,
      `Deactivated item: ${item.name} (has purchases)`,
      item,
      { is_active: false },
      ip
    )
    
    return {
      success: true,
      message: 'Item deactivated (has purchase history)'
    }
  } else {
    // Hard delete - remove completely
    // Delete image if exists
    if (item.image_url && item.image_url.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), 'public', item.image_url)
      try {
        await fs.unlink(imagePath)
      } catch (e) {
        console.error('Failed to delete image:', e)
      }
    }
    
    await executeQuery('DELETE FROM store_items WHERE id = ?', [itemId])
    
    await logAdminActivity(
      admin.id,
      'delete_item',
      'item',
      itemId,
      `Deleted item: ${item.name}`,
      item,
      null,
      ip
    )
    
    return {
      success: true,
      message: 'Item deleted successfully'
    }
  }
}