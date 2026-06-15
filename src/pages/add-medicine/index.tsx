import React, { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Switch, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useMedicineStore } from '@/store/useMedicineStore'
import { categoryList, generateId } from '@/utils'
import type { MedicineCategory, MedicineTaboo } from '@/types/medicine'

const AddMedicinePage: React.FC = () => {
  const router = useRouter()
  const editId = router.params.id
  const isEdit = !!editId

  const { getMedicineById, addMedicine, updateMedicine, familyMembers } = useMedicineStore()

  const [form, setForm] = useState({
    name: '',
    specification: '',
    manufacturer: '',
    category: 'cold' as MedicineCategory,
    totalQuantity: 24,
    remainingQuantity: 24,
    unit: '片',
    minStock: 5,
    expiryDate: '',
    productionDate: '',
    openStatus: 'unopened' as 'opened' | 'unopened',
    openDate: '',
    storage: '阴凉干燥处保存',
    dosage: '口服，一次1-2片，一日3次',
    indications: '',
    contraindications: '',
    sideEffects: '',
    applicablePeople: [] as string[],
    taboos: [] as MedicineTaboo[],
    notes: ''
  })

  useEffect(() => {
    if (isEdit && editId) {
      const medicine = getMedicineById(editId)
      if (medicine) {
        setForm({
          name: medicine.name,
          specification: medicine.specification,
          manufacturer: medicine.manufacturer,
          category: medicine.category,
          totalQuantity: medicine.totalQuantity,
          remainingQuantity: medicine.remainingQuantity,
          unit: medicine.unit,
          minStock: medicine.minStock,
          expiryDate: medicine.expiryDate,
          productionDate: medicine.productionDate || '',
          openStatus: medicine.openStatus,
          openDate: medicine.openDate || '',
          storage: medicine.storage,
          dosage: medicine.dosage,
          indications: medicine.indications,
          contraindications: medicine.contraindications,
          sideEffects: medicine.sideEffects,
          applicablePeople: medicine.applicablePeople,
          taboos: medicine.taboos,
          notes: medicine.notes || ''
        })
        Taro.setNavigationBarTitle({ title: '编辑药品' })
      }
    }
  }, [isEdit, editId, getMedicineById])

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCategoryClick = (category: MedicineCategory) => {
    updateField('category', category)
  }

  const handleMemberToggle = (memberId: string) => {
    setForm((prev) => {
      const applicable = prev.applicablePeople.includes(memberId)
        ? prev.applicablePeople.filter((id) => id !== memberId)
        : [...prev.applicablePeople, memberId]
      return { ...prev, applicablePeople: applicable }
    })
  }

  const handleStepper = (type: 'total' | 'remaining' | 'minStock', delta: number) => {
    if (type === 'total') {
      const newValue = Math.max(1, form.totalQuantity + delta)
      setForm((prev) => ({
        ...prev,
        totalQuantity: newValue,
        remainingQuantity: Math.min(prev.remainingQuantity, newValue)
      }))
    } else if (type === 'remaining') {
      const newValue = Math.max(0, Math.min(form.totalQuantity, form.remainingQuantity + delta))
      updateField('remainingQuantity', newValue)
    } else {
      const newValue = Math.max(1, form.minStock + delta)
      updateField('minStock', newValue)
    }
  }

  const handleScan = () => {
    Taro.scanCode({
      success: (res) => {
        Taro.showToast({ title: '扫码成功', icon: 'success' })
        updateField('name', form.name || '扫码识别的药品名称')
      },
      fail: () => {
        Taro.showToast({ title: '扫码功能演示', icon: 'none' })
        updateField('name', '示例药品名称')
      }
    })
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!form.expiryDate) {
      Taro.showToast({ title: '请选择有效期', icon: 'none' })
      return
    }

    if (isEdit && editId) {
      updateMedicine(editId, form)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } else {
      addMedicine({
        id: generateId(),
        ...form,
        usageRecords: [],
        createdAt: new Date().toISOString().split('T')[0]
      })
      Taro.showToast({ title: '添加成功', icon: 'success' })
    }

    setTimeout(() => {
      Taro.navigateBack()
    }, 1000)
  }

  return (
    <ScrollView scrollY className={styles.addPage} enhanced showScrollbar={false}>
      {!isEdit && (
        <View className={styles.formSection}>
          <View className={styles.scanTips}>
            <Text className={styles.scanIcon}>📷</Text>
            <Text className={styles.scanText}>扫码快速录入药品信息</Text>
            <Button className={styles.scanBtn} onClick={handleScan}>
              扫码
            </Button>
          </View>
        </View>
      )}

      <View className={styles.formSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>💊</Text>
          <Text className={styles.sectionTitle}>基本信息</Text>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>药品名称</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="请输入药品名称"
              value={form.name}
              onInput={(e) => updateField('name', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>规格</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="例如：0.5g*24片/盒"
              value={form.specification}
              onInput={(e) => updateField('specification', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>生产厂家</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="请输入生产厂家"
              value={form.manufacturer}
              onInput={(e) => updateField('manufacturer', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>分类</Text>
          <View className={styles.formControl}>
            <View className={styles.categoryList}>
              {categoryList.map((cat) => (
                <Button
                  key={cat.key}
                  className={classnames(styles.categoryItem, {
                    [styles.categoryItemActive]: form.category === cat.key
                  })}
                  onClick={() => handleCategoryClick(cat.key as MedicineCategory)}
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>📦</Text>
          <Text className={styles.sectionTitle}>库存信息</Text>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>总容量</Text>
          <View className={styles.formControl}>
            <View className={styles.stepper}>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepper('total', -1)}
              >
                -
              </Button>
              <Text className={styles.stepperInput}>{form.totalQuantity}</Text>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepper('total', 1)}
              >
                +
              </Button>
            </View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>剩余数量</Text>
          <View className={styles.formControl}>
            <View className={styles.stepper}>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepper('remaining', -1)}
              >
                -
              </Button>
              <Text className={styles.stepperInput}>{form.remainingQuantity}</Text>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepper('remaining', 1)}
              >
                +
              </Button>
            </View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>单位</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="片、粒、袋、毫升..."
              value={form.unit}
              onInput={(e) => updateField('unit', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>最低库存</Text>
          <View className={styles.formControl}>
            <View className={styles.stepper}>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepper('minStock', -1)}
              >
                -
              </Button>
              <Text className={styles.stepperInput}>{form.minStock}</Text>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepper('minStock', 1)}
              >
                +
              </Button>
            </View>
            <Text
              style={{
                fontSize: '22rpx',
                color: '#86909C',
                marginTop: '8rpx',
                display: 'block'
              }}
            >
              低于此数量时将提醒补货
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>📅</Text>
          <Text className={styles.sectionTitle}>有效期信息</Text>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>生产日期</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="例如：2024-01-15"
              value={form.productionDate}
              onInput={(e) => updateField('productionDate', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>有效期至</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="例如：2025-12-31"
              value={form.expiryDate}
              onInput={(e) => updateField('expiryDate', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.switchRow}>
          <View>
            <Text className={styles.switchLabel}>是否已开封</Text>
            <Text className={styles.switchDesc}>开封后需在指定期限内使用</Text>
          </View>
          <Switch
            checked={form.openStatus === 'opened'}
            onChange={(e) =>
              updateField('openStatus', e.detail.value ? 'opened' : 'unopened')
            }
            color="#2DB8A7"
          />
        </View>

        {form.openStatus === 'opened' && (
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>开封日期</Text>
            <View className={styles.formControl}>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="例如：2024-06-01"
                value={form.openDate}
                onInput={(e) => updateField('openDate', e.detail.value)}
              />
            </View>
          </View>
        )}

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>储存条件</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="例如：阴凉干燥处保存"
              value={form.storage}
              onInput={(e) => updateField('storage', e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>💊</Text>
          <Text className={styles.sectionTitle}>用药说明</Text>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>用法用量</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="例如：口服，一次1-2片，一日3次"
              value={form.dosage}
              onInput={(e) => updateField('dosage', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>适应症</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="用于缓解..."
              value={form.indications}
              onInput={(e) => updateField('indications', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>禁忌症</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="请填写禁忌症"
              value={form.contraindications}
              onInput={(e) => updateField('contraindications', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>不良反应</Text>
          <View className={styles.formControl}>
            <Input
              className={styles.formInput}
              placeholder="可能的不良反应"
              value={form.sideEffects}
              onInput={(e) => updateField('sideEffects', e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>👨‍👩‍👧‍👦</Text>
          <Text className={styles.sectionTitle}>适用人群</Text>
        </View>
        <View className={styles.memberList}>
          {familyMembers.map((member) => (
            <Button
              key={member.id}
              className={classnames(styles.memberItem, {
                [styles.memberItemActive]: form.applicablePeople.includes(member.id)
              })}
              onClick={() => handleMemberToggle(member.id)}
            >
              <Text className={styles.memberAvatar}>{member.avatar}</Text>
              {member.name}
            </Button>
          ))}
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>📝</Text>
          <Text className={styles.sectionTitle}>备注</Text>
        </View>
        <Textarea
          className={styles.formTextarea}
          placeholder="添加备注信息..."
          value={form.notes}
          onInput={(e) => updateField('notes', e.detail.value)}
          maxlength={200}
        />
      </View>

      <View style={{ height: '40rpx' }} />

      <View className={styles.bottomBar}>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          {isEdit ? '保存修改' : '添加药品'}
        </Button>
      </View>
    </ScrollView>
  )
}

export default AddMedicinePage
