// pages/score-calculator/index.js

const { scoreData } = require('./score-data.js');

let videoAd = null;
let videoAdCloseHandler = null;
let videoAdErrorHandler = null;
const adFreeOpenIds = [
  'ouYbF69LUJDkeQJLD-anB-XE0xgw',
  'ouYbF6_FE3ESjZrdVanv8GIXgoUU',
  'ouYbF620-5IQY7CH1jLa5RZBT6Ns'
];
const currentScoreSetId = '2026-spring';
const scoreSetOrder = {
  '2026-spring': '2026-06'
};
const getScoreSetOrderValue = id => {
  const orderId = scoreData[id].sortKey || scoreSetOrder[id] || id;
  const parts = orderId.split('-');
  const year = parseInt(parts[0], 10) || 0;
  const month = parseInt(parts[1], 10) || 0;
  return year * 100 + month;
};
const allScoreSetOptions = Object.keys(scoreData)
  .sort((a, b) => getScoreSetOrderValue(a) - getScoreSetOrderValue(b))
  .map(id => ({ id, name: scoreData[id].name }));
const currentScoreSetOptions = allScoreSetOptions.filter(item => item.id === currentScoreSetId);

Page({
  data: {
    currentView: 'home',
    currentTool: '',
    tools: [
      {
        id: 'estimate',
        title: '本次考后快速估分',
        desc: '输入写译、听力、阅读小分，快速判断总分区间',
        badge: '热门',
        scoreSet: '2026-spring'
      },
      {
        id: 'history',
        title: '历年赋分数据参考',
        desc: '按年份和试卷查看实际赋分，刷题复盘更有底',
        badge: '新增',
        scoreSet: '2026-spring'
      },
      {
        id: 'target',
        title: '目标分数反推',
        desc: '输入目标分，生成稳妥、听力、阅读三条备考路线',
        badge: '推荐',
        scoreSet: '2026-spring'
      }
    ],
    wf: '',
    listening: '',
    reading: '',
    wfScore: 0,
    listeningScore: 0,
    readingScore: 0,
    totalScore: 0,
    scoreLevel: '请输入分数进行预测',
    scoreSetOptions: allScoreSetOptions,
    scoreSetIndex: 0,
    selectedScoreSet: '2026-spring',
    scoreSetName: '2026 年 6 月',
    scoreSetSource: '严格基于某书气象哥赋分表',
    scoreSetType: 'estimate',
    scoreSetLocked: false,
    scoreSetScopeText: '可选择本次与历年赋分数据',
    levelOptions: [],
    listeningOptions: [],
    readingOptions: [],
    selectedLevel: 'cet4',
    selectedListeningPaper: 'son',
    selectedReadingPaper: 'disgust',
    listeningPaperName: '儿子',
    readingPaperName: 'Disgust',
    targetScore: '425',
    targetWfOptions: [
      { id: 'conservative', name: '保守' },
      { id: 'normal', name: '正常' },
      { id: 'excellent', name: '优秀' },
      { id: 'custom', name: '自定义' }
    ],
    targetWfIndex: 1,
    targetWfMode: 'normal',
    targetWfName: '正常',
    targetCustomWfScore: '',
    targetCurrentListening: '',
    targetCurrentReading: '',
    targetPlans: [],
    targetSummary: '',
    targetGapText: '填写当前听力/阅读小分后，可生成差距建议。',
    showUpdateModal: true,
    hasWatchedAd: false
  },

  onLoad: function(options) {
    const initialScoreSet = options && scoreData[options.scoreSet] ? options.scoreSet : '2026-spring';
    this.refreshPaperOptions(initialScoreSet, 'cet4', 'son', 'disgust');
    this.checkAdFreeUser();
    this.initVideoAd();
  },

  checkAdFreeUser: function() {
    if (!wx.cloud || !wx.cloud.callFunction) return;

    wx.cloud.callFunction({
      name: 'getOpenId',
      success: res => {
        const openid = res && res.result && res.result.openid;
        if (adFreeOpenIds.indexOf(openid) !== -1) {
          this.setData({ hasWatchedAd: true });
        }
      },
      fail: err => {
        console.error('获取用户身份失败', err);
      }
    });
  },

  initVideoAd: function() {
    if (!wx.createRewardedVideoAd) return;

    if (!videoAd) {
      videoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-3abe751c67f03a22' });
    }
    if (videoAd.offClose) videoAd.offClose();
    if (videoAd.offError) videoAd.offError();

    videoAdErrorHandler = err => {
      console.error('激励视频加载失败', err);
    };

    videoAdCloseHandler = res => {
      if (res && res.isEnded) {
        this.setData({ hasWatchedAd: true });
        wx.showToast({ title: '解锁成功', icon: 'success' });
      } else {
        wx.showToast({ title: '完整观看才能解锁详情', icon: 'none', duration: 2000 });
      }
    };

    videoAd.onError(videoAdErrorHandler);
    videoAd.onClose(videoAdCloseHandler);
  },

  handleUnlockTap: function() {
    if (!videoAd) {
      wx.showToast({ title: '当前环境不支持广告', icon: 'none', duration: 2000 });
      return;
    }

    videoAd.show().catch(() => {
      videoAd.load().then(() => videoAd.show()).catch(err => {
        console.error('激励视频不可用', err);
        wx.showToast({ title: '广告暂不可用', icon: 'none', duration: 2000 });
      });
    });
  },

  closeModal: function() { this.setData({ showUpdateModal: false }); },
  preventProp: function() {},
  bindInputWF: function(e) { this.setData({ wf: e.detail.value }); this.calculateScore(); },
  bindInputListening: function(e) { this.setData({ listening: e.detail.value }); this.calculateScore(); },
  bindInputReading: function(e) { this.setData({ reading: e.detail.value }); this.calculateScore(); },
  bindTargetScore: function(e) { this.setData({ targetScore: e.detail.value }); this.calculateTargetPlans(); },
  bindTargetCustomWfScore: function(e) { this.setData({ targetCustomWfScore: e.detail.value }); this.calculateTargetPlans(); },
  bindTargetCurrentListening: function(e) { this.setData({ targetCurrentListening: e.detail.value }); this.calculateTargetPlans(); },
  bindTargetCurrentReading: function(e) { this.setData({ targetCurrentReading: e.detail.value }); this.calculateTargetPlans(); },

  handleToolTap: function(e) {
    const id = e.currentTarget.dataset.id;
    const tool = this.data.tools.find(item => item.id === id);
    if (!tool || !tool.scoreSet) {
      wx.showToast({ title: '这个功能马上安排', icon: 'none' });
      return;
    }

    const isEstimate = id === 'estimate';
    const scoreSetOptions = isEstimate ? currentScoreSetOptions : allScoreSetOptions;
    const scoreSetId = isEstimate ? currentScoreSetId : (tool.scoreSet || currentScoreSetId);
    this.setData({
      currentTool: id,
      currentView: id === 'target' ? 'target' : 'calculator',
      showUpdateModal: false,
      scoreSetOptions,
      scoreSetLocked: isEstimate,
      scoreSetScopeText: isEstimate ? '本次考后估分仅使用当前场次赋分数据' : '可选择本次与历年赋分数据'
    });
    this.refreshPaperOptions(scoreSetId, this.data.selectedLevel, this.data.selectedListeningPaper, this.data.selectedReadingPaper);
  },

  backHome: function() {
    this.setData({ currentView: 'home' });
  },

  scoreSetChange: function(e) {
    if (this.data.scoreSetLocked) return;

    const scoreSetIndex = Number(e.detail.value) || 0;
    const selectedScoreSet = this.data.scoreSetOptions[scoreSetIndex].id;
    this.refreshPaperOptions(selectedScoreSet, this.data.selectedLevel, this.data.selectedListeningPaper, this.data.selectedReadingPaper, scoreSetIndex);
  },

  levelRadioChange: function(e) {
    this.refreshPaperOptions(this.data.selectedScoreSet, e.detail.value);
  },

  readingRadioChange: function(e) {
    const paper = this.getReadingPapers()[e.detail.value];
    this.setData({ selectedReadingPaper: e.detail.value, readingPaperName: paper ? paper.name : '' });
    this.calculateScore();
    this.calculateTargetPlans();
  },

  listeningRadioChange: function(e) {
    const paper = this.getListeningPapers()[e.detail.value];
    this.setData({ selectedListeningPaper: e.detail.value, listeningPaperName: paper ? paper.name : '' });
    this.calculateScore();
    this.calculateTargetPlans();
  },

  targetWfModeChange: function(e) {
    const targetWfIndex = Number(e.detail.value) || 0;
    const option = this.data.targetWfOptions[targetWfIndex] || this.data.targetWfOptions[1];
    this.setData({
      targetWfIndex,
      targetWfMode: option.id,
      targetWfName: option.name
    });
    this.calculateTargetPlans();
  },

  refreshPaperOptions: function(scoreSetId, preferredLevel, preferredListening, preferredReading, scoreSetIndex) {
    const scoreSet = scoreData[scoreSetId] || scoreData['2026-spring'];
    const levelOptions = Object.keys(scoreSet.levels).map(id => ({
      id,
      name: scoreSet.levels[id].name
    }));
    const selectedLevel = scoreSet.levels[preferredLevel] ? preferredLevel : levelOptions[0].id;
    const levelData = scoreSet.levels[selectedLevel];
    const listeningOptions = Object.keys(levelData.listening).map(id => ({
      id,
      name: levelData.listening[id].name
    }));
    const readingOptions = Object.keys(levelData.reading).map(id => ({
      id,
      name: levelData.reading[id].name
    }));
    const selectedListeningPaper = levelData.listening[preferredListening] ? preferredListening : listeningOptions[0].id;
    const selectedReadingPaper = levelData.reading[preferredReading] ? preferredReading : readingOptions[0].id;
    const resolvedScoreSetIndex = typeof scoreSetIndex === 'number'
      ? scoreSetIndex
      : this.data.scoreSetOptions.findIndex(item => item.id === scoreSet.id);

    this.setData({
      scoreSetIndex: resolvedScoreSetIndex >= 0 ? resolvedScoreSetIndex : 0,
      selectedScoreSet: scoreSet.id,
      scoreSetName: scoreSet.name,
      scoreSetSource: scoreSet.source,
      scoreSetType: scoreSet.type,
      levelOptions,
      listeningOptions,
      readingOptions,
      selectedLevel,
      selectedListeningPaper,
      selectedReadingPaper,
      listeningPaperName: levelData.listening[selectedListeningPaper].name,
      readingPaperName: levelData.reading[selectedReadingPaper].name
    });
    this.calculateScore();
    this.calculateTargetPlans();
  },

  getCurrentLevelData: function() {
    const scoreSet = scoreData[this.data.selectedScoreSet] || scoreData['2026-spring'];
    return (scoreSet.levels && scoreSet.levels[this.data.selectedLevel]) || null;
  },

  getListeningPapers: function() {
    const levelData = this.getCurrentLevelData();
    return levelData ? levelData.listening : {};
  },

  getReadingPapers: function() {
    const levelData = this.getCurrentLevelData();
    return levelData ? levelData.reading : {};
  },

  calculateScore: function() {
    const wfInput = parseFloat(this.data.wf) || 0;
    const listInput = parseFloat(this.data.listening) || 0;
    const readInput = parseFloat(this.data.reading) || 0;
    const scores = this.getEstimatedScores(wfInput, listInput, readInput);
    const wfScore = scores.wfScore;
    const listeningScore = scores.listeningScore;
    const readingScore = scores.readingScore;
    const totalScore = Math.round(wfScore + listeningScore + readingScore);
    let scoreLevel = '请输入分数进行预测';
    if (totalScore >= 550) scoreLevel = '高手来的🐮';
    else if (totalScore >= 500) scoreLevel = '稳了稳了🙊';
    else if (totalScore >= 425) scoreLevel = '通过考试✌️';
    else if (totalScore > 0) scoreLevel = '下次再战😔';

    this.setData({
      wfScore: Math.round(wfScore),
      listeningScore: Math.round(listeningScore),
      readingScore: Math.round(readingScore),
      totalScore,
      scoreLevel
    });
  },

  getEstimatedScores: function(wfInput, listInput, readInput) {
    const levelData = this.getCurrentLevelData();
    let wfScore = 0;
    let listeningScore = 0;
    let readingScore = 0;

    if (levelData) {
      wfScore = this.getScoreInteger(30, wfInput, levelData.wf);
      listeningScore = this.getListeningSectionScore(listInput);
      readingScore = this.getReadingSectionScore(readInput);
    }

    return {
      wfScore: Math.round(wfScore),
      listeningScore: Math.round(listeningScore),
      readingScore: Math.round(readingScore)
    };
  },

  getListeningSectionScore: function(listInput) {
    const levelData = this.getCurrentLevelData();
    if (!levelData || !levelData.listening[this.data.selectedListeningPaper]) return 0;
    return this.getScoreInteger(35, listInput, levelData.listening[this.data.selectedListeningPaper].table);
  },

  getReadingSectionScore: function(readInput) {
    const levelData = this.getCurrentLevelData();
    if (!levelData || !levelData.reading[this.data.selectedReadingPaper]) return 0;

    let readingScore = this.getScoreWithDecimal(35, readInput, levelData.reading[this.data.selectedReadingPaper].table);
    if (this.data.selectedLevel === 'cet4') readingScore = Math.round(readingScore);
    if (this.data.selectedScoreSet === '2026-spring' && readInput === 34.5 && this.data.selectedLevel === 'cet4') {
      readingScore = this.getCet4ReadingScoreByFormula(readInput, this.data.selectedReadingPaper);
    }
    if (this.data.selectedScoreSet === '2026-spring' && this.data.selectedReadingPaper === 'selfDiscipline') readingScore = this.getCet6SelfDisciplineScore(readInput);
    if (this.data.selectedScoreSet === '2026-spring' && this.data.selectedReadingPaper === 'africa' && readInput === 34.5) readingScore = 248;
    if (this.data.selectedScoreSet === '2026-spring' && this.data.selectedReadingPaper === 'g20' && readInput === 34.5) readingScore = 248;
    const overrideScore = this.getReadingOverrideScore(this.data.selectedScoreSet, this.data.selectedLevel, this.data.selectedReadingPaper, readInput);
    if (overrideScore) readingScore = overrideScore;
    return readingScore;
  },

  calculateTargetPlans: function() {
    const targetScore = parseInt(this.data.targetScore, 10) || 0;
    const wfScore = this.getTargetWfScore();
    const levelData = this.getCurrentLevelData();

    if (!levelData || targetScore <= 0) {
      this.setData({
        targetPlans: [],
        targetSummary: '请输入目标总分后生成方案。',
        targetGapText: '填写当前听力/阅读小分后，可生成差距建议。'
      });
      return;
    }

    const candidates = [];
    for (let listeningRaw = 0; listeningRaw <= 35; listeningRaw += 1) {
      const listeningScore = Math.round(this.getListeningSectionScore(listeningRaw));
      for (let readingStep = 0; readingStep <= 70; readingStep += 1) {
        const readingRaw = readingStep / 2;
        const readingScore = Math.round(this.getReadingSectionScore(readingRaw));
        const totalScore = Math.round(wfScore + listeningScore + readingScore);
        if (totalScore >= targetScore) {
          candidates.push({
            listeningRaw,
            readingRaw,
            listeningScore,
            readingScore,
            wfScore,
            totalScore,
            margin: totalScore - targetScore
          });
        }
      }
    }

    if (!candidates.length) {
      this.setData({
        targetPlans: [],
        targetSummary: `目标 ${targetScore} 分，写译按 ${wfScore} 分估算；当前赋分表下听力阅读满分也难以达到。`,
        targetGapText: this.getTargetGapText(targetScore, wfScore, null)
      });
      return;
    }

    const plans = this.buildTargetPlans(candidates);
    this.setData({
      targetPlans: plans,
      targetSummary: `目标 ${targetScore} 分，写译按 ${wfScore} 分估算，基于 ${this.data.scoreSetName} · ${this.data.listeningPaperName} + ${this.data.readingPaperName}。`,
      targetGapText: this.getTargetGapText(targetScore, wfScore, plans[0])
    });
  },

  buildTargetPlans: function(candidates) {
    const used = {};
    const pick = (title, desc, list) => {
      const item = list.find(candidate => !used[`${candidate.listeningRaw}-${candidate.readingRaw}`]) || list[0];
      used[`${item.listeningRaw}-${item.readingRaw}`] = true;
      return this.formatTargetPlan(title, desc, item);
    };

    const byBalanced = candidates.slice().sort((a, b) => {
      const scoreA = Math.abs(a.listeningRaw - a.readingRaw) * 10 + a.margin + (a.listeningRaw + a.readingRaw) * 0.2;
      const scoreB = Math.abs(b.listeningRaw - b.readingRaw) * 10 + b.margin + (b.listeningRaw + b.readingRaw) * 0.2;
      return scoreA - scoreB;
    });
    const byListening = candidates
      .filter(item => item.listeningRaw > item.readingRaw && item.readingRaw >= 10)
      .sort((a, b) => {
        const scoreA = Math.abs((a.listeningRaw - a.readingRaw) - 6) * 8 + a.margin + (a.listeningRaw + a.readingRaw) * 0.2;
        const scoreB = Math.abs((b.listeningRaw - b.readingRaw) - 6) * 8 + b.margin + (b.listeningRaw + b.readingRaw) * 0.2;
        return scoreA - scoreB;
      });
    const byReading = candidates
      .filter(item => item.readingRaw > item.listeningRaw && item.listeningRaw >= 8)
      .sort((a, b) => {
        const scoreA = Math.abs((a.readingRaw - a.listeningRaw) - 6) * 8 + a.margin + (a.listeningRaw + a.readingRaw) * 0.2;
        const scoreB = Math.abs((b.readingRaw - b.listeningRaw) - 6) * 8 + b.margin + (b.listeningRaw + b.readingRaw) * 0.2;
        return scoreA - scoreB;
      });

    return [
      pick('稳妥均衡', '听力和阅读压力比较平均，适合大多数备考节奏。', byBalanced),
      pick('听力优先', '阅读压力略低，适合听力基础更强或近期主攻听力。', byListening.length ? byListening : byBalanced),
      pick('阅读优先', '听力压力略低，适合阅读提分更稳的同学。', byReading.length ? byReading : byBalanced)
    ];
  },

  formatTargetPlan: function(title, desc, item) {
    return {
      title,
      desc,
      listeningRaw: this.formatRawScore(item.listeningRaw),
      readingRaw: this.formatRawScore(item.readingRaw),
      listeningScore: item.listeningScore,
      readingScore: item.readingScore,
      wfScore: item.wfScore,
      totalScore: item.totalScore,
      margin: item.margin
    };
  },

  getTargetGapText: function(targetScore, wfScore, mainPlan) {
    const hasListening = this.data.targetCurrentListening !== '';
    const hasReading = this.data.targetCurrentReading !== '';
    if (!hasListening && !hasReading) return '填写当前听力/阅读小分后，可生成差距建议。';

    const currentListeningRaw = hasListening ? parseFloat(this.data.targetCurrentListening) || 0 : 0;
    const currentReadingRaw = hasReading ? parseFloat(this.data.targetCurrentReading) || 0 : 0;
    const currentListeningScore = hasListening ? Math.round(this.getListeningSectionScore(currentListeningRaw)) : 0;
    const currentReadingScore = hasReading ? Math.round(this.getReadingSectionScore(currentReadingRaw)) : 0;
    const currentTotal = Math.round(wfScore + currentListeningScore + currentReadingScore);
    const gap = targetScore - currentTotal;

    if (gap <= 0) return `按当前填写的小分估算约 ${currentTotal} 分，已经达到目标线。`;
    if (!mainPlan) return `按当前填写的小分估算约 ${currentTotal} 分，还差约 ${gap} 分。`;

    const listeningNeed = parseFloat(mainPlan.listeningRaw) - currentListeningRaw;
    const readingNeed = parseFloat(mainPlan.readingRaw) - currentReadingRaw;
    let priority = '听力和阅读';
    if (listeningNeed > readingNeed + 1) priority = '听力';
    if (readingNeed > listeningNeed + 1) priority = '阅读';
    return `按当前填写的小分估算约 ${currentTotal} 分，还差约 ${gap} 分；优先补 ${priority} 更接近稳妥方案。`;
  },

  getTargetWfScore: function() {
    if (this.data.targetWfMode === 'custom') {
      const customScore = parseInt(this.data.targetCustomWfScore, 10);
      if (!isNaN(customScore)) return Math.min(Math.max(customScore, 0), 212);
    }

    const presets = {
      cet4: { conservative: 120, normal: 132, excellent: 145 },
      cet6: { conservative: 105, normal: 118, excellent: 135 }
    };
    const levelPresets = presets[this.data.selectedLevel] || presets.cet4;
    return levelPresets[this.data.targetWfMode] || levelPresets.normal;
  },

  formatRawScore: function(score) {
    return Number.isInteger(score) ? String(score) : score.toFixed(1);
  },

  getScoreInteger: function(max, val, table) {
    return table[Math.min(Math.max(Math.floor(val), 0), max)] || 0;
  },

  getScoreWithDecimal: function(max, val, table) {
    if (val === '' || val < 0) return 0;
    if (val >= max) return table[max] || 0;
    const i = Math.floor(val);
    const d = val - i;
    const s = table[i] || 0;
    if (d === 0) return s;
    const next = table[Math.min(i + 1, max)] || s;
    return s + (next - s) * d;
  },

  getCet4ReadingScoreByFormula: function(val, paper) {
    const formulas = {
      disgust: n => 88 + (13 / 3) * n,
      organic: n => 73 + 4.8 * n,
      music: n => 78 + 4.5 * n
    };
    const formula = formulas[paper];
    if (!formula) return 0;

    return Math.round(formula(val));
  },

  getCet6SelfDisciplineScore: function(val) {
    if (val === '' || val < 0) return 0;
    if (val >= 35) return 249;

    return Math.round(46 + 5.6 * val);
  },

  getReadingOverrideScore: function(scoreSetId, level, paper, rawScore) {
    const overrides = {
      '2023-06': {
        cet4: {
          summer: { '34.5': 237 },
          house: { '34.5': 235, '1': 84, '1.5': 86 },
          lionDance: { '34.5': 235 }
        },
        cet6: {
          ai: { '31.5': 248, '34.5': 248 },
          ad: { '32.5': 248, '34.5': 248 }
        }
      },
      '2023-03': {
        cet4: {
          americanApartment: { '34.5': 221 }
        },
        cet6: {
          duckling: { '34.5': 231 }
        }
      },
      '2023-12': {
        cet4: {
          maternityLeave: { '34.5': 234 },
          busy: { '34.5': 234 },
          horseRace: { '4.5': 81, '34.5': 223 }
        },
        cet6: {
          darwin: { '32.5': 247, '34.5': 248 },
          spider: { '34.5': 248 },
          tax: { '34.5': 241 }
        }
      },
      '2024-06': {
        cet4: {
          fashion: { '34.5': 235 },
          willpower: { '34.5': 237 },
          laozi: { '34.5': 227 }
        },
        cet6: {
          newEnergy: { '34.5': 248 },
          americanDream: { '34.5': 248 },
          jazz: { '5.5': 45, '34.5': 232 }
        }
      },
      '2024-12': {
        cet4: {
          femaleEngineer: { '34.5': 235 },
          protein: { '34.5': 240 },
          chocolate: { '0.5': 81, '34.5': 233 }
        },
        cet6: {
          village: { '0.5': 45, '34.5': 248 },
          brainSides: { '34.5': 238 },
          movie: { '3.5': 47, '34.5': 248 }
        }
      },
      '2025-06': {
        cet4: {
          panda: { '34.5': 237 },
          innerBeauty: { '34.5': 226 },
          juice: { '3.5': 81, '34.5': 221 }
        },
        cet6: {
          snob: { '0.5': 45 },
          passion: { '34.5': 248 },
          gdp: { '3.5': 47 }
        }
      },
      '2025-12': {
        cet4: {
          fortyFive: { '34.5': 232 },
          clover: { '34.5': 233 },
          junkFood: { '0.5': 81, '34.5': 235 }
        },
        cet6: {
          fairness: { '4.5': 45, '34.5': 244 }
        }
      }
    };
    const rawKey = String(rawScore);

    return overrides[scoreSetId] &&
      overrides[scoreSetId][level] &&
      overrides[scoreSetId][level][paper] &&
      overrides[scoreSetId][level][paper][rawKey];
  }
});
