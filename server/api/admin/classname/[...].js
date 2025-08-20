// server/api/admin/classname/[...].js
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'

export default defineEventHandler(async (event) => {
  // Check admin auth
  await requireAdminAuth(event)
  
  const config = useRuntimeConfig()
  const path = event.context.params._
  const query = getQuery(event)
  
  try {
    // Build query string
    const queryString = new URLSearchParams(query).toString()
    const url = `${config.dzsvApi}/v1/classname/${path}${queryString ? '?' + queryString : ''}`
    
    console.log('🔄 Fetching classname from:', url)
    
    // Forward request to DayZ API
    const response = await $fetch(url, {
      headers: {
        'X-API-Key': config.dzsvApiKey
      }
    })
    
    // Process response based on endpoint
    if (path === 'search') {
      // For search endpoint - extract ONLY classname strings
      if (response && response.data) {
        let classnames = []
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          classnames = response.data.map(item => {
            // If item is a string, return it
            if (typeof item === 'string') {
              return item
            }
            // If item is object with name field (which is the classname)
            if (item && item.name) {
              return item.name
            }
            // If item has classname field
            if (item && item.classname) {
              return item.classname
            }
            return null
          }).filter(Boolean)
        }
        
        console.log('✅ Extracted classnames:', classnames.length, 'items')
        
        return {
          success: true,
          results: classnames // Return ONLY array of classname strings
        }
      }
      
      // If response format is different
      if (response && Array.isArray(response)) {
        const classnames = response.map(item => {
          if (typeof item === 'string') return item
          if (item && item.name) return item.name
          if (item && item.classname) return item.classname
          return null
        }).filter(Boolean)
        
        return {
          success: true,
          results: classnames
        }
      }
    }
    
    // For categories endpoint
    if (path === 'categories') {
      return response
    }
    
    // For details endpoint - return as is
    if (path.startsWith('details/')) {
      return response
    }
    
    // Default return
    return response
    
  } catch (error) {
    console.error('❌ Classname API error:', error)
    
    // Return mock data if API fails
    if (path === 'search') {
      const searchQuery = (query.q || '').toLowerCase()
      
      // Mock classnames - ONLY STRINGS (shortened list for readability)
      const mockClassnames = [
        // Assault Rifles
        'AKM', 'AK74', 'AK101', 'AK74U', 'AUG', 'FAL', 'FAMAS', 'M4A1', 'M16A2', 'M70_Tundra',
        // Sniper Rifles  
        'Mosin9130', 'CZ527', 'CZ550', 'SVD', 'VSS', 'VSD', 'Scout', 'Winchester70', 'Blaze95',
        // SMGs
        'MP5K', 'UMP45', 'Bizon', 'CZ61', 'SG5K', 'Vikhr',
        // Shotguns
        'Saiga', 'MP133', 'BK43', 'BK133', 'Izh43', 'Vaiga',
        // Pistols
        'FNX45', 'CZ75', 'Glock19', 'MKII', 'Deagle', 'P1', 'IJ70', 'Magnum',
        // Medical
        'BandageDressing', 'Morphine', 'Epinephrine', 'SalineBag', 'SalineBagIV',
        'BloodBagEmpty', 'BloodBagFull', 'BloodBagIV', 'BloodTestKit',
        'CharcoalTablets', 'TetracyclineAntibiotics', 'PainkillerTablets', 
        'VitaminBottle', 'DisinfectantSpray', 'DisinfectantAlcohol',
        // Food
        'TacticalBaconCan', 'BakedBeansCan', 'PeachesCan', 'SpaghettiCan',
        'SardinesCan', 'TunaCan', 'DogFoodCan', 'CatFoodCan',
        'Apple', 'Pear', 'Plum', 'Tomato', 'GreenBellPepper', 'Zucchini',
        'Potato', 'SambucusBerry', 'CaninaBerry',
        // Drinks
        'WaterBottle', 'Canteen', 'Pot', 'CanisterGasoline',
        'SodaCan_Cola', 'SodaCan_Pipsi', 'SodaCan_Spite', 'SodaCan_Kvass',
        // Backpacks
        'AliceBag_Black', 'AliceBag_Green', 'AliceBag_Camo',
        'TaloonBag_Blue', 'TaloonBag_Green', 'TaloonBag_Orange',
        'MountainBag_Red', 'MountainBag_Blue', 'MountainBag_Green',
        'CoyoteBag_Brown', 'CoyoteBag_Green', 'CoyoteBag_Black',
        'HuntingBag', 'TortillaBag', 'AssaultBag_Green', 'AssaultBag_Black',
        'ChildBag_Red', 'ChildBag_Blue', 'ChildBag_Green',
        'DryBag_Yellow', 'DryBag_Orange', 'DryBag_Red', 'DryBag_Blue',
        // Helmets
        'BallisticHelmet_Black', 'BallisticHelmet_Green', 'BallisticHelmet_UN',
        'ZSh3PilotHelmet_Black', 'ZSh3PilotHelmet_Green',
        'GorkaHelmet', 'Ssh68Helmet', 'Mich2001Helmet',
        'FirefightersHelmet_Red', 'FirefightersHelmet_White', 'FirefightersHelmet_Yellow',
        'SkateHelmet_Black', 'SkateHelmet_Blue', 'SkateHelmet_Gray',
        'MotoHelmet_Black', 'MotoHelmet_Blue', 'MotoHelmet_Green',
        // Vests
        'PlateCarrierVest', 'PlateCarrierVest_Black', 'PlateCarrierVest_Green',
        'SmershVest', 'PressVest_Blue', 'PressVest_LightBlue',
        'UKAssVest_Black', 'UKAssVest_Camo', 'UKAssVest_Khaki',
        'PoliceVest', 'HighCapacityVest_Black', 'HighCapacityVest_Olive',
        // Optics
        'ACOGOptic', 'ACOGOptic_6x', 'M4_T3NRDSOptic', 'M68Optic',
        'ReflexOptic', 'FNP45_MRDSOptic', 'KobraOptic', 'KashtanOptic',
        'PSO1Optic', 'PSO11Optic', 'PUScopeOptic', 'HuntingOptic',
        'LongrangeOptic', 'StarlightOptic', 'NVOptic',
        // Suppressors
        'M4_Suppressor', 'AK_Suppressor', 'Mosin_Suppressor',
        'PistolSuppressor', 'ImprovisedSuppressor',
        'Suppressor_545', 'Suppressor_556', 'Suppressor_762',
        'Suppressor_9mm', 'Suppressor_45',
        // Magazines
        'Mag_AKM_30Rnd', 'Mag_AKM_30Rnd_Black', 'Mag_AKM_30Rnd_Green',
        'Mag_AKM_Drum75Rnd', 'Mag_AKM_Drum75Rnd_Black',
        'Mag_AK74_30Rnd', 'Mag_AK74_30Rnd_Black', 'Mag_AK74_45Rnd',
        'Mag_AK101_30Rnd', 'Mag_AK101_30Rnd_Black',
        'Mag_FAL_20Rnd', 'Mag_Aug_30Rnd',
        'Mag_CMAG_10Rnd', 'Mag_CMAG_20Rnd', 'Mag_CMAG_30Rnd', 'Mag_CMAG_40Rnd',
        'Mag_STANAG_30Rnd', 'Mag_STANAGCoupled_30Rnd', 'Mag_STANAG_60Rnd',
        'Mag_SVD_10Rnd', 'Mag_VSS_10Rnd', 'Mag_Val_20Rnd',
        'Mag_CZ527_5rnd', 'Mag_CZ550_4rnd', 'Mag_CZ550_10rnd',
        'Mag_FNX45_15Rnd', 'Mag_CZ75_15Rnd', 'Mag_Glock_15Rnd',
        'Mag_MP5_15Rnd', 'Mag_MP5_30Rnd', 'Mag_UMP_25Rnd',
        // Ammo
        'Ammo_9x19', 'Ammo_9x39', 'Ammo_9x39AP',
        'Ammo_12gaPellets', 'Ammo_12gaSlug', 'Ammo_12gaRubberSlug',
        'Ammo_22', 'Ammo_308Win', 'Ammo_308WinTracer',
        'Ammo_357', 'Ammo_380', 'Ammo_45ACP',
        'Ammo_545x39', 'Ammo_545x39Tracer',
        'Ammo_556x45', 'Ammo_556x45Tracer',
        'Ammo_762x39', 'Ammo_762x39Tracer',
        'Ammo_762x54', 'Ammo_762x54Tracer',
        // Tools
        'Shovel', 'FieldShovel', 'Pickaxe', 'SledgeHammer',
        'Hammer', 'Hacksaw', 'HandSaw', 'CanOpener',
        'Hatchet', 'FirefighterAxe', 'WoodAxe',
        'Machete', 'CombatKnife', 'HuntingKnife', 'KitchenKnife',
        'Crowbar', 'PipeWrench', 'Wrench', 'LugWrench',
        // Electronics
        'Battery9V', 'CarBattery', 'TruckBattery',
        'NVGoggles', 'NVGHeadstrap', 'Rangefinder', 'Binoculars',
        'PersonalRadio', 'Megaphone', 'ElectronicRepairKit',
        'CableReel', 'BarbedWire', 'MetalWire', 'Rope',
        // Vehicles
        'OffroadHatchback', 'CivilianSedan', 'Hatchback_02', 'Sedan_02',
        'Truck_01_Covered', 'Truck_02', 'V3S_Cargo', 'V3S_Chassis',
        'Bus', 'Van_01', 'Offroad_02',
        // Vehicle Parts
        'HatchbackWheel', 'HatchbackDoors_Driver', 'HatchbackDoors_CoDriver',
        'HatchbackHood', 'HatchbackTrunk',
        'SedanWheel', 'SedanDoors_Driver', 'SedanDoors_CoDriver',
        'SedanHood', 'SedanTrunk',
        'Truck_01_Wheel', 'Truck_01_WheelDouble',
        'V3S_Wheel', 'V3S_WheelDouble',
        // Building Materials
        'WoodenPlank', 'MetalPlate', 'Nail', 'NailBox',
        'Camonet', 'Hescobox', 'SandbagBarrier',
        'WoodenLog', 'Firewood', 'LongWoodenStick', 'ShortStick',
        'Stone', 'SmallStone'
      ]
      
      // Filter based on search query
      const filtered = mockClassnames.filter(cn => 
        cn.toLowerCase().includes(searchQuery)
      )
      
      console.log('🔍 Mock search for:', searchQuery, '- Found:', filtered.length, 'items')
      
      return {
        success: true,
        results: filtered.slice(0, 20) // Return max 20 results
      }
    }
    
    // Categories mock data
    if (path === 'categories') {
      return {
        success: true,
        categories: [
          { name: 'Weapons', value: 'weapons', count: 150 },
          { name: 'Medical', value: 'medical', count: 35 },
          { name: 'Food', value: 'food', count: 60 },
          { name: 'Clothing', value: 'clothing', count: 200 },
          { name: 'Backpacks', value: 'backpacks', count: 30 },
          { name: 'Attachments', value: 'attachments', count: 120 },
          { name: 'Ammunition', value: 'ammo', count: 80 },
          { name: 'Vehicles', value: 'vehicles', count: 25 },
          { name: 'Building', value: 'building', count: 50 },
          { name: 'Tools', value: 'tools', count: 45 }
        ]
      }
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch classname data'
    })
  }
})