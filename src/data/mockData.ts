import { Medicine, FamilyMember, PurchaseItem, InventoryRecord, SeasonalTip } from '@/types/medicine'

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'm1',
    name: '爸爸',
    avatar: '👨',
    role: '管理员',
    relationship: '父亲',
    isAdmin: true,
    allergies: ['青霉素', '海鲜'],
    chronicDiseases: ['高血压'],
    age: 45
  },
  {
    id: 'm2',
    name: '妈妈',
    avatar: '👩',
    role: '成员',
    relationship: '母亲',
    isAdmin: false,
    allergies: ['花粉'],
    chronicDiseases: [],
    age: 42
  },
  {
    id: 'm3',
    name: '小明',
    avatar: '👦',
    role: '成员',
    relationship: '儿子',
    isAdmin: false,
    allergies: ['芒果', '尘螨'],
    chronicDiseases: ['过敏性鼻炎'],
    age: 10
  },
  {
    id: 'm4',
    name: '小红',
    avatar: '👧',
    role: '成员',
    relationship: '女儿',
    isAdmin: false,
    allergies: [],
    chronicDiseases: [],
    age: 6
  }
]

const generateUsageRecords = (count: number, startDaysAgo: number = 60) => {
  const records = []
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * startDaysAgo)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    records.push({
      date: date.toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 3) + 1,
      userId: mockFamilyMembers[Math.floor(Math.random() * mockFamilyMembers.length)].id,
      userName: mockFamilyMembers[Math.floor(Math.random() * mockFamilyMembers.length)].name
    })
  }
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const mockMedicines: Medicine[] = [
  {
    id: 'med1',
    name: '感冒灵颗粒',
    genericName: '感冒灵颗粒',
    category: 'cold',
    specification: '10g*9袋',
    manufacturer: '三九医药',
    totalQuantity: 9,
    remainingQuantity: 3,
    unit: '袋',
    openStatus: 'opened',
    openDate: '2026-05-15',
    expiryDate: '2026-08-20',
    productionDate: '2024-08-20',
    usage: '开水冲服',
    dosage: '一次1袋，一日3次',
    indications: '解热镇痛。用于感冒引起的头痛、发热、鼻塞、流涕、咽痛。',
    contraindications: '孕妇、哺乳期妇女禁用；糖尿病患者禁服。',
    sideEffects: '偶见皮疹、荨麻疹、药热及粒细胞减少；长期大量用药会导致肝肾功能异常。',
    storage: '密封保存',
    notes: '家庭常备感冒药',
    applicablePeople: ['m1', 'm2'],
    taboos: [
      { memberId: 'm3', memberName: '小明', reason: '儿童需减量使用' },
      { memberId: 'm4', memberName: '小红', reason: '年龄太小，不建议使用' }
    ],
    usageRecords: generateUsageRecords(8),
    minStock: 5,
    expiryWarningDays: 30,
    seasonTips: '冬春季节常备',
    createdAt: '2026-01-10',
    updatedAt: '2026-06-10'
  },
  {
    id: 'med2',
    name: '布洛芬缓释胶囊',
    genericName: '布洛芬缓释胶囊',
    category: 'cold',
    specification: '0.3g*20粒',
    manufacturer: '中美史克',
    totalQuantity: 20,
    remainingQuantity: 18,
    unit: '粒',
    openStatus: 'opened',
    openDate: '2026-03-20',
    expiryDate: '2027-06-15',
    usage: '口服',
    dosage: '一次1粒，一日2次（早晚各一次）',
    indications: '用于缓解轻至中度疼痛，也用于普通感冒或流行性感冒引起的发热。',
    contraindications: '对其他非甾体抗炎药过敏者禁用；孕妇及哺乳期妇女禁用。',
    sideEffects: '恶心、呕吐、胃烧灼感或轻度消化不良等。',
    storage: '密封，在干燥处保存',
    notes: '退烧止疼常用药',
    applicablePeople: ['m1', 'm2'],
    taboos: [
      { memberId: 'm3', memberName: '小明', reason: '需在医生指导下使用' },
      { memberId: 'm4', memberName: '小红', reason: '不适用' }
    ],
    usageRecords: generateUsageRecords(5),
    minStock: 10,
    expiryWarningDays: 60,
    seasonTips: '四季常备',
    createdAt: '2026-02-01',
    updatedAt: '2026-06-05'
  },
  {
    id: 'med3',
    name: '蒙脱石散',
    genericName: '蒙脱石散',
    category: 'stomach',
    specification: '3g*10袋',
    manufacturer: '博福-益普生',
    totalQuantity: 10,
    remainingQuantity: 8,
    unit: '袋',
    openStatus: 'unopened',
    expiryDate: '2027-09-30',
    usage: '倒入半杯温水（约50毫升），摇匀后服用',
    dosage: '成人一次1袋，一日3次',
    indications: '用于成人及儿童急、慢性腹泻。',
    contraindications: '尚不明确',
    sideEffects: '偶见便秘，大便干结。',
    storage: '密闭保存',
    notes: '止泻药，急性腹泻时使用',
    applicablePeople: ['m1', 'm2', 'm3', 'm4'],
    taboos: [],
    usageRecords: generateUsageRecords(3),
    minStock: 5,
    expiryWarningDays: 60,
    seasonTips: '夏秋季节常备',
    createdAt: '2026-01-20',
    updatedAt: '2026-05-28'
  },
  {
    id: 'med4',
    name: '健胃消食片',
    genericName: '健胃消食片',
    category: 'stomach',
    specification: '0.5g*32片',
    manufacturer: '江中制药',
    totalQuantity: 32,
    remainingQuantity: 25,
    unit: '片',
    openStatus: 'opened',
    openDate: '2026-04-10',
    expiryDate: '2026-12-31',
    usage: '口服，可以咀嚼',
    dosage: '一次3片，一日3次',
    indications: '健胃消食。用于脾胃虚弱所致的食积、消化不良。',
    contraindications: '尚不明确',
    sideEffects: '尚不明确',
    storage: '密封',
    notes: '消化不良时服用',
    applicablePeople: ['m1', 'm2', 'm3'],
    taboos: [
      { memberId: 'm4', memberName: '小红', reason: '需在成人监护下使用' }
    ],
    usageRecords: generateUsageRecords(6),
    minStock: 10,
    expiryWarningDays: 30,
    seasonTips: '四季常备',
    createdAt: '2026-02-15',
    updatedAt: '2026-06-08'
  },
  {
    id: 'med5',
    name: '碘伏消毒液',
    genericName: '聚维酮碘消毒液',
    category: 'injury',
    specification: '100ml',
    manufacturer: '可孚',
    totalQuantity: 2,
    remainingQuantity: 2,
    unit: '瓶',
    openStatus: 'unopened',
    expiryDate: '2027-03-15',
    usage: '外用',
    dosage: '用棉签蘸取少量，由中心向外周局部涂擦',
    indications: '化脓性皮炎、皮肤真菌感染、小面积轻度烧烫伤，也用于小面积皮肤、黏膜创口的消毒。',
    contraindications: '孕妇及哺乳期妇女禁用',
    sideEffects: '偶见过敏反应和皮炎',
    storage: '密封，避光，置阴凉处',
    notes: '伤口消毒用',
    applicablePeople: ['m1', 'm2', 'm3', 'm4'],
    taboos: [],
    usageRecords: generateUsageRecords(2),
    minStock: 1,
    expiryWarningDays: 90,
    seasonTips: '四季常备',
    createdAt: '2026-01-05',
    updatedAt: '2026-04-15'
  },
  {
    id: 'med6',
    name: '创可贴',
    genericName: '创可贴',
    category: 'injury',
    specification: '70mm*18mm*100片',
    manufacturer: '云南白药',
    totalQuantity: 100,
    remainingQuantity: 12,
    unit: '片',
    openStatus: 'opened',
    openDate: '2026-02-28',
    expiryDate: '2026-07-30',
    usage: '外用',
    dosage: '先清洁伤口，撕去覆盖膜，将药带贴于创面上',
    indications: '用于小面积开放性外科创伤',
    contraindications: '对本品过敏者禁用',
    sideEffects: '罕见过敏反应',
    storage: '密封，在阴凉干燥处保存',
    notes: '家庭必备',
    applicablePeople: ['m1', 'm2', 'm3', 'm4'],
    taboos: [],
    usageRecords: generateUsageRecords(15),
    minStock: 20,
    expiryWarningDays: 30,
    seasonTips: '四季常备',
    createdAt: '2026-01-15',
    updatedAt: '2026-06-12'
  },
  {
    id: 'med7',
    name: '小儿氨酚黄那敏颗粒',
    genericName: '小儿氨酚黄那敏颗粒',
    category: 'child',
    specification: '6g*10袋',
    manufacturer: '护彤',
    totalQuantity: 10,
    remainingQuantity: 6,
    unit: '袋',
    openStatus: 'opened',
    openDate: '2026-05-20',
    expiryDate: '2026-06-25',
    usage: '温水冲服',
    dosage: '1-3岁一次0.5-1袋；4-6岁一次1-1.5袋；7-9岁一次1.5-2袋；10-12岁一次2-2.5袋，一日3次',
    indications: '适用于缓解儿童普通感冒及流行性感冒引起的发热、头痛、四肢酸痛、打喷嚏、流鼻涕、鼻塞、咽痛等症状。',
    contraindications: '严重肝肾功能不全者禁用。',
    sideEffects: '有时有轻度头晕、乏力、恶心、上腹不适、口干、食欲缺乏和皮疹等，可自行恢复。',
    storage: '密封，在阴凉干燥处保存',
    notes: '儿童专用感冒药',
    applicablePeople: ['m3', 'm4'],
    taboos: [
      { memberId: 'm1', memberName: '爸爸', reason: '儿童用药，成人不适用' },
      { memberId: 'm2', memberName: '妈妈', reason: '儿童用药，成人不适用' }
    ],
    usageRecords: generateUsageRecords(5),
    minStock: 5,
    expiryWarningDays: 15,
    seasonTips: '冬春季节常备',
    createdAt: '2026-03-01',
    updatedAt: '2026-06-10'
  },
  {
    id: 'med8',
    name: '维生素C泡腾片',
    genericName: '维生素C泡腾片',
    category: 'other',
    specification: '1g*10片',
    manufacturer: '力度伸',
    totalQuantity: 10,
    remainingQuantity: 10,
    unit: '片',
    openStatus: 'unopened',
    expiryDate: '2027-01-20',
    usage: '用温水或冷水溶解后服用',
    dosage: '成人一日1-2片，儿童一日0.5-1片',
    indications: '增强机体抵抗力，用于预防和治疗各种急、慢性传染性疾病或其他疾病。',
    contraindications: '大量服用可引起腹泻、皮肤红而亮、头痛、尿频、恶心呕吐、胃痉挛。',
    sideEffects: '长期服用每日2-3克可引起停药后坏血病。',
    storage: '遮光，密封保存',
    notes: '补充维生素C',
    applicablePeople: ['m1', 'm2', 'm3', 'm4'],
    taboos: [],
    usageRecords: generateUsageRecords(0),
    minStock: 5,
    expiryWarningDays: 60,
    seasonTips: '四季常备',
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01'
  },
  {
    id: 'med9',
    name: '阿莫西林胶囊',
    genericName: '阿莫西林胶囊',
    category: 'other',
    specification: '0.25g*24粒',
    manufacturer: '联邦制药',
    totalQuantity: 24,
    remainingQuantity: 24,
    unit: '粒',
    openStatus: 'unopened',
    expiryDate: '2026-05-10',
    usage: '口服',
    dosage: '成人一次0.5g，每6-8小时1次',
    indications: '用于敏感菌（不产β内酰胺酶菌株）所致的感染。',
    contraindications: '青霉素过敏及青霉素皮肤试验阳性患者禁用。',
    sideEffects: '恶心、呕吐、腹泻及假膜性肠炎等胃肠道反应。',
    storage: '遮光，密封保存',
    notes: '抗生素，需遵医嘱使用',
    applicablePeople: ['m1', 'm2'],
    taboos: [
      { memberId: 'm1', memberName: '爸爸', reason: '青霉素过敏，禁用' }
    ],
    usageRecords: generateUsageRecords(0),
    minStock: 10,
    expiryWarningDays: 30,
    seasonTips: '按需准备',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10'
  },
  {
    id: 'med10',
    name: '碘伏棉签',
    genericName: '碘伏消毒棉签',
    category: 'injury',
    specification: '60支装',
    manufacturer: '海氏海诺',
    totalQuantity: 60,
    remainingQuantity: 45,
    unit: '支',
    openStatus: 'opened',
    openDate: '2026-03-10',
    expiryDate: '2027-05-20',
    usage: '外用',
    dosage: '折断棉签，待碘伏流入棉签头后使用',
    indications: '皮肤、黏膜的消毒',
    contraindications: '对碘过敏者禁用',
    sideEffects: '偶见过敏反应',
    storage: '密封，阴凉干燥处',
    notes: '独立包装，外出便携',
    applicablePeople: ['m1', 'm2', 'm3', 'm4'],
    taboos: [],
    usageRecords: generateUsageRecords(10),
    minStock: 30,
    expiryWarningDays: 60,
    seasonTips: '四季常备',
    createdAt: '2026-02-20',
    updatedAt: '2026-06-01'
  }
]

