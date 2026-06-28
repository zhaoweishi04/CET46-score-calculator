# CET46 估分器

一个微信小程序四六级估分工具，支持考后估分、历年赋分数据选择、CET-4 / CET-6 切换，以及听力、阅读、写译分项估算。

## 项目结构

- `project.config.json`：微信开发者工具项目配置
- `WeChatAppScoreCalculator（部分广告版本1.30）/`：小程序源码目录
- `WeChatAppScoreCalculator（部分广告版本1.30）/pages/score-calculator/`：估分器主页面
- `WeChatAppScoreCalculator（部分广告版本1.30）/cloudfunctions/`：云函数

## 本地开发

1. 使用微信开发者工具导入本仓库根目录。
2. 确认 `project.config.json` 中的 `miniprogramRoot` 指向小程序源码目录。
3. 在开发者工具中编译预览。

`project.private.config.json` 属于个人本地配置，已加入 `.gitignore`。
