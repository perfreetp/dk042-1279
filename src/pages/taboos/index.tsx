import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { getCategoryInfo } from '@/utils'
import { MedicineTaboo } from '@/types/medicine'

const TaboosPage: React.FC = () => {
  const {
    familyMembers,
    medicines,
    removeMedicineTaboo,
    addAllergy,
    removeAllergy,
    addMedicineTaboo
  } = useMedicineStore()
  const [selectedMemberId, setSelectedMemberId] = useState<string>(familyMembers[0]?.id || '')
  const [showAddTabooModal, setShowAddTabooModal] = useState(false)
  const [selectedMedicineId, setSelectedMedicineId] = useState('')
  const [tabooReason, setTabooReason] = useState('')

  const selectedMember = useMemo(
    () => familyMembers.find((m) => m.id === selectedMemberId),
    [familyMembers, selectedMemberId]
  )

  const tabooMedicines = useMemo(() => {
    if (!selectedMember) return []
    return medicines.filter((m) => m.taboos.some((t) => t.memberId === selectedMemberId))
  }, [medicines, selectedMemberId, selectedMember])

  const getTabooReason = (medicineId: string) => {
    const medicine = medicines.find((m) => m.id === medicineId)
    if (!medicine || !selectedMember) return ''
    const taboo = medicine.taboos.find((t) => t.memberId === selectedMemberId)
    return taboo?.reason || ''
  }

  const handleManageMember = () => {
    Taro.navigateTo({ url: '/pages/member-manage/index' })
  }

  const handleRemoveTaboo = (medicineId: string, medicineName: string) => {
    Taro.showModal({
      title: '移除禁忌',
      content: `确定要移除${medicineName}的禁忌标记吗？`,
      confirmText: '确定移除',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          removeMedicineTaboo(medicineId, selectedMemberId)
          Taro.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  }

  const handleAddAllergy = () => {
    Taro.showModal({
      title: '添加过敏记录',
      editable: true,
      placeholderText: '请输入过敏药物或食物名称',
      confirmText: '添加',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const allergy = res.content.trim()
          if (selectedMember?.allergies.includes(allergy)) {
            Taro.showToast({ title: '该过敏已存在', icon: 'none' })
            return
          }
          addAllergy(selectedMemberId, allergy)
          Taro.showToast({ title: '已添加', icon: 'success' })
        }
      }
    })
  }

  const handleRemoveAllergy = (allergy: string) => {
    Taro.showModal({
      title: '移除过敏',
      content: `确定要移除"${allergy}"的过敏记录吗？`,
      confirmText: '确定移除',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          removeAllergy(selectedMemberId, allergy)
          Taro.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  }

  const handleOpenAddTaboo = () => {
    setSelectedMedicineId('')
    setTabooReason('')
    setShowAddTabooModal(true)
  }

  const handleConfirmAddTaboo = () => {
    if (!selectedMedicineId) {
      Taro.showToast({ title: '请选择药品', icon: 'none' })
      return
    }
    if (!tabooReason.trim()) {
      Taro.showToast({ title: '请输入禁用原因', icon: 'none' })
      return
    }
    const medicine = medicines.find((m) => m.id === selectedMedicineId)
    if (!medicine) return
    const taboo: MedicineTaboo = {
      memberId: selectedMemberId,
      memberName: selectedMember?.name || '',
      reason: tabooReason.trim()
    }
    addMedicineTaboo(selectedMedicineId, taboo)
    setShowAddTabooModal(false)
    Taro.showToast({ title: '已添加禁用药品', icon: 'success' })
  }

  const availableMedicines = useMemo(() => {
    return medicines.filter(
      (m) => !m.taboos.some((t) => t.memberId === selectedMemberId)
    )
  }, [medicines, selectedMemberId])

  const medicinePickerRange = availableMedicines.map((m) => m.name)
  const selectedMedicineIndex = availableMedicines.findIndex(
    (m) => m.id === selectedMedicineId
  )

  return (
    <ScrollView scrollY className={styles.taboosPage} enhanced showScrollbar={false}>
      <View className={styles.headerSection}>
        <Text className={styles.headerTitle}>禁忌备注</Text>
        <Text className={styles.headerDesc}>记录家庭成员用药禁忌，确保用药安全</Text>

        <ScrollView scrollX className={styles.memberTabs} enhanced showScrollbar={false}>
          {familyMembers.map((member) => {
            const tabooCount = medicines.filter((m) =>
              m.taboos.some((t) => t.memberId === member.id)
            ).length
            return (
              <View
                key={member.id}
                className={classnames(styles.memberTab, {
                  [styles.active]: selectedMemberId === member.id
                })}
                onClick={() => setSelectedMemberId(member.id)}
              >
                <Text className={styles.memberAvatar}>{member.avatar}</Text>
                <Text className={styles.memberName}>{member.name}</Text>
                {tabooCount > 0 && <Text className={styles.memberBadge}>{tabooCount}</Text>}
              </View>
            )
          })}
        </ScrollView>
      </View>

      {selectedMember && (
        <>
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>🚫</Text>
                过敏药物/食物
              </Text>
              <Text className={styles.sectionMore} onClick={handleAddAllergy}>
                添加
              </Text>
            </View>
            <View className={styles.tagList}>
              {selectedMember.allergies.length > 0 ? (
                selectedMember.allergies.map((allergy, index) => (
                  <View
                    key={index}
                    className={styles.tagItem}
                    onClick={() => handleRemoveAllergy(allergy)}
                  >
                    <Text>{allergy}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: '#86909C', fontSize: '24rpx' }}>暂无过敏记录</Text>
              )}
              <View className={styles.addTagBtn} onClick={handleAddAllergy}>
                <Text>+ 添加</Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>💊</Text>
                禁用药品
              </Text>
              <Text className={styles.sectionMore} onClick={handleOpenAddTaboo}>
                添加
              </Text>
            </View>
            {tabooMedicines.length > 0 ? (
              <View className={styles.medicineList}>
                {tabooMedicines.map((medicine) => {
                  const categoryInfo = getCategoryInfo(medicine.category)
                  return (
                    <View key={medicine.id} className={styles.medicineTabooItem}>
                      <View
                        className={styles.medicineIcon}
                        style={{ backgroundColor: categoryInfo.bgColor }}
                      >
                        <Text>{categoryInfo.icon}</Text>
                      </View>
                      <View className={styles.medicineInfo}>
                        <Text className={styles.medicineName}>{medicine.name}</Text>
                        <Text className={styles.tabooReason}>
                          {getTabooReason(medicine.id)}
                        </Text>
                      </View>
                      <Text
                        className={styles.removeBtn}
                        onClick={() => handleRemoveTaboo(medicine.id, medicine.name)}
                      >
                        移除
                      </Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✅</Text>
                <Text className={styles.emptyText}>暂无禁用药品</Text>
                <Text className={styles.emptyDesc}>该成员可以使用所有常备药品</Text>
              </View>
            )}
          </View>

          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>📋</Text>
                健康信息
              </Text>
              <Text className={styles.sectionMore} onClick={handleManageMember}>
                编辑
              </Text>
            </View>
            <View className={styles.infoGrid}>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>年龄</Text>
                <Text className={styles.infoValue}>{selectedMember.age} 岁</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>角色</Text>
                <Text className={styles.infoValue}>{selectedMember.role}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>慢性病</Text>
                <View style={{ flex: 1 }}>
                  {selectedMember.chronicDiseases.length > 0 ? (
                    <View className={styles.tagList}>
                      {selectedMember.chronicDiseases.map((disease, index) => (
                        <View key={index} className={`${styles.tagItem} ${styles.warning}`}>
                          <Text>{disease}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className={styles.infoValue}>无</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </>
      )}

      <View className={styles.allTaboosSection}>
        <Text className={styles.allTaboosTitle}>全家禁忌总览</Text>
        {familyMembers.map((member) => {
          const memberTabooCount = medicines.filter((m) =>
            m.taboos.some((t) => t.memberId === member.id)
          ).length
          const memberTaboos = medicines
            .filter((m) => m.taboos.some((t) => t.memberId === member.id))
            .slice(0, 3)

          return (
            <View key={member.id} className={styles.taboosSummary}>
              <View className={styles.summaryHeader}>
                <Text className={styles.summaryAvatar}>{member.avatar}</Text>
                <Text className={styles.summaryName}>{member.name}</Text>
                <Text className={styles.summaryCount}>{memberTabooCount} 项禁忌</Text>
              </View>
              {memberTaboos.length > 0 && (
                <View className={styles.summaryDetails}>
                  {memberTaboos.map((m) => (
                    <Text key={m.id} className={styles.summaryItem}>
                      {m.name}
                    </Text>
                  ))}
                  {memberTabooCount > 3 && (
                    <Text className={styles.summaryItem}>+{memberTabooCount - 3} 更多</Text>
                  )}
                </View>
              )}
              {member.allergies.length > 0 && (
                <View style={{ marginTop: '16rpx' }}>
                  <Text style={{ fontSize: '22rpx', color: '#86909C', display: 'block', marginBottom: '8rpx' }}>
                    过敏：
                  </Text>
                  <View className={styles.summaryDetails}>
                    {member.allergies.map((a, i) => (
                      <Text key={i} className={styles.summaryItem}>
                        {a}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )
        })}
      </View>

      {showAddTabooModal && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999
          }}
          onClick={() => setShowAddTabooModal(false)}
        >
          <View
            style={{
              width: '85%',
              maxWidth: '600rpx',
              backgroundColor: '#FFFFFF',
              borderRadius: '20rpx',
              padding: '40rpx',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: '34rpx',
                fontWeight: 600,
                color: '#1D2129',
                display: 'block',
                marginBottom: '32rpx'
              }}
            >
              添加禁用药品
            </Text>

            <Text
              style={{
                fontSize: '26rpx',
                color: '#4E5969',
                display: 'block',
                marginBottom: '12rpx'
              }}
            >
              选择药品
            </Text>
            <Picker
              mode='selector'
              range={medicinePickerRange}
              value={selectedMedicineIndex >= 0 ? selectedMedicineIndex : 0}
              onChange={(e) => {
                const idx = Number(e.detail.value)
                if (availableMedicines[idx]) {
                  setSelectedMedicineId(availableMedicines[idx].id)
                }
              }}
            >
              <View
                style={{
                  height: '80rpx',
                  lineHeight: '80rpx',
                  backgroundColor: '#F2F3F5',
                  borderRadius: '12rpx',
                  padding: '0 24rpx',
                  fontSize: '28rpx',
                  color: selectedMedicineId ? '#1D2129' : '#86909C',
                  marginBottom: '28rpx'
                }}
              >
                {selectedMedicineId
                  ? availableMedicines.find((m) => m.id === selectedMedicineId)?.name
                  : '请点击选择药品'}
              </View>
            </Picker>

            <Text
              style={{
                fontSize: '26rpx',
                color: '#4E5969',
                display: 'block',
                marginBottom: '12rpx'
              }}
            >
              禁用原因
            </Text>
            <View
              style={{
                backgroundColor: '#F2F3F5',
                borderRadius: '12rpx',
                padding: '20rpx 24rpx',
                marginBottom: '40rpx'
              }}
            >
              <Textarea
                placeholder='请输入禁用原因（如：过敏反应、孕妇禁用等）'
                placeholderStyle='color: #86909C; fontSize: 26rpx'
                value={tabooReason}
                onInput={(e) => setTabooReason(e.detail.value)}
                maxlength={100}
                autoHeight
                style={{
                  width: '100%',
                  minHeight: '120rpx',
                  fontSize: '26rpx',
                  color: '#1D2129',
                  lineHeight: 1.5
                }}
              />
            </View>

            <View
              style={{
                display: 'flex',
                gap: '24rpx'
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: '80rpx',
                  lineHeight: '80rpx',
                  textAlign: 'center',
                  backgroundColor: '#F2F3F5',
                  borderRadius: '12rpx',
                  fontSize: '28rpx',
                  color: '#4E5969'
                }}
                onClick={() => setShowAddTabooModal(false)}
              >
                取消
              </View>
              <View
                style={{
                  flex: 1,
                  height: '80rpx',
                  lineHeight: '80rpx',
                  textAlign: 'center',
                  backgroundColor: '#165DFF',
                  borderRadius: '12rpx',
                  fontSize: '28rpx',
                  color: '#FFFFFF'
                }}
                onClick={handleConfirmAddTaboo}
              >
                确定添加
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default TaboosPage
