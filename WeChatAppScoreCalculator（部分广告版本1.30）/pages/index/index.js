// pages/index/index.js

Page({
  data: {
    tools: [
      {
        id: 'estimate',
        title: '本次考后估分',
        desc: '适合刚考完，按当前赋分表快速估总分',
        badge: '热门',
        scoreSet: '2026-spring'
      },
      {
        id: 'history',
        title: '历年实际赋分',
        desc: '查 2023.6 起的真题赋分，备考刷题也能用',
        badge: '新增',
        scoreSet: '2023-06'
      },
      {
        id: 'target',
        title: '备考目标反推',
        desc: '输入目标分，反推听力阅读大概要对多少',
        badge: '规划中'
      }
    ]
  },

  handleToolTap: function(e) {
    const id = e.currentTarget.dataset.id;
    const tool = this.data.tools.find(item => item.id === id);
    if (!tool || !tool.scoreSet) {
      wx.showToast({ title: '这个功能马上安排', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/score-calculator/index?scoreSet=${tool.scoreSet}`
    });
  }
});
