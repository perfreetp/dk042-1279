import React from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import { categoryList } from '@/utils'

interface CategoryTabProps {
  activeKey: string
  onChange: (key: string) => void
  showAll?: boolean
}

const CategoryTab: React.FC<CategoryTabProps> = ({ activeKey, onChange, showAll = true }) => {
  const allCategories = showAll
    ? [{ key: 'all', name: '全部', color: '#2DB8A7', bgColor: '#E6F7F4', icon: '💊' }, ...categoryList]
    : categoryList

  return (
    <ScrollView scrollX className={styles.categoryScroll} enhanced showScrollbar={false}>
      <View className={styles.categoryList}>
        {allCategories.map((cat) => (
          <View
            key={cat.key}
            className={classnames(styles.categoryItem, {
              [styles.active]: activeKey === cat.key
            })}
            style={
              activeKey === cat.key
                ? { backgroundColor: cat.color, color: '#fff' }
                : { backgroundColor: cat.bgColor, color: cat.color }
            }
            onClick={() => onChange(cat.key)}
          >
            <Text className={styles.categoryIcon}>{cat.icon}</Text>
            <Text className={styles.categoryName}>{cat.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default CategoryTab
