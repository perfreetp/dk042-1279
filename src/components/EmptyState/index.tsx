import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import styles from './index.module.scss'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📦',
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <View className={styles.emptyContainer}>
      <View className={styles.emptyIcon}>{icon}</View>
      <Text className={styles.emptyTitle}>{title}</Text>
      {description && <Text className={styles.emptyDesc}>{description}</Text>}
      {actionText && onAction && (
        <Button className={styles.actionButton} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  )
}

export default EmptyState
