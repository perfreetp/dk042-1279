import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { getCategoryInfo } from '@/utils'
import { FamilyMember } from '@/types/medicine'

const TaboosPage: React.FC = () => {
  const { familyMembers, medicines } = useMedicineStore()
  const [selectedMemberId, setSelectedMemberId] = useState<string>(familyMembers[0]?.id || '')

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
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  }

  const handleAddAllergy = () => {
    Taro.showToast({ title: '功能开发中', icon: 'none' })
  }

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
                  <View key={index} className={styles.tagItem}>
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
              <Text className={styles.sectionMore} onClick={handleManageMember}>
                管理
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
    </ScrollView>
  )
}

export default TaboosPage
