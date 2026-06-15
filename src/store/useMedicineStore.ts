import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  Medicine,
  FamilyMember,
  PurchaseItem,
  InventoryRecord,
  WarningItem,
  FamilyActivity,
  ActivityType,
  MedicineTaboo,
  UsageRecord,
  UsageTimelineItem,
  InventoryDiffReport,
  InventoryDiffItem
} from '@/types/medicine'
import {
  mockMedicines,
  mockFamilyMembers,
  mockPurchaseItems,
  mockInventoryRecords
} from '@/data/mockData'
import { checkMedicineWarnings, generateId, formatDate, getCategoryInfo } from '@/utils'

// 持久化存储的 Key
const STORAGE_KEY = 'family_medicine_chest_data_v1'

interface MedicineState {
  // ================ 数据状态 ================
  medicines: Medicine[]
  familyMembers: FamilyMember[]
  purchaseItems: PurchaseItem[]
  inventoryRecords: InventoryRecord[]
  activities: FamilyActivity[]
  selectedCategory: string
  searchKeyword: string
  currentUserId: string
  isHydrated: boolean

  // ================ 持久化 ================
  hydrateFromStorage: () => Promise<void>
  persistToStorage: () => Promise<void>
  resetAllData: () => void

  // ================ 筛选设置 ================
  setSelectedCategory: (category: string) => void
  setSearchKeyword: (keyword: string) => void

  // ================ 当前用户 ================
  setCurrentUser: (userId: string) => void
  getCurrentUser: () => FamilyMember | undefined

  // ================ 药品管理 ================
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'usageRecords'>, generateActivity?: boolean) => void
  updateMedicine: (id: string, updates: Partial<Medicine>, generateActivity?: boolean) => void
  deleteMedicine: (id: string) => void
  getMedicineById: (id: string) => Medicine | undefined
  getMedicinesByCategory: (category: string) => Medicine[]
  getWarnings: () => WarningItem[]

  // ================ 使用药品（需求1） ================
  useMedicine: (medicineId: string, userId: string, quantity: number) => {
    success: boolean
    message: string
  }

  // ================ 禁忌与过敏管理（需求2） ================
  addMedicineTaboo: (medicineId: string, taboo: MedicineTaboo) => void
  removeMedicineTaboo: (medicineId: string, memberId: string) => void
  updateMedicineTabooReason: (medicineId: string, memberId: string, reason: string) => void
  addAllergy: (memberId: string, allergy: string) => void
  removeAllergy: (memberId: string, allergy: string) => void
  addChronicDisease: (memberId: string, disease: string) => void
  removeChronicDisease: (memberId: string, disease: string) => void

  // ================ 采购管理 ================
  addPurchaseItem: (item: Omit<PurchaseItem, 'id'>, generateActivity?: boolean) => void
  togglePurchaseItem: (id: string, generateActivity?: boolean) => void
  markItemPurchased: (id: string, purchaserId: string, generateActivity?: boolean) => void
  markItemsPurchased: (ids: string[], purchaserId: string) => number
  removePurchaseItem: (id: string) => void
  clearPurchasedItems: () => void

  // ================ 盘点管理 ================
  addInventoryRecord: (record: Omit<InventoryRecord, 'id'>, generateActivity?: boolean) => void
  updateMedicineQuantity: (medicineId: string, newQuantity: number) => void
  generateInventoryDiffReport: (changes: InventoryRecord['changes']) => InventoryDiffReport
  addLowStockToPurchase: (report: InventoryDiffReport) => number

  // ================ 用药日历 ================
  getUsageTimeline: (filter?: { memberId?: string; medicineId?: string; days?: number }) => UsageTimelineItem[]

  // ================ 家庭成员管理（需求5） ================
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'allergies' | 'chronicDiseases' | 'isAdmin'> & { allergies?: string[]; chronicDiseases?: string[] }) => void
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void
  deleteFamilyMember: (id: string) => void

  // ================ 家庭动态管理（需求4） ================
  addActivity: (type: ActivityType, title: string, description: string, icon: string, details?: FamilyActivity['details']) => void
  confirmActivity: (activityId: string, confirmerId: string) => void
  getPendingActivitiesCount: () => number
  getActivitiesByStatus: (status?: 'pending' | 'confirmed') => FamilyActivity[]
}

