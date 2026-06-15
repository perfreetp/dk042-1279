// 药品分类
export type MedicineCategory = 'cold' | 'stomach' | 'injury' | 'child' | 'other'

// 开封状态
export type OpenStatus = 'unopened' | 'opened' | 'expired'

// 家庭成员
export interface FamilyMember {
  id: string
  name: string
  avatar: string
  role: string
  relationship: string
  isAdmin: boolean
  allergies: string[]
  chronicDiseases: string[]
  age: number
}

// 禁忌记录
export interface MedicineTaboo {
  memberId: string
  memberName: string
  reason: string
}

// 使用记录
export interface UsageRecord {
  date: string
  quantity: number
  userId: string
  userName: string
}

// 药品信息
export interface Medicine {
  id: string
  name: string
  genericName: string
  category: MedicineCategory
  specification: string
  manufacturer: string
  totalQuantity: number
  remainingQuantity: number
  unit: string
  openStatus: OpenStatus
  openDate?: string
  expiryDate: string
  productionDate?: string
  usage: string
  dosage: string
  indications: string
  contraindications: string
  sideEffects: string
  storage: string
  notes: string
  barcode?: string
  imageUrl?: string
  applicablePeople: string[]
  taboos: MedicineTaboo[]
  usageRecords: UsageRecord[]
  minStock: number
  expiryWarningDays: number
  seasonTips: string
  createdAt: string
  updatedAt: string
}

// 采购项
export interface PurchaseItem {
  id: string
  medicineId: string
  medicineName: string
  specification: string
  category: MedicineCategory
  quantity: number
  unit: string
  reason: string
  isPurchased: boolean
  purchaserId?: string
  purchaserName?: string
  purchaseDate?: string
  estimatedPrice?: number
}

// 季节采购建议
export interface SeasonalTip {
  season: string
  category: MedicineCategory
  medicines: string[]
  reason: string
}

// 盘点记录
export interface InventoryRecord {
  id: string
  date: string
  operator: string
  operatorId: string
  medicinesChecked: number
  changes: {
    medicineId: string
    medicineName: string
    beforeQuantity: number
    afterQuantity: number
  }[]
  notes: string
}

// 分类信息
export interface CategoryInfo {
  key: MedicineCategory
  name: string
  color: string
  bgColor: string
  icon: string
}

// 提醒类型
export type WarningType = 'low_stock' | 'expiring' | 'expired' | 'opened_long'

// 提醒项
export interface WarningItem {
  id: string
  type: WarningType
  medicineId: string
  medicineName: string
  message: string
  level: 'info' | 'warning' | 'danger'
}

// ================ 新增：家庭动态类型 ================

// 动态类型
export type ActivityType =
  | 'inventory'      // 盘点
  | 'add_medicine'   // 添加药品
  | 'mark_purchased' // 标记已购买
  | 'use_medicine'   // 使用药品
  | 'add_member'     // 添加成员
  | 'add_taboo'      // 添加禁忌
  | 'remove_taboo'   // 移除禁忌
  | 'add_allergy'    // 添加过敏
  | 'remove_allergy' // 移除过敏

// 动态状态
export type ActivityStatus = 'pending' | 'confirmed'

// 家庭动态记录
export interface FamilyActivity {
  id: string
  type: ActivityType
  operatorId: string
  operatorName: string
  operatorAvatar: string
  date: string
  status: ActivityStatus
  confirmerId?: string
  confirmerName?: string
  confirmDate?: string
  title: string
  description: string
  icon: string
  // 根据类型携带的扩展数据
  details?: {
    medicineId?: string
    medicineName?: string
    memberId?: string
    memberName?: string
    quantity?: number
    changeSummary?: string
  }
}

// 持久化存储的数据结构
export interface PersistedData {
  medicines: Medicine[]
  familyMembers: FamilyMember[]
  purchaseItems: PurchaseItem[]
  inventoryRecords: InventoryRecord[]
  activities: FamilyActivity[]
  lastPersistedAt: string
}
