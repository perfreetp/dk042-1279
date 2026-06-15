export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/inventory/index',
    'pages/purchase/index',
    'pages/taboos/index',
    'pages/family/index',
    'pages/medicine-detail/index',
    'pages/add-medicine/index',
    'pages/member-manage/index',
    'pages/usage-review/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2DB8A7',
    navigationBarTitleText: '家庭药箱',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#2DB8A7',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '药箱'
      },
      {
        pagePath: 'pages/inventory/index',
        text: '盘点'
      },
      {
        pagePath: 'pages/purchase/index',
        text: '采购'
      },
      {
        pagePath: 'pages/taboos/index',
        text: '禁忌'
      },
      {
        pagePath: 'pages/family/index',
        text: '家庭'
      }
    ]
  }
})