// ================ 辅助：从存储加载数据 ================
const loadFromStorage = (): {
  medicines?: Medicine[]
  familyMembers?: FamilyMember[]
  purchaseItems?: PurchaseItem[]
  inventoryRecords?: InventoryRecord[]
  activities?: FamilyActivity[]
} => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        medicines: parsed.medicines,
        familyMembers: parsed.familyMembers,
        purchaseItems: parsed.purchaseItems,
        inventoryRecords: parsed.inventoryRecords,
        activities: parsed.activities || []
      }
    }
  } catch (e) {
    console.warn('[Store] 加载本地数据失败，使用默认 Mock 数据', e)
  }
  return {}
}

// ================ 默认家庭动态：给一些示例动态 ================
const generateDefaultActivities = (members: FamilyMember[]): FamilyActivity[] => {
  const admin = members.find((m) => m.isAdmin) || members[0]
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  return [
    {
      id: generateId(),
      type: 'inventory',
      operatorId: admin.id,
      operatorName: admin.name,
      operatorAvatar: admin.avatar,
      date: formatDate(yesterday.toISOString()),
      status: 'confirmed',
      confirmerId: admin.id,
      confirmerName: admin.name,
      confirmDate: formatDate(yesterday.toISOString()),
      title: '已完成周末药箱盘点',
      description: '共盘点 10 种药品，其中 2 种数量有更新',
      icon: '📋',
      details: { changeSummary: '感冒灵颗粒 5→3，创可贴 20→12' }
    },
    {
      id: generateId(),
      type: 'add_medicine',
      operatorId: admin.id,
      operatorName: admin.name,
      operatorAvatar: admin.avatar,
      date: formatDate(yesterday.toISOString()),
      status: 'confirmed',
      confirmerId: admin.id,
      confirmerName: admin.name,
      confirmDate: formatDate(yesterday.toISOString()),
      title: '新添购 阿莫西林胶囊',
      description: '联邦制药 0.25g*24粒，共 1 盒',
      icon: '💊',
      details: { medicineName: '阿莫西林胶囊' }
    }
  ]
}

