import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { getCategoryInfo, daysUntilExpiry, calculateConsumptionRate } from '@/utils'

const MedicineDetailPage: React.FC = () => {
  const router = useRouter()
  const medicineId = router.params.id || ''
  const {
    getMedicineById,
    familyMembers,
    addPurchaseItem,
    useMedicine,
    removeMedicineTaboo,
    currentUserId
  } = useMedicineStore()

  // 手动刷新：访问时重新拉取
  const [, setTick] = useState(0)
  useDidShow(() => setTick((t) => t + 1))

  const medicine = useMemo(() => getMedicineById(medicineId), [
    medicineId,
    getMedicineById
  ])

  // ============ 使用药品 弹窗 ============
  const [showUseModal, setShowUseModal] = useState(false)
  const [useUserId, setUseUserId] = useState(currentUserId)
  const [useQty, setUseQty] = useState(1)

  if (!medicine) {
    return (
      <View className={styles.detailPage}>
        <View style={{ textAlign: 'center', padding: '200rpx 0' }}>
          <Text style={{ fontSize: '80rpx' }}>💊</Text>
          <Text style={{ display: 'block', marginTop: '20rpx', color: '#86909C' }}>
            药品不存在
          </Text>
        </View>
      </View>
    )
  }

  const categoryInfo = getCategoryInfo(medicine.category)
  const daysLeft = daysUntilExpiry(medicine.expiryDate)
  const consumptionRate = calculateConsumptionRate(medicine)
  const stockPercentage = Math.min(
    100,
    Math.round((medicine.remainingQuantity / medicine.totalQuantity) * 100)
  )

  const getStatusTags = () => {
    const tags: { text: string; type: string }[] = []

    if (daysLeft <= 0) {
      tags.push({ text: '已过期', type: 'danger' })
    } else if (daysLeft <= 30) {
      tags.push({ text: `临期${daysLeft}天`, type: 'warning' })
    }

    if (medicine.openStatus === 'opened') {
      tags.push({ text: '已开封', type: 'info' })
    } else {
      tags.push({ text: '未开封', type: 'success' })
    }

    if (medicine.remainingQuantity <= medicine.minStock) {
      tags.push({ text: '库存不足', type: 'warning' })
    }

    return tags
  }

  const statusTags = getStatusTags()

  const getTagClass = (type: string) => {
    switch (type) {
      case 'danger':
        return styles.tagDanger
      case 'warning':
        return styles.tagWarning
      case 'success':
        return styles.tagSuccess
      default:
        return styles.tagInfo
    }
  }

  const handleUseMedicine = () => {
    // 先检查是否是禁忌人群
    const isTaboo = medicine.taboos.find((t) => t.memberId === useUserId)
    if (isTaboo) {
      Taro.showModal({
        title: '⚠️ 用药禁忌',
        content: `${isTaboo.memberName} 禁用本药品：${isTaboo.reason}，是否仍要记录？`,
        cancelText: '取消',
        confirmText: '仍记录',
        success: (res) => {
          if (res.confirm) {
            confirmUse()
          }
        }
      })
    } else {
      confirmUse()
    }
  }

  const confirmUse = () => {
    const result = useMedicine(medicine.id, useUserId, useQty)
    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' })
      setShowUseModal(false)
      setUseQty(1)
    } else {
      Taro.showToast({ title: result.message, icon: 'none' })
    }
  }

  const openUseModal = () => {
    if (medicine.remainingQuantity <= 0) {
      Taro.showToast({ title: '库存为 0，请先采购', icon: 'none' })
      return
    }
    if (daysLeft <= 0) {
      Taro.showModal({
        title: '药品已过期',
        content: '该药品已过有效期，建议不要使用并及时处理。是否仍要记录使用？',
        cancelText: '取消',
        confirmText: '仍使用',
        success: (res) => {
          if (res.confirm) {
            setUseUserId(currentUserId)
            setUseQty(Math.min(1, medicine.remainingQuantity))
            setShowUseModal(true)
          }
        }
      })
      return
    }
    setUseUserId(currentUserId)
    setUseQty(Math.min(1, medicine.remainingQuantity))
    setShowUseModal(true)
  }

  const handleAddToPurchase = () => {
    const existing = useMedicineStore.getState().purchaseItems.find(
      (p) => p.medicineId === medicine.id && !p.isPurchased
    )
    if (existing) {
      Taro.showToast({ title: '采购清单中已有', icon: 'none' })
      return
    }
    addPurchaseItem({
      medicineId: medicine.id,
      medicineName: medicine.name,
      specification: medicine.specification,
      category: medicine.category,
      quantity: 1,
      unit: '盒',
      reason: '从药品详情页添加',
      isPurchased: false
    })
    Taro.showToast({ title: '已加入采购清单', icon: 'success' })
  }

  const handleEdit = () => {
    Taro.navigateTo({
      url: `/pages/add-medicine/index?id=${medicine.id}`
    })
  }

  const handleRemoveTaboo = (memberId: string, memberName: string) => {
    Taro.showModal({
      title: '移除禁忌',
      content: `确认移除 ${memberName} 对 ${medicine.name} 的禁用标记吗？`,
      success: (res) => {
        if (res.confirm) {
          removeMedicineTaboo(medicine.id, memberId)
          Taro.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  }

  const applicableMembers = familyMembers.filter((m) =>
    medicine.applicablePeople.includes(m.id)
  )

  // 默认一次用量（从规格中推断一些常用剂量，不行就默认1）
  const suggestedDose = 1

  return (
    <>
      <ScrollView scrollY className={styles.detailPage} enhanced showScrollbar={false}>
        <View className={styles.headerCard}>
          <View className={styles.medicineHeader}>
            <View
              className={styles.medicineIcon}
              style={{ backgroundColor: categoryInfo.bgColor }}
            >
              <Text>{categoryInfo.icon}</Text>
            </View>
            <View className={styles.medicineInfo}>
              <Text className={styles.medicineName}>{medicine.name}</Text>
              <Text className={styles.medicineSpec}>{medicine.specification}</Text>
              <Text className={styles.medicineManufacturer}>{medicine.manufacturer}</Text>
            </View>
          </View>
          <View className={styles.statusTags}>
            {statusTags.map((tag, index) => (
              <View
                key={index}
                className={classnames(styles.statusTag, getTagClass(tag.type))}
              >
                <Text>{tag.text}</Text>
              </View>
            ))}
            <View
              className={classnames(styles.statusTag, styles.tagInfo)}
              style={{ backgroundColor: categoryInfo.bgColor, color: categoryInfo.color }}
            >
              <Text>{categoryInfo.name}</Text>
            </View>
          </View>
        </View>

        <View className={styles.stockSection}>
          <View className={styles.stockHeader}>
            <Text className={styles.stockTitle}>库存情况</Text>
            <Text className={styles.stockValue}>
              {medicine.remainingQuantity}
              <Text className={styles.stockUnit}> {medicine.unit}</Text>
            </Text>
          </View>
          <View className={styles.stockBar}>
            <View
              className={classnames(styles.stockProgress, {
                [styles.stockLow]: stockPercentage < 30
              })}
              style={{ width: `${stockPercentage}%` }}
            />
          </View>
          <View className={styles.stockInfo}>
            <Text>总容量：{medicine.totalQuantity}{medicine.unit}</Text>
            <Text>
              {consumptionRate > 0
                ? `月消耗约 ${consumptionRate}${medicine.unit}，可用约 ${Math.round(
                    medicine.remainingQuantity / consumptionRate
                  )} 天`
                : '暂无消耗数据'}
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>📅</Text>
            <Text className={styles.sectionTitle}>有效期信息</Text>
          </View>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>生产日期</Text>
              <Text className={styles.infoValue}>
                {medicine.productionDate || '未记录'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>有效期至</Text>
              <Text
                className={styles.infoValue}
                style={{ color: daysLeft <= 30 ? '#F53F3F' : undefined }}
              >
                {medicine.expiryDate}
                {daysLeft > 0 && `（还有 ${daysLeft} 天）`}
                {daysLeft <= 0 && '（已过期）'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>开封日期</Text>
              <Text className={styles.infoValue}>
                {medicine.openDate || '未开封'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>储存条件</Text>
              <Text className={styles.infoValue}>{medicine.storage}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>💊</Text>
            <Text className={styles.sectionTitle}>用药说明</Text>
          </View>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>用法用量</Text>
              <Text className={styles.infoValue}>{medicine.dosage}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>适应症</Text>
              <Text className={styles.infoValue}>{medicine.indications}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>禁忌症</Text>
              <Text className={styles.infoValue} style={{ color: '#F53F3F' }}>
                {medicine.contraindications}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>不良反应</Text>
              <Text className={styles.infoValue}>{medicine.sideEffects}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>👨‍👩‍👧‍👦</Text>
            <Text className={styles.sectionTitle}>适用人群</Text>
          </View>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '16rpx' }}>
            {applicableMembers.length > 0 ? (
              applicableMembers.map((member) => (
                <View
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8rpx',
                    padding: '8rpx 16rpx',
                    background: '#E6F7F4',
                    borderRadius: '999rpx'
                  }}
                >
                  <Text style={{ fontSize: '24rpx' }}>{member.avatar}</Text>
                  <Text style={{ fontSize: '24rpx', color: '#2DB8A7' }}>{member.name}</Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: '24rpx', color: '#86909C' }}>暂无适用人群记录</Text>
            )}
          </View>
        </View>

        {medicine.taboos.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionIcon}>🚫</Text>
              <Text className={styles.sectionTitle}>禁忌人群</Text>
              <Text className={styles.sectionMore}>(可移除)</Text>
            </View>
            <View className={styles.tabooList}>
              {medicine.taboos.map((taboo, index) => (
                <View key={index} className={styles.tabooItem}>
                  <Text className={styles.tabooAvatar}>
                    {familyMembers.find((m) => m.id === taboo.memberId)?.avatar || '👤'}
                  </Text>
                  <View className={styles.tabooInfo}>
                    <Text className={styles.tabooName}>{taboo.memberName}</Text>
                    <Text className={styles.tabooReason}>{taboo.reason}</Text>
                  </View>
                  <Button
                    className={styles.tabooRemove}
                    onClick={() => handleRemoveTaboo(taboo.memberId, taboo.memberName)}
                  >
                    移除
                  </Button>
                </View>
              ))}
            </View>
          </View>
        )}

        {medicine.usageRecords.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionIcon}>📊</Text>
              <Text className={styles.sectionTitle}>最近使用记录</Text>
              <Text className={styles.sectionMore}>
                共 {medicine.usageRecords.length} 条
              </Text>
            </View>
            <View className={styles.usageRecords}>
              {medicine.usageRecords.slice(0, 10).map((record, index) => (
                <View key={index} className={styles.recordItem}>
                  <View className={styles.recordInfo}>
                    <Text className={styles.recordAvatar}>
                      {familyMembers.find((m) => m.id === record.userId)?.avatar || '👤'}
                    </Text>
                    <Text className={styles.recordUser}>{record.userName}</Text>
                    <Text className={styles.recordDate}>{record.date}</Text>
                  </View>
                  <Text className={styles.recordQty}>
                    -{record.quantity} {medicine.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {medicine.notes && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionIcon}>📝</Text>
              <Text className={styles.sectionTitle}>备注</Text>
            </View>
            <Text style={{ fontSize: '28rpx', color: '#4E5969', lineHeight: 1.6 }}>
              {medicine.notes}
            </Text>
          </View>
        )}

        <View style={{ height: '40rpx' }} />

        <View className={styles.bottomBar}>
          <Button className={`${styles.actionBtn} ${styles.btnSecondary}`} onClick={handleEdit}>
            编辑
          </Button>
          <Button className={`${styles.actionBtn} ${styles.btnWarning}`} onClick={openUseModal}>
            记录使用
          </Button>
          <Button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleAddToPurchase}>
            加入采购
          </Button>
        </View>
      </ScrollView>

      {/* ============ 使用药品 弹窗 ============ */}
      {showUseModal && (
        <View
          className={styles.modalMask}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUseModal(false)
          }}
        >
          <View className={styles.modalContent}>
            <Text className={styles.modalTitle}>
              记录使用 · {medicine.name}
            </Text>

            <Text className={styles.modalLabel}>选择使用人</Text>
            <View className={styles.userPickerGrid}>
              {familyMembers.map((m) => {
                const isTaboo = medicine.taboos.find((t) => t.memberId === m.id)
                return (
                  <Button
                    key={m.id}
                    className={classnames(styles.userPickerItem, {
                      [styles.userPickerItemActive]: useUserId === m.id
                    })}
                    onClick={() => setUseUserId(m.id)}
                  >
                    <Text style={{ fontSize: '24rpx' }}>{m.avatar}</Text>
                    <Text>{m.name}</Text>
                    {isTaboo && <Text style={{ color: '#F53F3F' }}>⚠️</Text>}
                  </Button>
                )
              })}
            </View>

            <View style={{ marginTop: '32rpx' }}>
              <View className={styles.qtyRow}>
                <Text className={styles.modalLabel} style={{ marginTop: 0 }}>
                  使用数量
                </Text>
                <View style={{ display: 'flex', alignItems: 'center' }}>
                  <View className={styles.qtyStepper}>
                    <Button
                      className={styles.qtyBtn}
                      onClick={() => setUseQty((q) => Math.max(1, q - 1))}
                    >
                      -
                    </Button>
                    <Text className={styles.qtyValue}>{useQty}</Text>
                    <Button
                      className={styles.qtyBtn}
                      onClick={() =>
                        setUseQty((q) => Math.min(medicine.remainingQuantity, q + 1))
                      }
                    >
                      +
                    </Button>
                  </View>
                  <Text className={styles.qtyUnit}>{medicine.unit}</Text>
                </View>
              </View>

              <View className={styles.quickQtyBtns}>
                {[1, 2, 3].map((n) => (
                  <Button
                    key={n}
                    className={styles.quickQtyBtn}
                    onClick={() =>
                      setUseQty(Math.min(n, medicine.remainingQuantity))
                    }
                  >
                    {n}{medicine.unit}
                  </Button>
                ))}
                <Button
                  className={styles.quickQtyBtn}
                  onClick={() => setUseQty(suggestedDose)}
                >
                  推荐
                </Button>
              </View>

              <Text className={styles.qtyHint}>
                当前库存 {medicine.remainingQuantity}{medicine.unit}
                {medicine.dosage ? ` · 建议：${medicine.dosage}` : ''}
              </Text>
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.modalCancel} onClick={() => setShowUseModal(false)}>
                取消
              </Button>
              <Button
                className={styles.modalConfirm}
                disabled={useQty <= 0 || !useUserId}
                onClick={handleUseMedicine}
              >
                确认记录
              </Button>
            </View>
          </View>
        </View>
      )}
    </>
  )
}

export default MedicineDetailPage