export const mockPurchaseItems: PurchaseItem[] = [
  {
    id: 'p1',
    medicineId: 'med1',
    medicineName: '感冒灵颗粒',
    specification: '10g*9袋',
    category: 'cold',
    quantity: 2,
    unit: '盒',
    reason: '库存不足',
    isPurchased: false
  },
  {
    id: 'p2',
    medicineId: 'med6',
    medicineName: '创可贴',
    specification: '70mm*18mm*100片',
    category: 'injury',
    quantity: 2,
    unit: '盒',
    reason: '库存不足 + 临期',
    isPurchased: false
  },
  {
    id: 'p3',
    medicineId: 'med7',
    medicineName: '小儿氨酚黄那敏颗粒',
    specification: '6g*10袋',
    category: 'child',
    quantity: 3,
    unit: '盒',
    reason: '即将过期',
    isPurchased: false
  },
  {
    id: 'p4',
    medicineId: 'med9',
    medicineName: '阿莫西林胶囊',
    specification: '0.25g*24粒',
    category: 'other',
    quantity: 1,
    unit: '盒',
    reason: '已过期，需更换',
    isPurchased: true,
    purchaseDate: '2026-06-10'
  },
  {
    id: 'p5',
    medicineId: 'med8',
    medicineName: '维生素C泡腾片',
    specification: '1g*10片',
    category: 'other',
    quantity: 2,
    unit: '盒',
    reason: '夏季补充维生素',
    isPurchased: true,
    purchaseDate: '2026-06-08'
  }
]

