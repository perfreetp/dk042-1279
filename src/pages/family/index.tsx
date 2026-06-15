import React from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { inventoryRecords } from '@/data/mockData'

const FamilyPage: React.FC = () => {
  const { familyMembers, medicines, inventoryRecords: storeInventoryRecords } = useMedicineStore()

  const handleInvite = () => {
    Taro.showModal({
      title: '邀请家人',
      content: '分享家庭药箱邀请码给家人，让他们一起管理家庭药品。',
      confirmText: '去分享',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '分享功能开发中', icon: 'none' })
        }
      }
    })
  }

  const handleMemberClick = (memberId: string) => {
    Taro.navigateTo({ url: `/pages/member-manage/index?id=${memberId}` })
  }

  const handleAddMember = () => {
    Taro.navigateTo({ url: '/pages/member-manage/index' })
  }

  const handleManageMembers = () => {
    Taro.navigateTo({ url: '/pages/member-manage/index' })
  }

  const recentActivities = [
    {
      id: 1,
      avatar: '👨',
      name: '爸爸',
      action: '完成了库存盘点',
      detail: '检查了 10 种药品，调整了 2 种数量',
      time: '今天 10:30',
      status: '已确认'
    },
    {
      id: 2,
      avatar: '👩',
      name: '妈妈',
      action: '添加了新药品',
      detail: '维生素C泡腾片',
      time: '昨天 15:20',
      status: '待确认'
    },
    {
      id: 3,
      avatar: '👨',
      name: '爸爸',
      action: '标记了禁忌药品',
      detail: '阿莫西林 - 青霉素过敏',
      time: '3天前',
      status: '已确认'
    },
    {
      id: 4,
      avatar: '👩',
      name: '妈妈',
      action: '完成了采购',
      detail: '感冒灵颗粒、创可贴',
      time: '5天前',
      status: '已确认'
    }
  ]

  const stats = [
    { icon: '💊', value: medicines.length, label: '药品总数' },
    { icon: '👨‍👩‍👧‍👦', value: familyMembers.length, label: '家庭成员' },
    { icon: '✅', value: storeInventoryRecords.length, label: '盘点次数' },
    { icon: '🔄', value: '实时', label: '同步状态' }
  ]

  return (
    <ScrollView scrollY className={styles.familyPage} enhanced showScrollbar={false}>
      <View className={styles.headerSection}>
        <Text className={styles.headerTitle}>家庭共享</Text>
        <Text className={styles.headerDesc}>全家一起管理，用药更安心</Text>

        <View className={styles.familyInfo}>
          <View className={styles.familyAvatar}>🏠</View>
          <View className={styles.familyName}>
            <Text className={styles.familyTitle}>幸福家庭药箱</Text>
            <Text className={styles.familyCode}>家庭码：FAM-20260615</Text>
          </View>
          <Button className={styles.inviteBtn} onClick={handleInvite}>
            邀请
          </Button>
        </View>
      </View>

      <View className={styles.membersSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>家庭成员</Text>
          <Text className={styles.sectionMore} onClick={handleManageMembers}>
            管理
          </Text>
        </View>
        <View className={styles.membersGrid}>
          {familyMembers.map((member) => (
            <View
              key={member.id}
              className={styles.memberItem}
              onClick={() => handleMemberClick(member.id)}
            >
              <View className={styles.memberAvatar}>
                <Text>{member.avatar}</Text>
                {member.role === '管理员' && (
                  <Text className={styles.memberRole}>管</Text>
                )}
              </View>
              <Text className={styles.memberName}>{member.name}</Text>
            </View>
          ))}
          <View className={styles.addMember} onClick={handleAddMember}>
            <View className={styles.addAvatar}>
              <Text>+</Text>
            </View>
            <Text className={styles.addText}>添加</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} className={styles.statCard}>
              <Text className={styles.statIcon}>{stat.icon}</Text>
              <Text className={styles.statValue}>{stat.value}</Text>
              <Text className={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.shareCard}>
        <Text className={styles.shareIcon}>📱</Text>
        <Text className={styles.shareTitle}>同步药箱数据</Text>
        <Text className={styles.shareDesc}>
          所有家庭成员实时同步药箱信息，药品消耗、采购进度一目了然
        </Text>
        <Button className={styles.shareBtn} onClick={handleInvite}>
          分享药箱
        </Button>
        <View className={styles.syncStatus}>
          <View className={styles.syncDot} />
          <Text className={styles.syncText}>数据已同步</Text>
        </View>
      </View>

      <View className={styles.activitySection}>
        <Text className={styles.activityTitle}>最近动态</Text>
        <View className={styles.activityList}>
          {recentActivities.map((activity) => (
            <View key={activity.id} className={styles.activityItem}>
              <View className={styles.activityAvatar}>
                <Text>{activity.avatar}</Text>
              </View>
              <View className={styles.activityContent}>
                <Text className={styles.activityText}>
                  <Text style={{ fontWeight: 500 }}>{activity.name}</Text> {activity.action}
                </Text>
                <Text className={styles.activityText} style={{ fontSize: '22rpx', color: '#86909C' }}>
                  {activity.detail}
                </Text>
                <Text className={styles.activityTime}>{activity.time}</Text>
              </View>
              <Text className={styles.activityAction}>{activity.status}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: '40rpx' }} />
    </ScrollView>
  )
}

export default FamilyPage
