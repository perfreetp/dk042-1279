import React from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'

const MemberManagePage: React.FC = () => {
  const { familyMembers, medicines } = useMedicineStore()

  const getMemberTaboos = (memberId: string) => {
    const taboos: string[] = []
    medicines.forEach((med) => {
      med.taboos.forEach((taboo) => {
        if (taboo.memberId === memberId) {
          taboos.push(med.name)
        }
      })
    })
    return taboos
  }

  const handleMemberClick = (memberId: string) => {
    Taro.showModal({
      title: '成员详情',
      content: '成员详情功能开发中...',
      showCancel: false
    })
  }

  const handleAddMember = () => {
    Taro.showModal({
      title: '添加成员',
      content: '添加成员功能开发中...',
      showCancel: false
    })
  }

  const handleShareFamily = () => {
    Taro.showModal({
      title: '分享家庭药箱',
      content: '邀请家人加入，共同管理家庭药箱',
      confirmText: '去分享',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '分享功能演示', icon: 'none' })
        }
      }
    })
  }

  return (
    <ScrollView scrollY className={styles.memberPage} enhanced showScrollbar={false}>
      <View className={styles.familyHeader}>
        <Text className={styles.familyTitle}>我的家庭</Text>
        <Text className={styles.familyDesc}>共同管理家庭常备药箱</Text>
        <Text className={styles.memberCount}>
          共 {familyMembers.length} 位家庭成员
        </Text>
      </View>

      <Text className={styles.sectionTitle}>家庭成员</Text>
      <View className={styles.memberList}>
        {familyMembers.map((member) => {
          const taboos = getMemberTaboos(member.id)
          return (
            <Button
              key={member.id}
              className={styles.memberItem}
              onClick={() => handleMemberClick(member.id)}
            >
              <View className={styles.memberAvatar}>
                <Text>{member.avatar}</Text>
              </View>
              <View className={styles.memberInfo}>
                <Text className={styles.memberName}>
                  {member.name}
                  {member.isAdmin && (
                    <Text
                      style={{
                        fontSize: '20rpx',
                        color: '#2DB8A7',
                        marginLeft: '8rpx',
                        background: '#E6F7F4',
                        padding: '2rpx 8rpx',
                        borderRadius: '4rpx'
                      }}
                    >
                      管理员
                    </Text>
                  )}
                </Text>
                <Text className={styles.memberRole}>
                  {member.relationship} · {member.age}岁
                </Text>
                {taboos.length > 0 && (
                  <View className={styles.memberTags}>
                    {taboos.slice(0, 3).map((name, idx) => (
                      <Text key={idx} className={styles.memberTag}>
                        {name}禁用
                      </Text>
                    ))}
                    {taboos.length > 3 && (
                      <Text className={styles.memberTag}>
                        +{taboos.length - 3}种
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <Text className={styles.memberArrow}>›</Text>
            </Button>
          )
        })}
      </View>

      <Button className={styles.addMemberBtn} onClick={handleAddMember}>
        <Text className={styles.addIcon}>+</Text>
        添加家庭成员
      </Button>

      <View style={{ height: '40rpx' }} />

      <Text className={styles.sectionTitle}>家庭设置</Text>
      <View className={styles.memberList}>
        <Button
          className={styles.memberItem}
          onClick={() => Taro.showToast({ title: '设置功能演示', icon: 'none' })}
        >
          <View
            className={styles.memberAvatar}
            style={{ background: '#FFF7E8' }}
          >
            <Text>🔔</Text>
          </View>
          <View className={styles.memberInfo}>
            <Text className={styles.memberName}>提醒设置</Text>
            <Text className={styles.memberRole}>库存提醒、临期提醒</Text>
          </View>
          <Text className={styles.memberArrow}>›</Text>
        </Button>

        <Button
          className={styles.memberItem}
          onClick={() => Taro.showToast({ title: '数据备份演示', icon: 'none' })}
        >
          <View
            className={styles.memberAvatar}
            style={{ background: '#E6F7FF' }}
          >
            <Text>☁️</Text>
          </View>
          <View className={styles.memberInfo}>
            <Text className={styles.memberName}>数据备份</Text>
            <Text className={styles.memberRole}>云端同步药箱数据</Text>
          </View>
          <Text className={styles.memberArrow}>›</Text>
        </Button>
      </View>

      <View style={{ height: '120rpx' }} />

      <View className={styles.bottomBar}>
        <Button className={styles.shareBtn} onClick={handleShareFamily}>
          分享家庭药箱
        </Button>
      </View>
    </ScrollView>
  )
}

export default MemberManagePage
