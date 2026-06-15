import { create } from 'zustand'
import { Medicine, FamilyMember, PurchaseItem, InventoryRecord, WarningItem } from '@/types/medicine'
import { mockMedicines, mockFamilyMembers, mockPurchaseItems, mockInventoryRecords } from '@/data/mockData'
import { checkMedicineWarnings, generateId } from '@/utils'

interface MedicineState {
  medicines: Medicine[]
  familyMembers: FamilyMember[]
  purchaseItems: PurchaseItem[]
  inventoryRecords: InventoryRecord[]
  selectedCategory: string
  searchKeyword: string

  setSelectedCategory: (category: string) => void
  setSearchKeyword: (keyword: string) => void

  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMedicine: (id: string, updates: Partial<Medicine>) => void
  deleteMedicine: (id: string) => void

  getMedicineById: (id: string) => Medicine | undefined
  getMedicinesByCategory: (category: string) => Medicine[]
  getWarnings: () => WarningItem[]

  addPurchaseItem: (item: Omit<PurchaseItem, 'id'>) => void
  togglePurchaseItem: (id: string) => void
  removePurchaseItem: (id: string) => void
  clearPurchasedItems: () => void

  addInventoryRecord: (record: Omit<InventoryRecord, 'id'>) => void

  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void
  deleteFamilyMember: (id: string) => void
}

export const useMedicineStore = create<MedicineState>((set, get) => ({
  medicines: mockMedicines,
  familyMembers: mockFamilyMembers,
  purchaseItems: mockPurchaseItems,
  inventoryRecords: mockInventoryRecords,
  selectedCategory: 'all',
  searchKeyword: '',

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  addMedicine: (medicine) =>
    set((state) => {
      const newMedicine: Medicine = {
        ...medicine,
        id: generateId(),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      return { medicines: [newMedicine, ...state.medicines] }
    }),

  updateMedicine: (id, updates) =>
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : m
      )
    })),

  deleteMedicine: (id) =>
    set((state) => ({
      medicines: state.medicines.filter((m) => m.id !== id)
    })),

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
          m.genericName.toLowerCase().includes(keyword) ||
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

  addPurchaseItem: (item) =>
    set((state) => ({
      purchaseItems: [{ ...item, id: generateId() }, ...state.purchaseItems]
    })),

  togglePurchaseItem: (id) =>
    set((state) => ({
      purchaseItems: state.purchaseItems.map((item) =>
        item.id === id
          ? {
              ...item,
              isPurchased: !item.isPurchased,
              purchaseDate: !item.isPurchased ? new Date().toISOString().split('T')[0] : undefined
            }
          : item
      )
    })),

  removePurchaseItem: (id) =>
    set((state) => ({
      purchaseItems: state.purchaseItems.filter((item) => item.id !== id)
    })),

  clearPurchasedItems: () =>
    set((state) => ({
      purchaseItems: state.purchaseItems.filter((item) => !item.isPurchased)
    })),

  addInventoryRecord: (record) =>
    set((state) => ({
      inventoryRecords: [{ ...record, id: generateId() }, ...state.inventoryRecords]
    })),

  addFamilyMember: (member) =>
    set((state) => ({
      familyMembers: [...state.familyMembers, { ...member, id: generateId() }]
    })),

  updateFamilyMember: (id, updates) =>
    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      )
    })),

  deleteFamilyMember: (id) =>
    set((state) => ({
      familyMembers: state.familyMembers.filter((m) => m.id !== id)
    }))
}))
