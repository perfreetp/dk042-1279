import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { getCategoryInfo, daysUntilExpiry } from '@/utils'
import { Medicine } from '@/types/medicine'

type FilterType = 'all' | 'low' | 'expiring' | 'checked'

const InventoryPage: React.FC = () => {
  const { medicines, inventoryRecords, updateMedicine, addInventoryRecord, familyMembers } =
    useMedicineStore()

  const [filterType, setFilterType] = useState<FilterType>('all')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const initQuantities = () => {
    const qtys: Record<string, number> = {}
    medicines.forEach((m) => {
      qtys[m.id] = m.remainingQuantity
    })
    setQuantities(qtys)
  }

  React.useEffect(() => {
    initQuantities()
  }, [medicines])

  const filteredMedicines = useMemo(() => {
    let filtered = [...medicines]

    switch (filterType) {
      case 'low':
        filtered = filtered.filter((m) => m.remainingQuantity <= m.minStock)
        break
      case 'expiring':
        filtered = filtered.filter((m) => {
          const daysLeft = daysUntilExpiry(m.expiryDate)
          return daysLeft <= 30
        })
        break
      default:
        break
    }

    return filtered
  }, [medicines, filterType])

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const newValue = Math.max(0, (prev[id] || 0) + delta)
      return { ...prev, [id]: newValue }
    })
    if (!checkedItems.has(id)) {
      setCheckedItems((prev) => new Set(prev).add(id))
    }
  }

  const getStatusInfo = (medicine: Medicine) => {
    const daysLeft = daysUntilExpiry(medicine.expiryDate)
    if (daysLeft <= 0) {
      return { text: '已过期', className: styles.statusExpired }
    }
    if (medicine.remainingQuantity <= medicine.minStock || daysLeft <= 30) {
      return { text: '需关注', className: styles.statusLow }
    }
    return { text: '正常', className: styles.statusNormal }
  }

  const handleScan = () => {
    Taro.scanCode({
      success: (res) => {
        console.log('[InventoryPage] 扫码结果:', res.result)
        Taro.showToast({ title: '扫码成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('[InventoryPage] 扫码失败:', err)
      }
    })
  }

  const handleAddMedicine = () => {
    Taro.navigateTo({ url: '/pages/add-medicine/index' })
  }

  const handleConfirmInventory = () => {
    const changes: {
      medicineId: string
      medicineName: string
      beforeQuantity: number
      afterQuantity: number
    }[] = []

    checkedItems.forEach((id) => {
      const medicine = medicines.find((m) => m.id === id)
      if (medicine && quantities[id] !== medicine.remainingQuantity) {
        changes.push({
          medicineId: id,
          medicineName: medicine.name,
          beforeQuantity: medicine.remainingQuantity,
          afterQuantity: quantities[id]
        })
        updateMedicine(id, { remainingQuantity: quantities[id] })
      }
    })

    addInventoryRecord({
      date: new Date().toISOString().split('T')[0],
      operator: familyMembers[0]?.name || '管理员',
      operatorId: familyMembers[0]?.id || '',
      medicinesChecked: checkedItems.size,
      changes,
      notes: changes.length > 0 ? `调整了${changes.length}种药品数量` : '库存无变化'
    })

    Taro.showToast({
      title: '盘点完成',
      icon: 'success',
      duration: 2000
    })

    setCheckedItems(new Set())
  }

  const stats = useMemo(() => {
    const total = medicines.length
    const lowStock = medicines.filter((m) => m.remainingQuantity <= m.minStock).length
    const expiring = medicines.filter((m) => daysUntilExpiry(m.expiryDate) <= 30).length
    return { total, lowStock, expiring, checked: checkedItems.size }
  }, [medicines, checkedItems])

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'low', label: '低库存' },
    { key: 'expiring', label: '临期/过期' }
  ]

  return (
    <ScrollView scrollY className={styles.inventoryPage} enhanced showScrollbar={false}>
      <View className={styles.headerSection}>
        <Text className={styles.headerTitle}>库存盘点</Text>
        <Text className={styles.headerDesc}>核对药品库存，记录消耗情况</Text>

        <View className={styles.progressInfo}>
          <View className={styles.progressItem}>
            <Text className={styles.progressValue}>{stats.total}</Text>
            <Text className={styles.progressLabel}>药品总数</Text>
          </View>
          <View className={styles.progressItem}>
            <Text className={styles.progressValue}>{stats.lowStock}</Text>
            <Text className={styles.progressLabel}>低库存</Text>
          </View>
          <View className={styles.progressItem}>
            <Text className={styles.progressValue}>{stats.expiring}</Text>
            <Text className={styles.progressLabel}>临期/过期</Text>
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        <Button className={`${styles.actionBtn} ${styles.scanBtn}`} onClick={handleScan}>
          <Text className={styles.btnIcon}>📷</Text>
          扫码录入
        </Button>
        <Button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={handleAddMedicine}>
          <Text className={styles.btnIcon}>➕</Text>
          添加药品
        </Button>
      </View>

      <View className={styles.filterBar}>
        <Text className={styles.filterLabel}>盘点清单</Text>
        <View className={styles.filterOptions}>
          {filters.map((f) => (
            <Text
              key={f.key}
              className={classnames(styles.filterOption, {
                [styles.active]: filterType === f.key
              })}
              onClick={() => setFilterType(f.key as FilterType)}
            >
              {f.label}
            </Text>
          ))}
        </View>
      </View>

      <View className={styles.medicineList}>
        {filteredMedicines.map((medicine) => {
          const categoryInfo = getCategoryInfo(medicine.category)
          const statusInfo = getStatusInfo(medicine)
          const isChecked = checkedItems.has(medicine.id)

          return (
            <View
              key={medicine.id}
              className={styles.inventoryItem}
              style={{ opacity: isChecked ? 1 : 0.7 }}
            >
              <View className={styles.itemHeader}>
                <View
                  className={styles.itemIcon}
                  style={{ backgroundColor: categoryInfo.bgColor }}
                >
                  <Text>{categoryInfo.icon}</Text>
                </View>
                <View className={styles.itemInfo}>
                  <Text className={styles.itemName}>{medicine.name}</Text>
                  <Text className={styles.itemSpec}>{medicine.specification}</Text>
                </View>
                <View className={`${styles.itemStatus} ${statusInfo.className}`}>
                  <Text>{statusInfo.text}</Text>
                </View>
              </View>

              <View className={styles.quantityControl}>
                <Text className={styles.quantityLabel}>
                  {isChecked ? '已盘点' : '当前库存'}
                </Text>
                <View className={styles.quantityActions}>
                  <View
                    className={styles.qtyBtn}
                    onClick={() => handleQuantityChange(medicine.id, -1)}
                  >
                    <Text>−</Text>
                  </View>
                  <View className={styles.qtyValue}>
                    {quantities[medicine.id] ?? medicine.remainingQuantity}
                    <Text className={styles.qtyUnit}> {medicine.unit}</Text>
                  </View>
                  <View
                    className={styles.qtyBtn}
                    onClick={() => handleQuantityChange(medicine.id, 1)}
                  >
                    <Text>+</Text>
                  </View>
                </View>
              </View>
            </View>
          )
        })}

        {filteredMedicines.length === 0 && (
          <View style={{ textAlign: 'center', padding: '80rpx 0', color: '#86909C' }}>
            <Text style={{ fontSize: '80rpx', display: 'block', marginBottom: '20rpx' }}>📋</Text>
            <Text>暂无符合条件的药品</Text>
          </View>
        )}
      </View>

      <View className={styles.historySection}>
        <Text className={styles.historyTitle}>盘点记录</Text>
        {inventoryRecords.slice(0, 3).map((record) => (
          <View key={record.id} className={styles.historyCard}>
            <View className={styles.historyHeader}>
              <Text className={styles.historyDate}>{record.date}</Text>
              <Text className={styles.historyOperator}>执行人：{record.operator}</Text>
            </View>
            <View className={styles.historyInfo}>
              <Text>
                共检查 {record.medicinesChecked} 种药品
                {record.changes.length > 0 ? `，调整 ${record.changes.length} 种` : ''}
              </Text>
              <Text style={{ display: 'block', marginTop: '8rpx', color: '#86909C' }}>
                {record.notes}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.summaryInfo}>
          <Text className={styles.summaryText}>已盘点</Text>
          <Text className={styles.summaryValue}>
            {stats.checked} <Text style={{ fontSize: '24rpx', fontWeight: 'normal' }}>项</Text>
          </Text>
        </View>
        <Button
          className={styles.confirmBtn}
          onClick={handleConfirmInventory}
          disabled={checkedItems.size === 0}
        >
          确认盘点
        </Button>
      </View>
    </ScrollView>
  )
}

export default InventoryPage
