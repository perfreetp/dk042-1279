import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { Medicine } from '@/types/medicine'
import { getCategoryInfo, daysUntilExpiry, calculateConsumptionRate } from '@/utils'

interface MedicineCardProps {
  medicine: Medicine
  onClick?: () => void
  showWarnings?: boolean
  showConsumption?: boolean
}

const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onClick,
  showWarnings = true,
  showConsumption = false
}) => {
  const categoryInfo = getCategoryInfo(medicine.category)
  const daysLeft = daysUntilExpiry(medicine.expiryDate)
  const consumptionRate = calculateConsumptionRate(medicine)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/medicine-detail/index?id=${medicine.id}`
      })
    }
  }

  const getStatusBadge = () => {
    if (daysLeft <= 0) {
      return { text: '已过期', type: 'danger' }
    }
    if (daysLeft <= 30) {
      return { text: `临期${daysLeft}天`, type: 'warning' }
    }
    if (medicine.openStatus === 'opened') {
      return { text: '已开封', type: 'info' }
    }
    return { text: '未开封', type: 'success' }
  }

  const statusBadge = getStatusBadge()
  const stockPercentage = Math.min(
    100,
    Math.round((medicine.remainingQuantity / medicine.totalQuantity) * 100)
  )

  return (
    <View className={styles.medicineCard} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View
          className={styles.categoryIcon}
          style={{ backgroundColor: categoryInfo.bgColor, color: categoryInfo.color }}
        >
          <Text>{categoryInfo.icon}</Text>
        </View>
        <View className={styles.medicineInfo}>
          <Text className={styles.medicineName}>{medicine.name}</Text>
          <Text className={styles.medicineSpec}>{medicine.specification}</Text>
        </View>
        <View
          className={classnames(
            styles.statusBadge,
            styles[`status${statusBadge.type.charAt(0).toUpperCase() + statusBadge.type.slice(1)}`]
          )}
        >
          <Text>{statusBadge.text}</Text>
        </View>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.stockInfo}>
          <Text className={styles.stockLabel}>库存</Text>
          <Text className={styles.stockValue}>
            {medicine.remainingQuantity}
            <Text className={styles.stockUnit}>{medicine.unit}</Text>
          </Text>
        </View>
        <View className={styles.stockBar}>
          <View
            className={classnames(styles.stockProgress, {
              [styles.stockLow]: stockPercentage < 30,
              [styles.stockMedium]: stockPercentage >= 30 && stockPercentage < 60
            })}
            style={{ width: `${stockPercentage}%` }}
          />
        </View>
      </View>

      {showWarnings && medicine.taboos.length > 0 && (
        <View className={styles.warningRow}>
          <Text className={styles.warningIcon}>⚠️</Text>
          <Text className={styles.warningText}>
            {medicine.taboos.map((t) => t.memberName).join('、')} 不适用
          </Text>
        </View>
      )}

      {showConsumption && consumptionRate > 0 && (
        <View className={styles.consumptionRow}>
          <Text className={styles.consumptionLabel}>月消耗</Text>
          <Text className={styles.consumptionValue}>
            约 {consumptionRate} {medicine.unit}/月
          </Text>
        </View>
      )}
    </View>
  )
}

export default MedicineCard
