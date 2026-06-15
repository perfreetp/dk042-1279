import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import MedicineCard from '@/components/MedicineCard'
import CategoryTab from '@/components/CategoryTab'
import { getCategoryInfo } from '@/utils'

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  const { medicines, getWarnings, familyMembers } = useMedicineStore()

  useDidShow(() => {
    console.log('[HomePage] 页面显示')
  })

  const warnings = useMemo(() => getWarnings(), [medicines])

  const filteredMedicines = useMemo(() => {
    let filtered = medicines
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((m) => m.category === selectedCategory)
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
  }, [medicines, selectedCategory, searchKeyword])

  const stats = useMemo(() => {
    const total = medicines.length
    const expiring = warnings.filter((w) => w.type === 'expiring' || w.type === 'expired').length
    const lowStock = warnings.filter((w) => w.type === 'low_stock').length
    const categories = new Set(medicines.map((m) => m.category)).size
    return { total, expiring, lowStock, categories }
  }, [medicines, warnings])

  const quickActions = [
    { icon: '📷', label: '扫码录入', color: '#2DB8A7', bgColor: '#E6F7F4', action: 'scan' },
    { icon: '➕', label: '添加药品', color: '#FF8A3D', bgColor: '#FFF2E6', action: 'add' },
    { icon: '📋', label: '库存盘点', color: '#4C9AFF', bgColor: '#E8F3FF', action: 'inventory' },
    { icon: '🛒', label: '采购计划', color: '#722ED1', bgColor: '#F3E8FF', action: 'purchase' }
  ]

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        Taro.scanCode({
          success: (res) => {
            console.log('[HomePage] 扫码结果:', res.result)
            Taro.showToast({ title: '扫码成功', icon: 'success' })
          },
          fail: (err) => {
            console.error('[HomePage] 扫码失败:', err)
          }
        })
        break
      case 'add':
        Taro.navigateTo({ url: '/pages/add-medicine/index' })
        break
      case 'inventory':
        Taro.switchTab({ url: '/pages/inventory/index' })
        break
      case 'purchase':
        Taro.switchTab({ url: '/pages/purchase/index' })
        break
    }
  }

  const handleWarningClick = (medicineId: string) => {
    Taro.navigateTo({
      url: `/pages/medicine-detail/index?id=${medicineId}`
    })
  }

  const getWarningLevelClass = (level: string) => {
    switch (level) {
      case 'danger':
        return styles.dotDanger
      case 'warning':
        return styles.dotWarning
      default:
        return styles.dotInfo
    }
  }

  const displayWarnings = warnings.slice(0, 3)

  return (
    <ScrollView scrollY className={styles.homePage} enhanced showScrollbar={false}>
      <View className={styles.header}>
        <Text className={styles.greeting}>家庭药箱 👋</Text>
        <Text className={styles.subGreeting}>共 {familyMembers.length} 位家庭成员</Text>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>药品总数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.categories}</Text>
            <Text className={styles.statLabel}>药品种类</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{warnings.length}</Text>
            <Text className={styles.statLabel}>待处理提醒</Text>
          </View>
        </View>
      </View>

      {warnings.length > 0 && (
        <View className={styles.warningCard}>
          <View className={styles.warningHeader}>
            <Text className={styles.warningIcon}>⚠️</Text>
            <Text className={styles.warningTitle}>重要提醒</Text>
            <Text className={styles.warningCount}>{warnings.length} 项</Text>
          </View>
          <View className={styles.warningList}>
            {displayWarnings.map((warning) => (
              <View
                key={warning.id}
                className={styles.warningItem}
                onClick={() => handleWarningClick(warning.medicineId)}
              >
                <View className={`${styles.warningDot} ${getWarningLevelClass(warning.level)}`} />
                <Text className={styles.warningItemText}>
                  {warning.medicineName}：{warning.message}
                </Text>
                <Text className={styles.arrowIcon}>›</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.quickActions}>
        {quickActions.map((action, index) => (
          <View
            key={index}
            className={styles.actionItem}
            onClick={() => handleQuickAction(action.action)}
          >
            <View
              className={styles.actionIcon}
              style={{ backgroundColor: action.bgColor }}
            >
              <Text>{action.icon}</Text>
            </View>
            <Text className={styles.actionLabel}>{action.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索药品名称、生产厂家..."
          placeholderClass={styles.searchPlaceholder}
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
        />
      </View>

      <CategoryTab activeKey={selectedCategory} onChange={setSelectedCategory} />

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          {selectedCategory === 'all'
            ? '全部药品'
            : getCategoryInfo(selectedCategory as any).name}
        </Text>
        <Text className={styles.sectionMore}>共 {filteredMedicines.length} 种</Text>
      </View>

      <View className={styles.medicineList}>
        {filteredMedicines.map((medicine) => (
          <MedicineCard key={medicine.id} medicine={medicine} showConsumption />
        ))}
        {filteredMedicines.length === 0 && (
          <View style={{ textAlign: 'center', padding: '80rpx 0', color: '#86909C' }}>
            <Text style={{ fontSize: '80rpx', display: 'block', marginBottom: '20rpx' }}>💊</Text>
            <Text>暂无药品，快去添加吧~</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default HomePage
