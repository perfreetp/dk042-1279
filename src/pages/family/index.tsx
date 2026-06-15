import React from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'

const FamilyPage: React.FC = () => {
  const {
    familyMembers,
    medicines,
    inventoryRecords,
    activities,
    currentUserId,
    confirmActivity,
    getPendingActivitiesCount
  } = useMedicineStore()

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

  const handleConfirmActivity = (activityId: string, activityTitle: string) => {
    Taro.showModal({
      title: '确认动态',
      content: `确认「${activityTitle}」这条动态吗？`,
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          confirmActivity(activityId, currentUserId)
          Taro.showToast({ title: '已确认', icon: 'success' })
        }
      }
    })
  }

  const sortedActivities = [...activities].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const stats = [
    { icon: '💊', value: medicines.length, label: '药品总数' },
    { icon: '👨‍👩‍👧‍👦', value: familyMembers.length, label: '家庭成员' },
    { icon: '✅', value: inventoryRecords.length, label: '盘点次数' },
    { icon: '⏳', value: getPendingActivitiesCount(), label: '待确认数' }
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
          {sortedActivities.map((activity) => (
            <View key={activity.id} className={styles.activityItem}>
              <View className={styles.activityAvatar}>
                <Text>{activity.operatorAvatar}</Text>
              </View>
              <View className={styles.activityContent}>
                <Text className={styles.activityText}>
                  <Text style={{ fontWeight: 500 }}>{activity.operatorName}</Text> {activity.title}
                </Text>
                <Text className={styles.activityText} style={{ fontSize: '22rpx', color: '#86909C' }}>
                  {activity.description}
                </Text>
                <Text className={styles.activityTime}>{activity.date}</Text>
              </View>
              {activity.status === 'pending' ? (
                <View
                  className={styles.activityAction}
                  style={{
                    background: '#FFF7E6',
                    color: '#FA8C16',
                    border: '1rpx solid #FFD591',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleConfirmActivity(activity.id, activity.title)}
                >
                  待确认
                </View>
              ) : (
                <Text
                  className={styles.activityAction}
                  style={{
                    background: '#F6FFED',
                    color: '#52C41A',
                    border: '1rpx solid #B7EB8F'
                  }}
                >
                  已确认
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: '40rpx' }} />
    </ScrollView>
  )
}

export default FamilyPage
