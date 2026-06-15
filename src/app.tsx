import React, { useEffect, useState } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import './app.scss';
import { useMedicineStore } from './store/useMedicineStore';

function App(props) {
  const hydrateFromStorage = useMedicineStore((s) => s.hydrateFromStorage);
  const persistToStorage = useMedicineStore((s) => s.persistToStorage);
  const isHydrated = useMedicineStore((s) => s.isHydrated);
  const [hydrating, setHydrating] = useState(true);

  // 启动时：从本地存储恢复数据
  useEffect(() => {
    const init = async () => {
      try {
        await hydrateFromStorage();
      } catch (e) {
        console.warn('[App] hydrate failed', e);
      } finally {
        setHydrating(false);
      }
    };
    init();
  }, [hydrateFromStorage]);

  // 每次显示时：重新加载（多端后台回到前台时保持数据新鲜）
  useDidShow(async () => {
    try {
      await hydrateFromStorage();
    } catch (e) {
      // ignore
    }
  });

  // 隐藏时：确保持久化一次
  useDidHide(() => {
    persistToStorage();
  });

  // 加载页（直到数据恢复完成）
  if (hydrating || !isHydrated) {
    return (
      <View
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2DB8A7 0%, #57D9C7 100%)'
        }}
      >
        <View style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '100rpx' }}>💊</Text>
          <Text
            style={{
              display: 'block',
              marginTop: '24rpx',
              color: '#fff',
              fontSize: '32rpx',
              fontWeight: 'bold'
            }}
          >
            家庭药箱
          </Text>
          <Text
            style={{
              display: 'block',
              marginTop: '8rpx',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '24rpx'
            }}
          >
            正在同步药箱数据...
          </Text>
        </View>
      </View>
    );
  }

  return props.children;
}

export default App;
