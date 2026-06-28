const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cloud1-8gtuwxyf5d1c4d44'
});

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID
  };
};
