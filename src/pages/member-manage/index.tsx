import React, { useState } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { FamilyMember } from '@/types/medicine'

const MemberManagePage: React.FC = () => {
  const {
    familyMembers,
    medicines,
    addFamilyMember,
    deleteFamilyMember,
    addAllergy,
    removeAllergy,
    addChronicDisease,
    removeChronicDisease
  } = useMedicineStore()

  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  const refreshSelectedMember = () => {
    if (selectedMember) {
      const fresh = familyMembers.find((m) => m.id === selectedMember.id)
      if (fresh) setSelectedMember(fresh)
    }
  }

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
    const member = familyMembers.find((m) => m.id === memberId)
    if (!member) return
    setSelectedMember(member)
    setDetailVisible(true)
  }

  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedMember(null)
  }

  const handleAddMember = () => {
    handleShareFamily()
  }

  const handleRemoveAllergy = (allergy: string) => {
    if (!selectedMember) return
    Taro.showModal({
      title: '移除过敏',
      content: `确定要移除「${allergy}」过敏记录吗？`,
      confirmText: '移除',
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          removeAllergy(selectedMember.id, allergy)
          Taro.showToast({ title: '已移除', icon: 'success' })
          setTimeout(refreshSelectedMember, 50)
        }
      }
    })
  }

  const handleAddAllergy = () => {
    if (!selectedMember) return
    Taro.showModal({
      title: '添加过敏',
      content: '请输入过敏原名称（如：青霉素、花生等）',
      editable: true,
      placeholderText: '输入过敏原',
      confirmText: '添加',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const allergy = res.content.trim()
          if (selectedMember.allergies.includes(allergy)) {
            Taro.showToast({ title: '该过敏已存在', icon: 'none' })
            return
          }
          addAllergy(selectedMember.id, allergy)
          Taro.showToast({ title: '已添加', icon: 'success' })
          setTimeout(refreshSelectedMember, 50)
        }
      }
    })
  }

  const handleRemoveChronicDisease = (disease: string) => {
    if (!selectedMember) return
    Taro.showModal({
      title: '移除慢性病',
      content: `确定要移除「${disease}」记录吗？`,
      confirmText: '移除',
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          removeChronicDisease(selectedMember.id, disease)
          Taro.showToast({ title: '已移除', icon: 'success' })
          setTimeout(refreshSelectedMember, 50)
        }
      }
    })
  }

  const handleAddChronicDisease = () => {
    if (!selectedMember) return
    Taro.showModal({
      title: '添加慢性病',
      content: '请输入慢性病名称（如：高血压、糖尿病等）',
      editable: true,
      placeholderText: '输入慢性病名称',
      confirmText: '添加',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const disease = res.content.trim()
          if (selectedMember.chronicDiseases.includes(disease)) {
            Taro.showToast({ title: '该慢性病已存在', icon: 'none' })
            return
          }
          addChronicDisease(selectedMember.id, disease)
          Taro.showToast({ title: '已添加', icon: 'success' })
          setTimeout(refreshSelectedMember, 50)
        }
      }
    })
  }

  const handleDeleteMember = () => {
    if (!selectedMember) return
    if (selectedMember.isAdmin) {
      Taro.showToast({ title: '管理员不可删除', icon: 'none' })
      return
    }
    Taro.showModal({
      title: '删除成员',
      content: `确定要删除成员「${selectedMember.name}」吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          deleteFamilyMember(selectedMember.id)
          Taro.showToast({ title: '已删除', icon: 'success' })
          handleCloseDetail()
        }
      }
    })
  }

  const handleShareFamily = () => {
    const step1Name = () => {
      Taro.showModal({
        title: '第 1 步：输入姓名',
        content: '请输入成员姓名',
        editable: true,
        placeholderText: '如：张三',
        confirmText: '下一步',
        success: (res1) => {
          if (!res1.confirm) return
          const name = (res1.content || '').trim()
          if (!name) {
            Taro.showToast({ title: '姓名不能为空', icon: 'none' })
            return
          }
          step2Relationship(name)
        }
      })
    }

    const step2Relationship = (name: string) => {
      Taro.showModal({
        title: '第 2 步：选择关系',
        content: '请输入对应编号：1-父亲 2-母亲 3-儿子 4-女儿 5-其他',
        editable: true,
        placeholderText: '输入 1-5',
        confirmText: '下一步',
        success: (res2) => {
          if (!res2.confirm) return
          const input = (res2.content || '').trim()
          let relationship = ''
          switch (input) {
            case '1':
              relationship = '父亲'
              break
            case '2':
              relationship = '母亲'
              break
            case '3':
              relationship = '儿子'
              break
            case '4':
              relationship = '女儿'
              break
            case '5':
              relationship = '其他'
              break
            default:
              Taro.showToast({ title: '请输入 1-5 的编号', icon: 'none' })
              return
          }
          step3Age(name, relationship)
        }
      })
    }

    const step3Age = (name: string, relationship: string) => {
      Taro.showModal({
        title: '第 3 步：输入年龄',
        content: '请输入成员年龄（数字）',
        editable: true,
        placeholderText: '如：35',
        confirmText: '下一步',
        success: (res3) => {
          if (!res3.confirm) return
          const ageStr = (res3.content || '').trim()
          const age = parseInt(ageStr, 10)
          if (!ageStr || isNaN(age) || age < 0 || age > 150) {
            Taro.showToast({ title: '请输入有效年龄', icon: 'none' })
            return
          }
          step4Avatar(name, relationship, age)
        }
      })
    }

    const step4Avatar = (name: string, relationship: string, age: number) => {
      Taro.showModal({
        title: '第 4 步：头像 emoji',
        content: '输入头像 emoji（可选，不填默认👤）',
        editable: true,
        placeholderText: '如：👨 👩 👦 👧 或留空',
        confirmText: '完成',
        cancelText: '跳过',
        success: (res4) => {
          let avatar = (res4.content || '').trim() || '👤'
          if (!res4.confirm && !res4.cancel) return
          if (res4.cancel) avatar = '👤'
          if (!avatar || avatar.length === 0) avatar = '👤'
          Taro.showModal({
            title: '确认添加',
            content: `姓名：${name}\n关系：${relationship}\n年龄：${age}岁\n头像：${avatar}\n\n确认添加该成员？`,
            confirmText: '确认添加',
            success: (resFinal) => {
              if (resFinal.confirm) {
                addFamilyMember({
                  name,
                  relationship,
                  age,
                  avatar,
                  role: '成员'
                })
                Taro.showToast({ title: '添加成功', icon: 'success' })
              }
            }
          })
        }
      })
    }

    step1Name()
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
          添加成员
        </Button>
      </View>

      {detailVisible && selectedMember && (
        <View
          className={styles.modalMask}
          onClick={handleCloseDetail}
        >
          <View
            className={styles.modalContent}
            catchMove
            onClick={(e) => { try { (e as any).stopPropagation?.() } catch { /* ignore */ } }}
          >
            <View className={styles.modalHeader}>
              <View className={styles.modalAvatar}>
                <Text>{selectedMember.avatar}</Text>
              </View>
              <Text className={styles.modalName}>
                {selectedMember.name}
                {selectedMember.isAdmin && (
                  <Text
                    style={{
                      fontSize: '22rpx',
                      color: '#2DB8A7',
                      marginLeft: '10rpx',
                      background: '#E6F7F4',
                      padding: '4rpx 10rpx',
                      borderRadius: '6rpx'
                    }}
                  >
                    管理员
                  </Text>
                )}
              </Text>
              <Text className={styles.modalSubtitle}>
                {selectedMember.relationship} · {selectedMember.age}岁
              </Text>
            </View>

            <ScrollView scrollY className={styles.modalBody}>
              <View className={styles.detailSection}>
                <View className={styles.detailSectionHeader}>
                  <Text className={styles.detailSectionTitle}>过敏列表</Text>
                  <Button className={styles.detailActionBtn} onClick={handleAddAllergy}>
                    <Text>+ 添加</Text>
                  </Button>
                </View>
                {selectedMember.allergies.length === 0 ? (
                  <Text className={styles.detailEmpty}>暂无过敏记录，点击右上角添加</Text>
                ) : (
                  <View className={styles.detailTagList}>
                    {selectedMember.allergies.map((allergy, idx) => (
                      <View
                        key={idx}
                        className={styles.detailTagItem}
                        onClick={() => handleRemoveAllergy(allergy)}
                      >
                        <Text className={styles.detailTagText}>{allergy}</Text>
                        <Text className={styles.detailTagRemove}>×</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text className={styles.detailHint}>点击标签可移除该过敏记录</Text>
              </View>

              <View className={styles.detailSection}>
                <View className={styles.detailSectionHeader}>
                  <Text className={styles.detailSectionTitle}>慢性病列表</Text>
                  <Button className={styles.detailActionBtn} onClick={handleAddChronicDisease}>
                    <Text>+ 添加</Text>
                  </Button>
                </View>
                {selectedMember.chronicDiseases.length === 0 ? (
                  <Text className={styles.detailEmpty}>暂无慢性病记录，点击右上角添加</Text>
                ) : (
                  <View className={styles.detailTagList}>
                    {selectedMember.chronicDiseases.map((disease, idx) => (
                      <View
                        key={idx}
                        className={styles.detailTagItemChronic}
                        onClick={() => handleRemoveChronicDisease(disease)}
                      >
                        <Text className={styles.detailTagText}>{disease}</Text>
                        <Text className={styles.detailTagRemove}>×</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text className={styles.detailHint}>点击标签可移除该慢性病记录</Text>
              </View>

              {!selectedMember.isAdmin && (
                <Button
                  className={styles.deleteMemberBtn}
                  onClick={handleDeleteMember}
                >
                  <Text>删除该成员</Text>
                </Button>
              )}
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button className={styles.modalCloseBtn} onClick={handleCloseDetail}>
                关闭
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default MemberManagePage