export const useMedicineStore = create<MedicineState>((set, get) => ({
  // ================ 初始状态（先用 Mock 数据，等 hydrate 时再覆盖） ================
  medicines: mockMedicines,
  familyMembers: mockFamilyMembers,
  purchaseItems: mockPurchaseItems,
  inventoryRecords: mockInventoryRecords,
  activities: generateDefaultActivities(mockFamilyMembers),
  selectedCategory: 'all',
  searchKeyword: '',
  currentUserId: mockFamilyMembers[0]?.id || 'm1',
  isHydrated: false,

  // ================ 持久化 ================
  hydrateFromStorage: async () => {
    const saved = loadFromStorage()
    if (saved.medicines && saved.medicines.length > 0) {
      set({
        medicines: saved.medicines,
        familyMembers: saved.familyMembers || mockFamilyMembers,
        purchaseItems: saved.purchaseItems || mockPurchaseItems,
        inventoryRecords: saved.inventoryRecords || mockInventoryRecords,
        activities: saved.activities || generateDefaultActivities(saved.familyMembers || mockFamilyMembers),
        currentUserId: saved.familyMembers?.[0]?.id || mockFamilyMembers[0]?.id || 'm1',
        isHydrated: true
      })
    } else {
      // 首次启动：用 Mock 数据初始化，并持久化一次
      await get().persistToStorage()
      set({ isHydrated: true })
    }
  },

  persistToStorage: async () => {
    const { medicines, familyMembers, purchaseItems, inventoryRecords, activities } = get()
    try {
      Taro.setStorageSync(
        STORAGE_KEY,
        JSON.stringify({
          medicines,
          familyMembers,
          purchaseItems,
          inventoryRecords,
          activities,
          lastPersistedAt: new Date().toISOString()
        })
      )
    } catch (e) {
      console.warn('[Store] 持久化失败', e)
    }
  },

  resetAllData: () => {
    set({
      medicines: mockMedicines,
      familyMembers: mockFamilyMembers,
      purchaseItems: mockPurchaseItems,
      inventoryRecords: mockInventoryRecords,
      activities: generateDefaultActivities(mockFamilyMembers),
      currentUserId: mockFamilyMembers[0]?.id || 'm1'
    })
    get().persistToStorage()
  },

  // ================ 筛选 ================
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  // ================ 当前用户 ================
  setCurrentUser: (userId) => set({ currentUserId: userId }),
  getCurrentUser: () => {
    const { currentUserId, familyMembers } = get()
    return familyMembers.find((m) => m.id === currentUserId)
  },

  // ================ 药品管理 ================
  addMedicine: (medicine, generateActivity = true) => {
    const newMedicine: Medicine = {
      ...medicine,
      usageRecords: [],
      id: generateId(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    set((state) => ({
      medicines: [newMedicine, ...state.medicines]
    }))

    if (generateActivity) {
      const user = get().getCurrentUser()!
      get().addActivity(
        'add_medicine',
        `新添加 ${newMedicine.name}`,
        `${newMedicine.specification}，共 ${newMedicine.totalQuantity}${newMedicine.unit}`,
        '💊',
        { medicineId: newMedicine.id, medicineName: newMedicine.name, quantity: newMedicine.totalQuantity }
      )
    }
    get().persistToStorage()
  },

  updateMedicine: (id, updates, generateActivity = false) => {
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === id
          ? { ...m, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      )
    }))
    if (generateActivity) {
      const user = get().getCurrentUser()!
      const med = get().getMedicineById(id)
      if (med) {
        get().addActivity(
          'add_medicine',
          `更新了 ${med.name} 信息`,
          '修改了药品资料',
          '📝',
          { medicineId: id, medicineName: med.name }
        )
      }
    }
    get().persistToStorage()
  },

  deleteMedicine: (id) => {
    set((state) => ({
      medicines: state.medicines.filter((m) => m.id !== id)
    }))
    get().persistToStorage()
  },

  getMedicineById: (id) => {
    return get().medicines.find((m) => m.id === id)
  },

  getMedicinesByCategory: (category) => {
    const { medicines, searchKeyword } = get()
    let filtered = medicines
    if (category !== 'all') {
      filtered = filtered.filter((m) => m.category === category)
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          (m.genericName || '').toLowerCase().includes(keyword) ||
          m.manufacturer.toLowerCase().includes(keyword)
      )
    }
    return filtered
  },

  getWarnings: () => {
    const { medicines } = get()
    const allWarnings: WarningItem[] = []
    medicines.forEach((m) => {
      const warnings = checkMedicineWarnings(m)
      allWarnings.push(...warnings)
    })
    return allWarnings
  },

  // ================ 使用药品（需求1 核心） ================
  useMedicine: (medicineId, userId, quantity) => {
    const med = get().getMedicineById(medicineId)
    const { familyMembers } = get()
    if (!med) return { success: false, message: '药品不存在' }
    if (quantity <= 0) return { success: false, message: '请输入有效的使用数量' }
    if (med.remainingQuantity < quantity) {
      return {
        success: false,
        message: `库存不足（剩余 ${med.remainingQuantity}${med.unit}）`
      }
    }

    const user = familyMembers.find((m) => m.id === userId)
    if (!user) return { success: false, message: '用户不存在' }

    // 1. 扣减库存
    const newRemaining = med.remainingQuantity - quantity
    const newRecord: UsageRecord = {
      date: new Date().toISOString().split('T')[0],
      quantity,
      userId,
      userName: user.name
    }

    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId
          ? {
              ...m,
              remainingQuantity: newRemaining,
              openStatus: m.openStatus === 'unopened' ? 'opened' : m.openStatus,
              openDate: m.openStatus === 'unopened' && !m.openDate ? newRecord.date : m.openDate,
              usageRecords: [newRecord, ...m.usageRecords],
              updatedAt: newRecord.date
            }
          : m
      )
    }))

    // 2. 生成动态
    const operator = get().getCurrentUser()!
    get().addActivity(
      'use_medicine',
      `${user.name} 使用了 ${med.name}`,
      `用量 ${quantity}${med.unit}，剩余库存 ${newRemaining}${med.unit}`,
      '💊',
      {
        medicineId,
        medicineName: med.name,
        memberId: userId,
        memberName: user.name,
        quantity
      }
    )

    // 3. 若库存低于最低线，自动加采购建议
    if (newRemaining <= med.minStock) {
      const existingPurchase = get().purchaseItems.find(
        (p) => p.medicineId === medicineId && !p.isPurchased
      )
      if (!existingPurchase) {
        const recommendedQty = Math.ceil(
          (med.totalQuantity - newRemaining) / Math.max(med.minStock, 1)
        ) || 1
        get().addPurchaseItem(
          {
            medicineId: med.id,
            medicineName: med.name,
            specification: med.specification,
            category: med.category,
            quantity: recommendedQty,
            unit: '盒',
            reason: `库存不足（剩余 ${newRemaining}${med.unit}），使用后自动补货建议`,
            isPurchased: false
          },
          false
        )
      }
    }

    get().persistToStorage()
    return { success: true, message: '已记录使用' }
  },

  // ================ 禁忌与过敏管理（需求2 核心） ================
  addMedicineTaboo: (medicineId, taboo) => {
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId
          ? {
              ...m,
              taboos: m.taboos.find((t) => t.memberId === taboo.memberId)
                ? m.taboos.map((t) =>
                    t.memberId === taboo.memberId ? { ...t, ...taboo } : t
                  )
                : [...m.taboos, taboo],
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : m
      )
    }))
    const med = get().getMedicineById(medicineId)
    const operator = get().getCurrentUser()!
    if (med) {
      get().addActivity(
        'add_taboo',
        `标记 ${taboo.memberName} 禁用 ${med.name}`,
        `原因：${taboo.reason}`,
        '🚫',
        { medicineId, medicineName: med.name, memberId: taboo.memberId, memberName: taboo.memberName }
      )
    }
    get().persistToStorage()
  },

  removeMedicineTaboo: (medicineId, memberId) => {
    const med = get().getMedicineById(medicineId)
    const taboo = med?.taboos.find((t) => t.memberId === memberId)
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId
          ? {
              ...m,
              taboos: m.taboos.filter((t) => t.memberId !== memberId),
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : m
      )
    }))
    const operator = get().getCurrentUser()!
    if (med && taboo) {
      get().addActivity(
        'remove_taboo',
        `移除 ${taboo.memberName} 对 ${med.name} 的禁用标记`,
        `原因为：${taboo.reason}`,
        '✅',
        { medicineId, medicineName: med.name, memberId, memberName: taboo.memberName }
      )
    }
    get().persistToStorage()
  },

  updateMedicineTabooReason: (medicineId, memberId, reason) => {
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId
          ? {
              ...m,
              taboos: m.taboos.map((t) =>
                t.memberId === memberId ? { ...t, reason } : t
              ),
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : m
      )
    }))
    get().persistToStorage()
  },

  addAllergy: (memberId, allergy) => {
    const { familyMembers } = get()
    const member = familyMembers.find((m) => m.id === memberId)
    if (!member) return
    if (member.allergies.includes(allergy)) return

    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === memberId
          ? { ...m, allergies: [...m.allergies, allergy] }
          : m
      )
    }))
    const operator = get().getCurrentUser()!
    get().addActivity(
      'add_allergy',
      `添加过敏记录：${member.name} 对 ${allergy} 过敏`,
      '在健康信息中添加',
      '🌿',
      { memberId, memberName: member.name }
    )
    get().persistToStorage()
  },

  removeAllergy: (memberId, allergy) => {
    const member = get().familyMembers.find((m) => m.id === memberId)
    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === memberId
          ? { ...m, allergies: m.allergies.filter((a) => a !== allergy) }
          : m
      )
    }))
    const operator = get().getCurrentUser()!
    if (member) {
      get().addActivity(
        'remove_allergy',
        `移除 ${member.name} 的 ${allergy} 过敏记录`,
        '经医生确认后移除',
        '✅',
        { memberId, memberName: member.name }
      )
    }
    get().persistToStorage()
  },

  addChronicDisease: (memberId, disease) => {
    const member = get().familyMembers.find((m) => m.id === memberId)
    if (!member) return
    if (member.chronicDiseases.includes(disease)) return

    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === memberId
          ? { ...m, chronicDiseases: [...m.chronicDiseases, disease] }
          : m
      )
    }))
    get().persistToStorage()
  },

  removeChronicDisease: (memberId, disease) => {
    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === memberId
          ? { ...m, chronicDiseases: m.chronicDiseases.filter((d) => d !== disease) }
          : m
      )
    }))
    get().persistToStorage()
  },

  // ================ 采购管理 ================
  addPurchaseItem: (item, generateActivity = false) => {
    set((state) => ({
      purchaseItems: [{ ...item, id: generateId() }, ...state.purchaseItems]
    }))
    if (generateActivity) {
      const operator = get().getCurrentUser()!
      get().addActivity(
        'mark_purchased',
        `新增采购项：${item.medicineName}`,
        `采购 ${item.quantity}${item.unit}，原因：${item.reason}`,
        '🛒',
        { medicineName: item.medicineName, quantity: item.quantity }
      )
    }
    get().persistToStorage()
  },

  togglePurchaseItem: (id, generateActivity = true) => {
    const { purchaseItems, currentUserId, familyMembers } = get()
    const item = purchaseItems.find((p) => p.id === id)
    if (!item) return

    const willBePurchased = !item.isPurchased
    const purchaser = familyMembers.find((m) => m.id === currentUserId)
    set((state) => ({
      purchaseItems: state.purchaseItems.map((p) =>
        p.id === id
          ? {
              ...p,
              isPurchased: willBePurchased,
              purchaserId: willBePurchased ? currentUserId : undefined,
              purchaserName: willBePurchased ? purchaser?.name : undefined,
              purchaseDate: willBePurchased ? new Date().toISOString().split('T')[0] : undefined
            }
          : p
      )
    }))

    if (willBePurchased && generateActivity && purchaser) {
      get().addActivity(
        'mark_purchased',
        `${purchaser.name} 标记已购买：${item.medicineName}`,
        `共 ${item.quantity}${item.unit}，请家人确认`,
        '🛒',
        { medicineId: item.medicineId, medicineName: item.medicineName, quantity: item.quantity }
      )
    }

    get().persistToStorage()
  },

  markItemPurchased: (id, purchaserId, generateActivity = true) => {
    const { purchaseItems, familyMembers } = get()
    const item = purchaseItems.find((p) => p.id === id)
    const purchaser = familyMembers.find((m) => m.id === purchaserId)
    if (!item || item.isPurchased) return

    set((state) => ({
      purchaseItems: state.purchaseItems.map((p) =>
        p.id === id
          ? {
              ...p,
              isPurchased: true,
              purchaserId,
              purchaserName: purchaser?.name,
              purchaseDate: new Date().toISOString().split('T')[0]
            }
          : p
      )
    }))

    if (generateActivity && purchaser) {
      get().addActivity(
        'mark_purchased',
        `${purchaser.name} 标记已购买：${item.medicineName}`,
        `共 ${item.quantity}${item.unit}，请家人确认`,
        '🛒',
        { medicineId: item.medicineId, medicineName: item.medicineName, quantity: item.quantity }
      )
    }
    get().persistToStorage()
  },

  markItemsPurchased: (ids, purchaserId) => {
    let count = 0
    ids.forEach((id) => {
      const { purchaseItems, familyMembers } = get()
      const item = purchaseItems.find((p) => p.id === id)
      const purchaser = familyMembers.find((m) => m.id === purchaserId)
      if (!item || item.isPurchased) return

      set((state) => ({
        purchaseItems: state.purchaseItems.map((p) =>
          p.id === id
            ? {
                ...p,
                isPurchased: true,
                purchaserId,
                purchaserName: purchaser?.name,
                purchaseDate: new Date().toISOString().split('T')[0]
              }
            : p
        )
      }))

      if (purchaser) {
        get().addActivity(
          'mark_purchased',
          `${purchaser.name} 标记已购买：${item.medicineName}`,
          `共 ${item.quantity}${item.unit}，请家人确认`,
          '🛒',
          { medicineId: item.medicineId, medicineName: item.medicineName, quantity: item.quantity }
        )
      }
      count++
    })
    get().persistToStorage()
    return count
  },

  removePurchaseItem: (id) => {
    set((state) => ({
      purchaseItems: state.purchaseItems.filter((item) => item.id !== id)
    }))
    get().persistToStorage()
  },

  clearPurchasedItems: () => {
    set((state) => ({
      purchaseItems: state.purchaseItems.filter((item) => !item.isPurchased)
    }))
    get().persistToStorage()
  },

  // ================ 盘点管理 ================
  addInventoryRecord: (record, generateActivity = true) => {
    const newRecord: InventoryRecord = {
      ...record,
      id: generateId()
    }
    set((state) => ({
      inventoryRecords: [newRecord, ...state.inventoryRecords]
    }))

    if (generateActivity) {
      const changeTexts = newRecord.changes.map(
        (c) => `${c.medicineName} ${c.beforeQuantity}→${c.afterQuantity}`
      )
      const summary =
        changeTexts.length > 0 ? changeTexts.join('，') : '所有药品数量未变'

      get().addActivity(
        'inventory',
        `${newRecord.operator} 完成药箱盘点`,
        `共检查 ${newRecord.medicinesChecked} 种药品，${
          newRecord.changes.length > 0
            ? `调整了 ${newRecord.changes.length} 种库存：${summary}`
            : '库存无变化'
        }`,
        '📋',
        { changeSummary: summary }
      )
    }
    get().persistToStorage()
  },

  updateMedicineQuantity: (medicineId, newQuantity) => {
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId
          ? {
              ...m,
              remainingQuantity: Math.max(0, newQuantity),
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : m
      )
    }))
    get().persistToStorage()
  },

  // ================ 家庭成员管理（需求5 核心） ================
  addFamilyMember: (member) => {
    const newMember: FamilyMember = {
      id: generateId(),
      name: member.name,
      avatar: member.avatar || '👤',
      role: member.role || '成员',
      relationship: member.relationship,
      isAdmin: member.isAdmin ?? false,
      allergies: member.allergies || [],
      chronicDiseases: member.chronicDiseases || [],
      age: member.age
    }
    set((state) => ({
      familyMembers: [...state.familyMembers, newMember]
    }))
    const operator = get().getCurrentUser()!
    get().addActivity(
      'add_member',
      `新成员加入：${newMember.name}`,
      `关系：${newMember.relationship}，${newMember.age}岁`,
      '🎉',
      { memberId: newMember.id, memberName: newMember.name }
    )
    get().persistToStorage()
  },

  updateFamilyMember: (id, updates) => {
    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      )
    }))
    get().persistToStorage()
  },

  deleteFamilyMember: (id) => {
    set((state) => ({
      familyMembers: state.familyMembers.filter((m) => m.id !== id)
    }))
    get().persistToStorage()
  },

  // ================ 家庭动态管理（需求4 核心） ================
  addActivity: (type, title, description, icon, details) => {
    const user = get().getCurrentUser()
    if (!user) return

    const activity: FamilyActivity = {
      id: generateId(),
      type,
      operatorId: user.id,
      operatorName: user.name,
      operatorAvatar: user.avatar,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      title,
      description,
      icon,
      details
    }
    set((state) => ({
      activities: [activity, ...state.activities]
    }))
    get().persistToStorage()
  },

  confirmActivity: (activityId, confirmerId) => {
    const { familyMembers } = get()
    const confirmer = familyMembers.find((m) => m.id === confirmerId)
    if (!confirmer) return

    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId && a.status === 'pending'
          ? {
              ...a,
              status: 'confirmed',
              confirmerId,
              confirmerName: confirmer.name,
              confirmDate: new Date().toISOString().split('T')[0]
            }
          : a
      )
    }))
    get().persistToStorage()
  },

  getPendingActivitiesCount: () => {
    return get().activities.filter((a) => a.status === 'pending').length
  },

  getActivitiesByStatus: (status) => {
    const { activities } = get()
    if (!status) return activities
    return activities.filter((a) => a.status === status)
  },

  // ================ 用药时间线（需求3） ================
  getUsageTimeline: (filter) => {
    const { medicines, familyMembers } = get()
    const { memberId, medicineId, days = 30 } = filter || {}

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const timeline: UsageTimelineItem[] = []

    medicines.forEach((medicine) => {
      if (medicineId && medicine.id !== medicineId) return
      const categoryInfo = getCategoryInfo(medicine.category)

      medicine.usageRecords.forEach((record) => {
        if (record.date < cutoffStr) return
        if (memberId && record.userId !== memberId) return

        const user = familyMembers.find((m) => m.id === record.userId)
        timeline.push({
          id: `${medicine.id}-${record.date}-${record.userId}-${generateId()}`,
          date: record.date,
          medicineId: medicine.id,
          medicineName: medicine.name,
          medicineIcon: categoryInfo.icon,
          userId: record.userId,
          userName: record.userName || user?.name || '未知',
          userAvatar: user?.avatar || '👤',
          quantity: record.quantity,
          unit: medicine.unit,
          category: medicine.category
        })
      })
    })

    return timeline.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  },

  // ================ 盘点差异报告（需求4） ================
  generateInventoryDiffReport: (changes) => {
    const { medicines } = get()
    const diffItems: InventoryDiffItem[] = []

    changes.forEach((change) => {
      const medicine = medicines.find((m) => m.id === change.medicineId)
      if (!medicine) return

      const categoryInfo = getCategoryInfo(medicine.category)
      const diffQty = change.afterQuantity - change.beforeQuantity
      const diffPercent = change.beforeQuantity > 0
        ? Math.round((diffQty / change.beforeQuantity) * 100)
        : (diffQty > 0 ? 100 : -100)

      diffItems.push({
        medicineId: medicine.id,
        medicineName: medicine.name,
        medicineIcon: categoryInfo.icon,
        category: medicine.category,
        beforeQuantity: change.beforeQuantity,
        afterQuantity: change.afterQuantity,
        diffQuantity: diffQty,
        diffPercent,
        unit: medicine.unit,
        isLowStock: change.afterQuantity <= medicine.minStock,
        nearMinStock: change.afterQuantity <= medicine.minStock * 1.5 && change.afterQuantity > medicine.minStock
      })
    })

    const decreasedItems = diffItems.filter((i) => i.diffQuantity < 0)
      .sort((a, b) => a.diffQuantity - b.diffQuantity)
    const lowStockItems = diffItems.filter((i) => i.isLowStock)
    const nearMinStockItems = diffItems.filter((i) => i.nearMinStock)
    const existingPurchaseIds = get().purchaseItems.filter(p => !p.isPurchased).map(p => p.medicineId)
    const canAddToPurchase = [...lowStockItems, ...nearMinStockItems]
      .some(i => !existingPurchaseIds.includes(i.medicineId))

    return {
      totalChecked: changes.length,
      totalChanged: diffItems.length,
      decreasedItems,
      lowStockItems,
      nearMinStockItems,
      canAddToPurchase
    }
  },

  addLowStockToPurchase: (report) => {
    const { lowStockItems, nearMinStockItems } = report
    const itemsToAdd = [...lowStockItems, ...nearMinStockItems]
    const existingPurchaseIds = get().purchaseItems.filter(p => !p.isPurchased).map(p => p.medicineId)
    let count = 0

    itemsToAdd.forEach((item) => {
      if (existingPurchaseIds.includes(item.medicineId)) return
      const medicine = get().medicines.find((m) => m.id === item.medicineId)
      if (!medicine) return

      const suggestedQty = Math.max(medicine.totalQuantity - item.afterQuantity, medicine.minStock * 2)

      get().addPurchaseItem({
        medicineId: medicine.id,
        medicineName: medicine.name,
        specification: medicine.specification,
        category: medicine.category,
        quantity: suggestedQty,
        unit: medicine.unit,
        reason: item.isLowStock ? '库存不足，自动补充' : '接近最低库存，建议补充',
        isPurchased: false
      }, false)
      count++
    })

    return count
  }
}))
