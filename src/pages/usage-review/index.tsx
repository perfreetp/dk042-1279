import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { getCategoryInfo } from '@/utils'

type PeriodType = 'week' | 'month' | 'quarter'

const PERIOD_CONFIG: Record<PeriodType, { label: string; days: number }> = {
  week: { label: '本周', days: 7 },
  month: { label: '本月', days: 30 },
  quarter: { label: '近3月', days: 90 }
}

interface MemberAggregation {
  memberId: string
  memberName: string
  memberAvatar: string
  usageCount: number
  totalQuantity: number
  medicineNames: string[]
}

interface MedicineRanking {
  medicineId: string
  medicineName: string
  medicineIcon: string
  totalQuantity: number
  monthlySpeed: number
}

const UsageReviewPage: React.FC = () => {
  const router = useRouter()
  const routeMemberId = router.params.memberId || ''
  const routeMedicineId = router.params.medicineId || ''

  const { familyMembers, medicines, getUsageTimeline } = useMedicineStore()

  const [period, setPeriod] = useState<PeriodType>('month')
  const [selectedMemberId, setSelectedMemberId] = useState<string>(routeMemberId)
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>(routeMedicineId)

  const memberOptions = useMemo(() => {
    return [
      { id: '', name: '全部成员' },
      ...familyMembers.map((m) => ({ id: m.id, name: m.name }))
    ]
  }, [familyMembers, selectedMedicineId])

  const memberPickerRange = memberOptions.map((m) => m.name)
  const selectedMemberIndex = memberOptions.findIndex((m) => m.id === selectedMemberId)

  const routeMedicine = useMemo(() => {
    return medicines.find((m) => m.id === routeMedicineId)
  }, [medicines, routeMedicineId, selectedMedicineId])

  const medicineOptions = useMemo(() => {
    if (routeMedicineId) {
      return [
        { id: '', name: '全部药品' },
        { id: routeMedicineId, name: `当前药品（${routeMedicine?.name || routeMedicineId}）` }
      ]
    }
    return [
      { id: '', name: '全部药品' },
      ...medicines.map((m) => ({ id: m.id, name: m.name }))
    ]
  }, [routeMedicineId, routeMedicine, medicines, selectedMedicineId])

  const medicinePickerRange = medicineOptions.map((m) => m.name)
  const selectedMedicineIndex = medicineOptions.findIndex((m) => m.id === selectedMedicineId)

  const days = PERIOD_CONFIG[period].days
  const timeline = useMemo(
    () => getUsageTimeline({ memberId: selectedMemberId || undefined, medicineId: selectedMedicineId || undefined, days }),
    [getUsageTimeline, selectedMemberId, selectedMedicineId, days]
  )

  const overviewStats = useMemo(() => {
    const totalUsageCount = timeline.length
    const medicineSet = new Set(timeline.map((t) => t.medicineId))
    const involvedMedicineCount = medicineSet.size

    const memberCountMap: Record<string, number> = {}
    timeline.forEach((t) => {
      memberCountMap[t.userId] = (memberCountMap[t.userId] || 0) + 1
    })
    let topMemberName = '-'
    let topCount = 0
    Object.entries(memberCountMap).forEach(([userId, count]) => {
      if (count > topCount) {
        topCount = count
        const member = familyMembers.find((m) => m.id === userId)
        topMemberName = member?.name || '未知'
      }
    })

    return {
      totalUsageCount,
      involvedMedicineCount,
      topMemberName
    }
  }, [timeline, familyMembers, selectedMedicineId])

  const memberAggregations = useMemo(() => {
    const map: Record<string, MemberAggregation> = {}

    familyMembers.forEach((m) => {
      map[m.id] = {
        memberId: m.id,
        memberName: m.name,
        memberAvatar: m.avatar,
        usageCount: 0,
        totalQuantity: 0,
        medicineNames: []
      }
    })

    timeline.forEach((t) => {
      if (!map[t.userId]) {
        map[t.userId] = {
          memberId: t.userId,
          memberName: t.userName,
          memberAvatar: t.userAvatar,
          usageCount: 0,
          totalQuantity: 0,
          medicineNames: []
        }
      }
      map[t.userId].usageCount += 1
      map[t.userId].totalQuantity += t.quantity
      if (!map[t.userId].medicineNames.includes(t.medicineName)) {
        map[t.userId].medicineNames.push(t.medicineName)
      }
    })

    return Object.values(map)
      .filter((m) => m.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
  }, [timeline, familyMembers, selectedMedicineId])

  const medicineRankings = useMemo(() => {
    const map: Record<string, MedicineRanking> = {}

    timeline.forEach((t) => {
      if (!map[t.medicineId]) {
        const catInfo = getCategoryInfo(t.category)
        map[t.medicineId] = {
          medicineId: t.medicineId,
          medicineName: t.medicineName,
          medicineIcon: catInfo.icon,
          totalQuantity: 0,
          monthlySpeed: 0
        }
      }
      map[t.medicineId].totalQuantity += t.quantity
    })

    const monthlyFactor = 30 / days
    Object.values(map).forEach((item) => {
      item.monthlySpeed = Math.round(item.totalQuantity * monthlyFactor * 10) / 10
    })

    return Object.values(map).sort((a, b) => b.totalQuantity - a.totalQuantity)
  }, [timeline, days, selectedMedicineId])

  const maxRankingQuantity = useMemo(() => {
    if (medicineRankings.length === 0) return 1
    return medicineRankings[0].totalQuantity
  }, [medicineRankings, selectedMedicineId])

  const getRankingIndexClass = (index: number) => {
    if (index === 0) return styles.rankingIndex1
    if (index === 1) return styles.rankingIndex2
    if (index === 2) return styles.rankingIndex3
    return styles.rankingIndexDefault
  }

  const handleMemberChange = (e: { detail: { value: number | number[] } }) => {
    const idx = Number(e.detail.value)
    if (memberOptions[idx]) {
      setSelectedMemberId(memberOptions[idx].id)
    }
  }

  const handleMedicineChange = (e: { detail: { value: number | number[] } }) => {
    const idx = Number(e.detail.value)
    if (medicineOptions[idx]) {
      setSelectedMedicineId(medicineOptions[idx].id)
    }
  }

  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p)
  }

  const handleMedicineClick = (medicineId: string) => {
    Taro.navigateTo({ url: `/pages/medicine-detail/index?id=${medicineId}` })
  }

  return (
    <ScrollView scrollY className={styles.usageReviewPage} enhanced showScrollbar={false}>
      <View className={styles.headerSection}>
        <Text className={styles.headerTitle}>用药复盘</Text>
        <Text className={styles.headerDesc}>
          {routeMedicineId
            ? `查看【${routeMedicine?.name || routeMedicineId}】复盘`
            : '了解全家用药趋势'}
        </Text>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.periodTabs}>
          {(Object.keys(PERIOD_CONFIG) as PeriodType[]).map((key) => (
            <View
              key={key}
              className={classnames(styles.periodTab, { [styles.active]: period === key })}
              onClick={() => handlePeriodChange(key)}
            >
              {PERIOD_CONFIG[key].label}
            </View>
          ))}
        </View>

        <View className={styles.memberPicker}>
          <Picker
            mode='selector'
            range={memberPickerRange}
            value={selectedMemberIndex >= 0 ? selectedMemberIndex : 0}
            onChange={handleMemberChange}
          >
            <View className={styles.memberPickerTrigger}>
              <Text>
                {selectedMemberIndex >= 0
                  ? memberOptions[selectedMemberIndex].name
                  : '全部成员'}
              </Text>
              <Text className={styles.memberPickerArrow}>▼</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.memberPicker}>
          <Picker
            mode='selector'
            range={medicinePickerRange}
            value={selectedMedicineIndex >= 0 ? selectedMedicineIndex : 0}
            onChange={handleMedicineChange}
          >
            <View className={styles.memberPickerTrigger}>
              <Text>
                {selectedMedicineIndex >= 0
                  ? medicineOptions[selectedMedicineIndex].name
                  : '全部药品'}
              </Text>
              <Text className={styles.memberPickerArrow}>▼</Text>
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.contentSection}>
        <View className={styles.overviewCards}>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{overviewStats.totalUsageCount}</Text>
            <Text className={styles.overviewLabel}>总用药次数</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{overviewStats.involvedMedicineCount}</Text>
            <Text className={styles.overviewLabel}>涉及药品数</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{overviewStats.topMemberName}</Text>
            <Text className={styles.overviewLabel}>用药最多</Text>
          </View>
        </View>

        {memberAggregations.length > 0 && (
          <View className={styles.memberCards}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionTitleIcon}>👨‍👩‍👧‍👦</Text>
                成员用药概览
              </Text>
            </View>
            {memberAggregations.map((member) => (
              <View key={member.memberId} className={styles.memberCard}>
                <View className={styles.memberCardHeader}>
                  <View className={styles.memberAvatar}>
                    <Text>{member.memberAvatar}</Text>
                  </View>
                  <View className={styles.memberInfo}>
                    <Text className={styles.memberName}>{member.memberName}</Text>
                    <View className={styles.memberStats}>
                      <Text className={styles.memberStatItem}>
                        用药<Text className={styles.memberStatValue}>{member.usageCount}</Text>次
                      </Text>
                      <Text className={styles.memberStatItem}>
                        总量<Text className={styles.memberStatValue}>{member.totalQuantity}</Text>
                      </Text>
                    </View>
                  </View>
                </View>
                <View className={styles.medicineTags}>
                  {member.medicineNames.map((name) => (
                    <Text key={name} className={styles.medicineTag}>
                      {name}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {medicineRankings.length > 0 && (
          <View className={styles.rankingSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionTitleIcon}>📊</Text>
                消耗最快药品
              </Text>
            </View>
            {medicineRankings.map((item, index) => {
              const percent = Math.round((item.totalQuantity / maxRankingQuantity) * 100)
              return (
                <View
                  key={item.medicineId}
                  className={styles.rankingItem}
                  onClick={() => handleMedicineClick(item.medicineId)}
                >
                  <View className={classnames(styles.rankingIndex, getRankingIndexClass(index))}>
                    <Text>{index + 1}</Text>
                  </View>
                  <View className={styles.rankingInfo}>
                    <Text className={styles.rankingName}>
                      {item.medicineIcon} {item.medicineName}
                    </Text>
                    <View className={styles.rankingBarWrapper}>
                      <View className={styles.rankingBar}>
                        <View
                          className={styles.rankingBarFill}
                          style={{ width: `${percent}%` }}
                        />
                      </View>
                    </View>
                  </View>
                  <View className={styles.rankingMeta}>
                    <Text className={styles.rankingQuantity}>{item.totalQuantity}</Text>
                    <Text className={styles.rankingSpeed}>
                      月均 {item.monthlySpeed}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View className={styles.timelineSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📋</Text>
              用药明细
            </Text>
          </View>
          {timeline.length > 0 ? (
            timeline.map((item) => (
              <View key={item.id} className={styles.timelineItem}>
                <View className={styles.timelineItemLeft}>
                  <Text className={styles.timelineAvatar}>{item.userAvatar}</Text>
                  <Text className={styles.timelineDate}>{item.date}</Text>
                </View>
                <View className={styles.timelineItemContent}>
                  <Text className={styles.timelineMedicineName}>
                    {item.medicineIcon} {item.medicineName}
                  </Text>
                  <Text className={styles.timelineDetail}>
                    {item.userName} 使用了 {item.quantity}{item.unit}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📊</Text>
              <Text className={styles.emptyText}>暂无用药记录</Text>
              <Text className={styles.emptyDesc}>
                该时段内没有用药数据，试试切换周期或成员
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default UsageReviewPage
