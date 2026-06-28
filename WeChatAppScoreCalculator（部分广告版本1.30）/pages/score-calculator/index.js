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
const scoreSetOptions = Object.keys(scoreData).map(id => ({ id, name: scoreData[id].name }));

Page({
  data: {
    currentView: 'home',
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
    ],
    wf: '',
    listening: '',
    reading: '',
    wfScore: 0,
    listeningScore: 0,
    readingScore: 0,
    totalScore: 0,
    scoreLevel: '请输入分数进行预测',
    scoreSetOptions,
    scoreSetIndex: 0,
    selectedScoreSet: '2026-spring',
    scoreSetName: '2026 上估分',
    scoreSetSource: '严格基于某书气象哥赋分表',
    scoreSetType: 'estimate',
    levelOptions: [],
    listeningOptions: [],
    readingOptions: [],
    selectedLevel: 'cet4',
    selectedListeningPaper: 'son',
    selectedReadingPaper: 'disgust',
    listeningPaperName: '儿子',
    readingPaperName: 'Disgust',
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

  handleToolTap: function(e) {
    const id = e.currentTarget.dataset.id;
    const tool = this.data.tools.find(item => item.id === id);
    if (!tool || !tool.scoreSet) {
      wx.showToast({ title: '这个功能马上安排', icon: 'none' });
      return;
    }

    this.setData({ currentView: 'calculator', showUpdateModal: false });
    this.refreshPaperOptions(tool.scoreSet, this.data.selectedLevel, this.data.selectedListeningPaper, this.data.selectedReadingPaper);
  },

  backHome: function() {
    this.setData({ currentView: 'home' });
  },

  scoreSetChange: function(e) {
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
  },

  listeningRadioChange: function(e) {
    const paper = this.getListeningPapers()[e.detail.value];
    this.setData({ selectedListeningPaper: e.detail.value, listeningPaperName: paper ? paper.name : '' });
    this.calculateScore();
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
    let wfScore = 0;
    let listeningScore = 0;
    let readingScore = 0;
    const wfInput = parseFloat(this.data.wf) || 0;
    const listInput = parseFloat(this.data.listening) || 0;
    const readInput = parseFloat(this.data.reading) || 0;
    const levelData = this.getCurrentLevelData();

    if (levelData) {
      wfScore = this.getScoreInteger(30, wfInput, levelData.wf);
      listeningScore = this.getScoreInteger(35, listInput, levelData.listening[this.data.selectedListeningPaper].table);
      readingScore = this.getScoreWithDecimal(35, readInput, levelData.reading[this.data.selectedReadingPaper].table);

      if (this.data.selectedLevel === 'cet4') readingScore = Math.round(readingScore);
      if (this.data.selectedScoreSet === '2026-spring' && readInput === 34.5 && this.data.selectedLevel === 'cet4') {
        readingScore = this.getCet4ReadingScoreByFormula(readInput, this.data.selectedReadingPaper);
      }
      if (this.data.selectedScoreSet === '2026-spring' && this.data.selectedReadingPaper === 'selfDiscipline') readingScore = this.getCet6SelfDisciplineScore(readInput);
      if (this.data.selectedScoreSet === '2026-spring' && this.data.selectedReadingPaper === 'africa' && readInput === 34.5) readingScore = 248;
      if (this.data.selectedScoreSet === '2026-spring' && this.data.selectedReadingPaper === 'g20' && readInput === 34.5) readingScore = 248;
    }

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
  }
});