export const mockInventoryRecords: InventoryRecord[] = [
  {
    id: 'inv1',
    date: '2026-06-10',
    operator: '爸爸',
    operatorId: 'm1',
    medicinesChecked: 10,
    changes: [
      { medicineId: 'med1', medicineName: '感冒灵颗粒', beforeQuantity: 5, afterQuantity: 3 },
      { medicineId: 'med6', medicineName: '创可贴', beforeQuantity: 20, afterQuantity: 12 }
    ],
    notes: '周末常规盘点'
  },
  {
    id: 'inv2',
    date: '2026-05-15',
    operator: '妈妈',
    operatorId: 'm2',
    medicinesChecked: 8,
    changes: [
      { medicineId: 'med4', medicineName: '健胃消食片', beforeQuantity: 30, afterQuantity: 25 }
    ],
    notes: '五一假期后盘点'
  },
  {
    id: 'inv3',
    date: '2026-04-20',
    operator: '爸爸',
    operatorId: 'm1',
    medicinesChecked: 10,
    changes: [],
    notes: '一切正常'
  }
]

export const mockSeasonalTips: SeasonalTip[] = [
  {
    season: 'summer',
    category: 'stomach',
    medicines: ['蒙脱石散', '藿香正气水', '健胃消食片'],
    reason: '夏季气温高，食物易变质，肠胃疾病多发'
  },
  {
    season: 'summer',
    category: 'injury',
    medicines: ['碘伏消毒液', '创可贴', '清凉油'],
    reason: '夏季户外活动多，容易受伤和中暑'
  },
  {
    season: 'winter',
    category: 'cold',
    medicines: ['感冒灵颗粒', '布洛芬', '连花清瘟胶囊'],
    reason: '冬春季节气温低，是感冒流感高发期'
  },
  {
    season: 'spring',
    category: 'other',
    medicines: ['氯雷他定', '鼻炎喷剂'],
    reason: '春季花粉多，过敏患者需要提前准备'
  },
  {
    season: 'autumn',
    category: 'child',
    medicines: ['小儿氨酚黄那敏颗粒', '小儿止咳糖浆', '退热贴'],
    reason: '秋季换季，儿童容易感冒发烧'
  }
]
