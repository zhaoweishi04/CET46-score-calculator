
App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-8gtuwxyf5d1c4d44',
        traceUser: false
      });
    }
  }
});
