import React, { useState, useMemo } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { UsageTimelineItem } from '@/types/medicine'

interface UsageTimelineProps {
  medicineId?: string
  memberId?: string
  days?: number
  title?: string
  showFilter?: boolean
}

const UsageTimeline: React.FC<UsageTimelineProps> = ({
  medicineId,
  memberId: propMemberId,
  days: propDays = 30,
  title = '用药记录',
  showFilter = true
}) => {
  const { familyMembers, getUsageTimeline, medicines } = useMedicineStore()

  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(propMemberId)
  const [selectedDays, setSelectedDays] = useState<number>(propDays)

  const dayOptions = [
    { value: 7, label: '最近7天' },
    { value: 15, label: '最近15天' },
    { value: 30, label: '最近30天' }
  ]

  const memberOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: 'all', label: '全部成员' }
    ]
    familyMembers.forEach((member) => {
      options.push({
        value: member.id,
        label: `${member.avatar} ${member.name}`
      })
    })
    return options
  }, [familyMembers])

  const timelineData = useMemo(() => {
    const filterMemberId = selectedMemberId === 'all' ? undefined : selectedMemberId
    return getUsageTimeline({
      memberId: filterMemberId,
      medicineId,
      days: selectedDays
    })
  }, [selectedMemberId, selectedDays, medicineId, getUsageTimeline, medicines])

  const groupedData = useMemo(() => {
    const groups: Record<string, UsageTimelineItem[]> = {}
    timelineData.forEach((item) => {
      if (!groups[item.date]) {
        groups[item.date] = []
      }
      groups[item.date].push(item)
    })
    return Object.entries(groups).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime()
    })
  }, [timelineData, medicines])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const dateOnly = dateStr
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (dateOnly === todayStr) {
      return '今天'
    } else if (dateOnly === yesterdayStr) {
      return '昨天'
    } else {
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${month}月${day}日 ${weekDays[date.getDay()]}`
    }
  }

  const handleMemberChange = (e: { detail: { value: number } }) => {
    const index = e.detail.value
    const value = memberOptions[index].value
    setSelectedMemberId(value === 'all' ? undefined : value)
  }

  const handleDaysChange = (e: { detail: { value: number } }) => {
    const index = e.detail.value
    setSelectedDays(dayOptions[index].value)
  }

  const getSelectedMemberIndex = () => {
    if (selectedMemberId === undefined || selectedMemberId === 'all') {
      return 0
    }
    const index = memberOptions.findIndex((m) => m.value === selectedMemberId)
    return index >= 0 ? index : 0
  }

  const getSelectedDaysIndex = () => {
    const index = dayOptions.findIndex((d) => d.value === selectedDays)
    return index >= 0 ? index : 2
  }

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      cold: 'linear-gradient(135deg, #4C9AFF 0%, #7BB6FF 100%)',
      stomach: 'linear-gradient(135deg, #722ED1 0%, #9F72E8 100%)',
      injury: 'linear-gradient(135deg, #FF7D00 0%, #FFA85D 100%)',
      child: 'linear-gradient(135deg, #F53F3F 0%, #FF7875 100%)',
      other: 'linear-gradient(135deg, #86909C 0%, #ADB4BD 100%)'
    }
    return gradients[category] || gradients.other
  }

  return (
    <View className={styles.timelineContainer}>
      <View className={styles.timelineHeader}>
        <Text className={styles.timelineTitle}>{title}</Text>
        {timelineData.length > 0 && (
          <Text className={styles.timelineCount}>共 {timelineData.length} 条</Text>
        )}
      </View>

      {showFilter && (
        <View className={styles.filterBar}>
          <View className={styles.filterItem}>
            <Picker
              mode='selector'
              range={memberOptions.map((m) => m.label)}
              value={getSelectedMemberIndex()}
              onChange={handleMemberChange}
            >
              <View className={styles.pickerButton}>
                <Text className={styles.pickerText}>
                  {memberOptions[getSelectedMemberIndex()].label}
                </Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>
          <View className={styles.filterItem}>
            <Picker
              mode='selector'
              range={dayOptions.map((d) => d.label)}
              value={getSelectedDaysIndex()}
              onChange={handleDaysChange}
            >
              <View className={styles.pickerButton}>
                <Text className={styles.pickerText}>
                  {dayOptions[getSelectedDaysIndex()].label}
                </Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>
        </View>
      )}

      {groupedData.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无用药记录</Text>
        </View>
      ) : (
        <View className={styles.timelineList}>
          {groupedData.map(([date, items]) => (
            <View key={date} className={styles.dateGroup}>
              <View className={styles.dateHeader}>
                <View className={styles.dateDot} />
                <Text className={styles.dateText}>{formatDate(date)}</Text>
                <View className={styles.dateLine} />
              </View>
              <View className={styles.dateItems}>
                {items.map((item) => (
                  <View
                    key={item.id}
                    className={styles.timelineCard}
                    onClick={() => {
                      Taro.navigateTo({
                        url: `/pages/medicine-detail/index?id=${item.medicineId}`
                      })
                    }}
                  >
                    <View className={styles.cardLeft}>
                      <View className={styles.userAvatar}>{item.userAvatar}</View>
                    </View>
                    <View className={styles.cardContent}>
                      <View className={styles.cardHeader}>
                        <View
                          className={styles.medicineIcon}
                          style={{ background: getCategoryGradient(item.category) }}
                        >
                          <Text className={styles.medicineIconText}>{item.medicineIcon}</Text>
                        </View>
                        <View className={styles.medicineInfo}>
                          <Text className={styles.medicineName}>{item.medicineName}</Text>
                          <Text className={styles.userName}>{item.userName}</Text>
                        </View>
                      </View>
                      <View className={styles.cardFooter}>
                        <View className={styles.quantityBadge}>
                          <Text className={styles.quantityText}>
                            {item.quantity} {item.unit}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default UsageTimeline
