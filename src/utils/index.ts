import { Medicine, MedicineCategory, WarningItem, CategoryInfo, PurchaseSuggestion } from '@/types/medicine'

export const categoryList: CategoryInfo[] = [
  { key: 'cold', name: '感冒用药', color: '#4C9AFF', bgColor: '#E8F3FF', icon: '🤧' },
  { key: 'stomach', name: '肠胃用药', color: '#722ED1', bgColor: '#F3E8FF', icon: '🫄' },
  { key: 'injury', name: '外伤用药', color: '#FF7D00', bgColor: '#FFF2E6', icon: '🩹' },
  { key: 'child', name: '儿童用药', color: '#F53F3F', bgColor: '#FFECE8', icon: '👶' },
  { key: 'other', name: '其他药品', color: '#86909C', bgColor: '#F2F3F5', icon: '💊' }
]

export const getCategoryInfo = (key: MedicineCategory): CategoryInfo => {
  return categoryList.find(c => c.key === key) || categoryList[4]
}

export const daysUntilExpiry = (expiryDate: string): number => {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const checkMedicineWarnings = (medicine: Medicine): WarningItem[] => {
  const warnings: WarningItem[] = []
  const daysLeft = daysUntilExpiry(medicine.expiryDate)

  if (daysLeft <= 0) {
    warnings.push({
      id: `${medicine.id}-expired`,
      type: 'expired',
      medicineId: medicine.id,
      medicineName: medicine.name,
      message: '药品已过期',
      level: 'danger'
    })
  } else if (daysLeft <= medicine.expiryWarningDays) {
    warnings.push({
      id: `${medicine.id}-expiring`,
      type: 'expiring',
      medicineId: medicine.id,
      medicineName: medicine.name,
      message: `还有 ${daysLeft} 天过期`,
      level: 'warning'
    })
  }

  if (medicine.remainingQuantity <= medicine.minStock) {
    warnings.push({
      id: `${medicine.id}-low-stock`,
      type: 'low_stock',
      medicineId: medicine.id,
      medicineName: medicine.name,
      message: `库存不足（剩余 ${medicine.remainingQuantity}${medicine.unit}）`,
      level: 'warning'
    })
  }

  if (medicine.openStatus === 'opened' && medicine.openDate) {
    const openDays = Math.floor(
      (new Date().getTime() - new Date(medicine.openDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (openDays > 180) {
      warnings.push({
        id: `${medicine.id}-opened-long`,
        type: 'opened_long',
        medicineId: medicine.id,
        medicineName: medicine.name,
        message: `已开封 ${openDays} 天，请注意检查`,
        level: 'info'
      })
    }
  }

  return warnings
}

export const calculateConsumptionRate = (medicine: Medicine): number => {
  const records = medicine.usageRecords
  if (records.length === 0) return 0

  const firstRecord = records[records.length - 1]
  const lastRecord = records[0]
  const daysDiff = Math.max(
    1,
    Math.ceil(
      (new Date(lastRecord.date).getTime() - new Date(firstRecord.date).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )
  const totalUsed = records.reduce((sum, r) => sum + r.quantity, 0)
  return Math.round((totalUsed / daysDiff) * 30 * 10) / 10
}

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getCurrentSeason = (): string => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export const getSeasonName = (season: string): string => {
  const map: Record<string, string> = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季'
  }
  return map[season] || '春季'
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// ================ 规格解析与采购计算（新增） ================

export const parseSpecification = (specification: string, unit: string): { perPackage: number; packageUnit: string } => {
  if (!specification) return { perPackage: 1, packageUnit: unit === '瓶' || unit === '盒' ? unit : '盒' }

  const starMatch = specification.match(/\*(\d+)/)
  if (starMatch) {
    const perPackage = parseInt(starMatch[1], 10)
    if (perPackage > 0) {
      if (unit === '瓶' || unit === '盒') return { perPackage, packageUnit: unit }
      if (unit === 'ml' || specification.includes('ml')) return { perPackage, packageUnit: '瓶' }
      return { perPackage, packageUnit: '盒' }
    }
  }

  if (unit === '瓶' || specification.includes('ml')) {
    return { perPackage: 1, packageUnit: '瓶' }
  }

  return { perPackage: 1, packageUnit: '盒' }
}

export const calcPackagesFromQuantity = (stockQuantity: number, specification: string, unit: string): number => {
  const { perPackage } = parseSpecification(specification, unit)
  if (perPackage <= 1) return stockQuantity
  return Math.max(1, Math.ceil(stockQuantity / perPackage))
}

export const calcQuantityFromPackages = (packages: number, specification: string, unit: string): number => {
  const { perPackage } = parseSpecification(specification, unit)
  return Math.max(1, packages * perPackage)
}

export const calculatePurchaseSuggestion = (
  medicine: Medicine,
  currentQuantity: number,
  customReasons?: string[]
): PurchaseSuggestion => {
  const { perPackage, packageUnit } = parseSpecification(medicine.specification, medicine.unit)
  const monthlyConsumption = calculateConsumptionRate(medicine)

  const targetStock = Math.max(medicine.totalQuantity, medicine.minStock * 2)
  const needQuantity = Math.max(0, targetStock - currentQuantity)

  const suggestedPackages = Math.max(1, Math.ceil(needQuantity / Math.max(perPackage, 1)))
  const suggestedQuantity = suggestedPackages * perPackage

  const estimatedDays = monthlyConsumption > 0
    ? Math.round((suggestedQuantity / monthlyConsumption) * 30)
    : 90

  const reasons: string[] = []
  if (customReasons && customReasons.length > 0) {
    reasons.push(...customReasons)
  } else {
    if (currentQuantity <= medicine.minStock) {
      reasons.push(`当前库存 ${currentQuantity}${medicine.unit} 低于最低库存 ${medicine.minStock}${medicine.unit}`)
    } else if (currentQuantity <= medicine.minStock * 1.5) {
      reasons.push(`当前库存 ${currentQuantity}${medicine.unit} 接近最低库存 ${medicine.minStock}${medicine.unit}`)
    }
    if (monthlyConsumption > 0) {
      reasons.push(`月均消耗约 ${monthlyConsumption}${medicine.unit}`)
    }
  }

  const finalReason = reasons.length > 0 ? reasons.join('；') : '建议补充库存'

  return {
    suggestedQuantity,
    suggestedPackages,
    perPackageCount: perPackage,
    estimatedDays,
    reasons,
    finalReason
  }
}
