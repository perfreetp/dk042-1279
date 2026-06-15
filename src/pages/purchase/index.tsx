import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { mockSeasonalTips } from '@/data/mockData'
import { getCategoryInfo, getCurrentSeason, getSeasonName, calculateConsumptionRate } from '@/utils'
import { PurchaseItem } from '@/types/medicine'

type TabType = 'pending' | 'purchased'

const PurchasePage: React.FC = () => {
  const {
    purchaseItems,
    togglePurchaseItem,
    removePurchaseItem,
    clearPurchasedItems,
    medicines
  } = useMedicineStore()

  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const currentSeason = getCurrentSeason()
  const seasonTips = mockSeasonalTips.filter((tip) => tip.season === currentSeason)

  const pendingItems = useMemo(
    () => purchaseItems.filter((item) => !item.isPurchased),
    [purchaseItems]
  )
  const purchasedItems = useMemo(
    () => purchaseItems.filter((item) => item.isPurchased),
    [purchaseItems]
  )

  const displayItems = activeTab === 'pending' ? pendingItems : purchasedItems

  const getConsumption = (medicineId: string) => {
    const medicine = medicines.find((m) => m.id === medicineId)
    if (!medicine) return 0
    return calculateConsumptionRate(medicine)
  }

  const handleToggleItem = (id: string) => {
    togglePurchaseItem(id)
    if (activeTab === 'pending') {
      setSelectedItems((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    }
  }

  const handleDeleteItem = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要从采购清单中移除该药品吗？',
      success: (res) => {
        if (res.confirm) {
          removePurchaseItem(id)
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.size === pendingItems.length && pendingItems.length > 0) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(pendingItems.map((item) => item.id)))
    }
  }

  const handleMarkPurchased = () => {
    selectedItems.forEach((id) => {
      togglePurchaseItem(id)
    })
    setSelectedItems(new Set())
    Taro.showToast({ title: '已标记为已购买', icon: 'success' })
  }

  const handleClearPurchased = () => {
    if (purchasedItems.length === 0) return
    Taro.showModal({
      title: '清空已购买',
      content: '确定要清空所有已购买的项目吗？',
      success: (res) => {
        if (res.confirm) {
          clearPurchasedItems()
          Taro.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }

  const handleAddPurchase = () => {
    Taro.navigateTo({ url: '/pages/add-medicine/index' })
  }

  const stats = {
    pending: pendingItems.length,
    purchased: purchasedItems.length,
    selected: selectedItems.size
  }

  return (
    <ScrollView scrollY className={styles.purchasePage} enhanced showScrollbar={false}>
      <View className={styles.headerSection}>
        <Text className={styles.headerTitle}>采购计划</Text>
        <Text className={styles.headerDesc}>按需采购，避免囤药浪费</Text>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待采购</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.purchased}</Text>
            <Text className={styles.statLabel}>已购买</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{seasonTips.length}</Text>
            <Text className={styles.statLabel}>季节建议</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, { [styles.active]: activeTab === 'pending' })}
          onClick={() => setActiveTab('pending')}
        >
          待采购
          <Text className={styles.tabCount}>{stats.pending}</Text>
        </View>
        <View
          className={classnames(styles.tabItem, { [styles.active]: activeTab === 'purchased' })}
          onClick={() => setActiveTab('purchased')}
        >
          已购买
          <Text className={styles.tabCount}>{stats.purchased}</Text>
        </View>
      </View>

      {activeTab === 'pending' && seasonTips.length > 0 && (
        <View className={styles.seasonalTips}>
          <View className={styles.tipsHeader}>
            <Text className={styles.tipsIcon}>🌿</Text>
            <Text className={styles.tipsTitle}>当季采购建议</Text>
            <Text className={styles.tipsSeason}>{getSeasonName(currentSeason)}</Text>
          </View>
          <View className={styles.tipsContent}>
            {seasonTips.map((tip, index) => (
              <View key={index} className={styles.tipItem}>
                <Text className={styles.tipCategory}>
                  {getCategoryInfo(tip.category).icon} {getCategoryInfo(tip.category).name}
                </Text>
                <Text className={styles.tipMedicines}>推荐：{tip.medicines.join('、')}</Text>
                <Text className={styles.tipReason}>{tip.reason}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.listSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            {activeTab === 'pending' ? '待采购清单' : '已购买记录'}
          </Text>
          {activeTab === 'pending' ? (
            <Text className={styles.sectionAction} onClick={handleAddPurchase}>
              + 添加
            </Text>
          ) : (
            <Text className={styles.sectionAction} onClick={handleClearPurchased}>
              清空
            </Text>
          )}
        </View>

        {displayItems.length > 0 ? (
          displayItems.map((item) => (
            <PurchaseItemCard
              key={item.id}
              item={item}
              isPurchased={activeTab === 'purchased'}
              consumption={getConsumption(item.medicineId)}
              onToggle={() => handleToggleItem(item.id)}
              onDelete={() => handleDeleteItem(item.id)}
              isSelected={selectedItems.has(item.id)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🛒</Text>
            <Text className={styles.emptyText}>
              {activeTab === 'pending' ? '暂无待采购药品' : '暂无已购买记录'}
            </Text>
            <Text className={styles.emptyDesc}>
              {activeTab === 'pending' ? '从药箱添加需要补充的药品吧' : '采购完成后会显示在这里'}
            </Text>
          </View>
        )}
      </View>

      {activeTab === 'pending' && pendingItems.length > 0 && (
        <View className={styles.bottomBar}>
          <View className={styles.selectAll} onClick={handleSelectAll}>
            <View
              className={classnames(styles.checkboxAll, {
                [styles.checked]:
                  selectedItems.size === pendingItems.length && pendingItems.length > 0
              })}
            >
              {selectedItems.size === pendingItems.length && pendingItems.length > 0 && (
                <Text style={{ color: '#fff', fontSize: '20rpx' }}>✓</Text>
              )}
            </View>
            <Text>全选</Text>
          </View>
          <View className={styles.summaryInfo}>
            <Text className={styles.summaryText}>已选择 {stats.selected} 项</Text>
          </View>
          <Button
            className={styles.actionBtn}
            onClick={handleMarkPurchased}
            disabled={selectedItems.size === 0}
          >
            标记已购
          </Button>
        </View>
      )}
    </ScrollView>
  )
}

interface PurchaseItemCardProps {
  item: PurchaseItem
  isPurchased: boolean
  consumption: number
  onToggle: () => void
  onDelete: () => void
  isSelected: boolean
}

const PurchaseItemCard: React.FC<PurchaseItemCardProps> = ({
  item,
  isPurchased,
  consumption,
  onToggle,
  onDelete,
  isSelected
}) => {
  const categoryInfo = getCategoryInfo(item.category)

  return (
    <View
      className={classnames(styles.purchaseItem, {
        [styles.purchasedItem]: isPurchased
      })}
    >
      <View
        className={classnames(styles.itemCheckbox, {
          [styles.checked]: isPurchased || isSelected
        })}
        onClick={onToggle}
      >
        {(isPurchased || isSelected) && <Text className={styles.checkIcon}>✓</Text>}
      </View>
      <View className={styles.itemContent}>
        <View className={styles.itemHeader}>
          <View className={styles.itemInfo}>
            <Text className={styles.itemName}>{item.medicineName}</Text>
            <Text className={styles.itemSpec}>{item.specification}</Text>
          </View>
          <View
            className={styles.itemCategory}
            style={{ backgroundColor: categoryInfo.bgColor, color: categoryInfo.color }}
          >
            <Text>{categoryInfo.name}</Text>
          </View>
        </View>
        <View className={styles.itemMeta}>
          <Text className={styles.itemQuantity}>
            采购数量：
            <Text className={styles.quantityNum}>
              {item.quantity} {item.unit}
            </Text>
          </Text>
          <Text className={styles.itemReason}>{item.reason}</Text>
        </View>
        <View className={styles.itemFooter}>
          {consumption > 0 ? (
            <Text className={styles.consumptionInfo}>
              月消耗约 {consumption} {item.unit}，可用
              {Math.round((item.quantity / consumption) * 30)}天
            </Text>
          ) : (
            <Text className={styles.consumptionInfo}>暂无消耗数据</Text>
          )}
          <Text className={styles.deleteBtn} onClick={onDelete}>
            删除
          </Text>
        </View>
      </View>
    </View>
  )
}

export default PurchasePage
