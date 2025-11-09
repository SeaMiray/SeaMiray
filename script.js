// script.js - V36 完全版（assets.json & portfolio.json対応、凝ったローディング、パソコン風ヘッダー、高解像度、強手振れ）
const CONFIG = {
  MODELS_PATH: './models/',
  USE_ABSOLUTE_PATH: false,
  DEBUG_MODE: true,
  HDRI_PATH: './hdr.exr',
  SCENE_PATH: './Scene.glb',
  LIGHT_PATH: './light.glb',
  
  CAMERA_SHAKE: {
    enabled: true,
    intensity: 0.08,
    frequency: 0.15,
    trauma: 0,
    traumaDecay: 0.8
  },
  
  POST_PROCESSING: {
    fogEnabled: true,
    vignetteEnabled: true,
    noiseEnabled: true,
    pixelateEnabled: false,
    chromaticAberration: true
  },
  
  AUTO_ROTATION: {
    enabled: true,
    speed: 0.5
  },
  
  PERFORMANCE: {
    frameSkip: 1,
    enableSound: false,
    particleEffects: true,
    pixelRatio: 2.0
  }
};

const DEFAULT_GAME_DATA = [
  {
    id: '準備中',
    file: 'package_01.glb',
    name: 'xxx',
    description: 'xxx',
    genre: 'xxx',
    playtime: 'xxx',
    devtime: 'xxx',
    tools: 'Unreal Engine 5.7'
  },
  {
    id: '準備中',
    file: 'package_02.glb',
    name: 'xxx',
    description: 'xxx',
    genre: 'xxx',
    playtime: 'xxx',
    devtime: 'xxx',
    tools: 'Unreal Engine 5.7'
  },
  {
    id: '準備中',
    file: 'package_03.glb',
    name: 'xxx',
    description: '3xxx',
    genre: 'xxx',
    playtime: 'xxx',
    devtime: 'xxx',
    tools: 'Unreal Engine 5.7'
  },
  {
    id: '準備中',
    file: 'package_04.glb',
    name: 'xxx',
    description: 'xxx',
    genre: 'xxx',
    playtime: 'xxx',
    devtime: 'xxx',
    tools: 'Unreal Engine 5.7'
  },
  {
    id: '制作中',
    file: 'package_05.glb',
    name: 'xxx',
    description: 'xxx',
    genre: 'ホラー',
    playtime: '3-4時間',
    devtime: '6ヶ月想定',
    tools: 'Unreal Engine 5.7,Blender'
  }
];

// PS2風サウンドマネージャー（変更なし）
class PS2SoundManager {
  constructor() {
    this.enabled = CONFIG.PERFORMANCE.enableSound;
    if (this.enabled) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.3;
      } catch (e) {
        console.warn('オーディオコンテキスト初期化失敗:', e);
        this.enabled = false;
      }
    }
  }
  
  playBootSound() {
    if (!this.enabled) return;
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      osc.frequency.value = 100;
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
      
      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.8);
    } catch (e) {
      console.warn('ブートサウンド再生失敗:', e);
    }
  }
  
  playClick() {
    if (!this.enabled || !this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.frequency.value = 800;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }
  
  playSelect() {
    if (!this.enabled || !this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.frequency.value = 400;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  playError() {
    if (!this.enabled || !this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);
  }
}

// PS2風パーティクルシステム（変更なし）
class PS2ParticleSystem {
  constructor(container) {
    this.container = container;
    this.particles = [];
    this.active = CONFIG.PERFORMANCE.particleEffects;
  }
  
  createBurst(position, color = 0xc5a880, count = 12) {
    if (!this.active) return;
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${position.x}px`;
      particle.style.top = `${position.y}px`;
      particle.style.background = `radial-gradient(circle, #${color.toString(16)} 0%, transparent 70%)`;
      
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 3 + Math.random() * 4;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      this.container.appendChild(particle);
      this.animateParticle(particle, vx, vy);
    }
  }
  
  animateParticle(particle, vx, vy) {
    let x = parseFloat(particle.style.left);
    let y = parseFloat(particle.style.top);
    let opacity = 1;
    let scale = 1;
    
    const animate = () => {
      x += vx;
      y += vy;
      opacity -= 0.02;
      scale -= 0.015;
      
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.opacity = opacity;
      particle.style.transform = `scale(${scale})`;
      
      if (opacity > 0 && scale > 0) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }
}

class PS2Portfolio {
  constructor() {
    console.log('🚀 PS2Portfolio初期化開始');
    
    this.gameSceneInitialized = false;
    this.sideNavWidth = 260;
    this.isLoadingComplete = false;
    this.isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.isAnimating = false;
    this.selectedObject = null;
    this.hoveredObject = null;
    this.currentKeyboardIndex = 0;
    this.sectionTransitioning = false;
    
    this.models = [];
    this.gamePackages = [];
    this.assets = []; // assets.jsonデータ格納
    this.portfolio = []; // portfolio.jsonデータ格納
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.gltfLoader = null;
    this.composer = null;
    this.chromaticPass = null;
    
    this.originalCameraPos = new THREE.Vector3(6, 2.5, 5);
    this.originalCameraRotation = new THREE.Euler();
    this.cameraShakeOffset = new THREE.Vector3();
    this.cameraNoise = new THREE.Vector3();
    
    this.resourcesToLoad = 0;
    this.resourcesLoaded = 0;
    
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.soundManager = new PS2SoundManager();
    this.particleSystem = new PS2ParticleSystem(
      document.getElementById('particle-layer')
    );
    
    this.init();
  }
  
  async init() {
    try {
      this.setupLoading();
      this.prepareGameData();
      this.setupNavigation();
      this.setupEffects();
      this.setupAccessibility();
      this.setupFPSCounter();
      this.setupDebugTools();
      this.setupSectionTransition();
      this.setupSystemInfo();
      
      // JSONデータの読み込みを追加
      await this.loadAllData();
      
      const initialActiveTab = document.querySelector('.nav-tab.active-tab');
      if (initialActiveTab?.dataset.target === 'game-dev') {
        if (!this.gameSceneInitialized) {
          console.log('🎮 初期ロードでgame-devを検出。3Dシーンを開始します。');
          await this.initGameScene();
          this.gameSceneInitialized = true;
        }
      }
      
      // 初期アクティブセクションの内容をレンダリング
      this.renderCurrentSection();
      
    } catch (error) {
      console.error('❌ 初期化中にエラーが発生しました:', error);
      this.showError('初期化エラー', error.message);
    }
  }
  
  // すべてのJSONデータを読み込む
  async loadAllData() {
    const stage = document.getElementById('loading-stage');
    const status = document.getElementById('loading-status');
    
    if (stage) stage.textContent = 'Loading data files...';
    
    // 並行してJSONデータを読み込む
    const [assetsResult, portfolioResult] = await Promise.allSettled([
      this.loadAssets(),
      this.loadPortfolio()
    ]);
    
    if (assetsResult.status === 'fulfilled') {
      this.assets = assetsResult.value;
      console.log(`📦 ${this.assets.length}個のアセットデータを読み込みました`);
    } else {
      console.warn('⚠️ assets.jsonの読み込みに失敗しました:', assetsResult.reason);
      this.assets = [];
    }
    
    if (portfolioResult.status === 'fulfilled') {
      this.portfolio = portfolioResult.value;
      console.log(`📝 ${this.portfolio.length}個のポートフォリオデータを読み込みました`);
    } else {
      console.warn('⚠️ portfolio.jsonの読み込みに失敗しました:', portfolioResult.reason);
      this.portfolio = [];
    }
    
    // リソースカウンターを更新（既存の3Dモデル読み込みに加えて）
    this.resourcesToLoad += 2; // 2つのJSONファイル
    this.resourceLoaded('assets.json');
    this.resourceLoaded('portfolio.json');
  }
  
  // assets.jsonを読み込む
  async loadAssets() {
    try {
      const response = await fetch('./assets.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.warn('assets.json読み込みエラー:', error);
      return [];
    }
  }
  
  // portfolio.jsonを読み込む
  async loadPortfolio() {
    try {
      const response = await fetch('./portfolio.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.warn('portfolio.json読み込みエラー:', error);
      return [];
    }
  }
  
  // 現在アクティブなセクションをレンダリング
  renderCurrentSection() {
    const activeTab = document.querySelector('.nav-tab.active-tab');
    if (!activeTab) return;
    
    const targetId = activeTab.dataset.target;
    if (targetId === 'assets' && this.assets.length > 0) {
      this.renderAssets();
    } else if (targetId === 'portfolio' && this.portfolio.length > 0) {
      this.renderPortfolio();
    }
  }
  
  // アセットグリッドをレンダリング
  renderAssets() {
    const container = document.getElementById('asset-grid');
    if (!container || container.children.length > 0) return; // 既にレンダリング済み
    
    console.log('🎨 アセットグリッドをレンダリング開始');
    
    if (this.assets.length === 0) {
      container.innerHTML = `
        <div class="error-notification" style="position: static; margin: 40px auto; max-width: 600px;">
          <h3>データ読み込みエラー</h3>
          <p>販売アセットのデータが見つかりません。</p>
        </div>
      `;
      return;
    }
    
    this.assets.forEach((asset, index) => {
      const card = document.createElement('div');
      card.className = 'asset-card-modern';
      card.innerHTML = `
        <div class="asset-image-container">
          <img src="${asset.image}" alt="${asset.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmEyNzI1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM3YTc1NzEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='">
          ${asset.badge ? `<span class="asset-badge ${asset.badge === '人気' ? 'popular' : ''}">${asset.badge}</span>` : ''}
        </div>
        <div class="asset-content">
          <h3 class="ps2-text">${asset.title}</h3>
          <p class="asset-description ps2-text">${asset.description}</p>
          <div class="asset-meta">
            <span>ポリゴン: ${asset.polycount}</span>
            <span>対応: ${asset.software}</span>
          </div>
        </div>
        <div class="asset-footer">
          <span class="asset-price ps2-text">${asset.price}</span>
          <button class="btn" data-link="${asset.link}">詳細を見る</button>
        </div>
      `;
      
      // 画像読み込みエラーハンドリング
      const img = card.querySelector('img');
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmEyNzI1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM3YTc1NzEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
      });
      
      // ボタンクリックイベント
      const button = card.querySelector('.btn');
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.soundManager.playClick();
        this.particleSystem.createBurst({ x: e.clientX, y: e.clientY }, 0xc5a880);
        setTimeout(() => {
          window.open(asset.link, '_blank');
        }, 200);
      });
      
      container.appendChild(card);
    });
    
    console.log('✅ アセットグリッドレンダリング完了');
  }
  
  // ポートフォリオグリッドをレンダリング
  renderPortfolio() {
    const container = document.getElementById('portfolio-grid');
    if (!container || container.children.length > 0) return; // 既にレンダリング済み
    
    console.log('📝 ポートフォリオグリッドをレンダリング開始');
    
    if (this.portfolio.length === 0) {
      container.innerHTML = `
        <div class="error-notification" style="position: static; margin: 40px auto; max-width: 600px;">
          <h3>データ読み込みエラー</h3>
          <p>制作記録のデータが見つかりません。</p>
        </div>
      `;
      return;
    }
    
    this.portfolio.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'portfolio-card';
      card.innerHTML = `
        <div class="portfolio-image">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmEyNzI1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM3YTc1NzEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='">
          <div class="portfolio-date ps2-text">${item.date}</div>
        </div>
        <div class="portfolio-info">
          <div class="portfolio-header">
            <h3 class="ps2-text">${item.title}</h3>
            <span class="blender-version ps2-text">${item.blenderVersion}</span>
          </div>
          <p class="portfolio-description ps2-text">${item.description}</p>
          <div class="portfolio-tags" id="tags-${index}"></div>
        </div>
      `;
      
      // 画像読み込みエラーハンドリング
      const img = card.querySelector('img');
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmEyNzI1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM3YTc1NzEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
      });
      
      // タグを生成
      const tagsContainer = card.querySelector(`#tags-${index}`);
      item.tags.forEach(tagText => {
        const tag = document.createElement('span');
        tag.className = 'tag ps2-text';
        tag.textContent = tagText;
        tag.addEventListener('click', () => {
          this.soundManager.playClick();
          this.showMemoryCardAccess(`Tag filter: ${tagText}`);
          setTimeout(() => this.hideMemoryCardAccess(), 1500);
        });
        tagsContainer.appendChild(tag);
      });
      
      // カードクリックイベント
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) return; // タグクリック時は無効
        this.soundManager.playSelect();
        this.particleSystem.createBurst({ x: e.clientX, y: e.clientY }, 0xc5a880);
        this.showPortfolioDetail(item);
      });
      
      container.appendChild(card);
    });
    
    console.log('✅ ポートフォリオグリッドレンダリング完了');
  }
  
  // ポートフォリオ詳細表示（ゲーム説明オーバーレイを流用）
  showPortfolioDetail(item) {
    const overlay = document.getElementById('game-desc-overlay');
    const title = document.getElementById('game-title');
    const description = document.getElementById('game-description');
    const genre = document.getElementById('game-genre');
    const playtime = document.getElementById('game-playtime');
    const devtime = document.getElementById('game-devtime');
    const tools = document.getElementById('game-tools');
    
    title.textContent = item.title;
    description.textContent = item.description;
    genre.textContent = item.tags.join(', ');
    playtime.textContent = '-';
    devtime.textContent = item.date;
    tools.textContent = item.blenderVersion;
    
    gsap.set('.description-window', { opacity: 1, x: 0 });
    overlay.classList.add('visible');
    
    gsap.from('.description-window', {
      x: 150,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.1
    });
  }
  
  showError(title, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
      <h3>${title}</h3>
      <p>${message}</p>
      <button onclick="this.parentElement.remove()">閉じる</button>
    `;
    document.body.appendChild(errorDiv);
    this.soundManager.playError();
    setTimeout(() => errorDiv.remove(), 5000);
  }
  
  getModelUrl(filename) {
    if (CONFIG.USE_ABSOLUTE_PATH) {
      return `${window.location.origin}${CONFIG.MODELS_PATH}${filename}`;
    }
    return `${CONFIG.MODELS_PATH}${filename}`;
  }
  
  prepareGameData() {
    const stage = document.getElementById('loading-stage');
    const status = document.getElementById('loading-status');
    if (stage) stage.textContent = 'Checking system...';
    if (status) status.textContent = 'Preparing game data...';
    
    this.models = DEFAULT_GAME_DATA.map(game => ({
      ...game,
      url: this.getModelUrl(game.file)
    }));
    
    this.resourcesToLoad = this.models.length + 3; // 3Dモデル + HDRI + Scene + Light
    this.resourcesLoaded = 0;
    
    if (CONFIG.DEBUG_MODE) {
      console.log('📋 ゲームデータ準備完了:');
      console.table(this.models);
    }
  }
  
  setupLoading() {
    console.log('⏳ ローディング画面セットアップ');
    const loadingBar = document.querySelector('.loading-bar');
    const stage = document.getElementById('loading-stage');
    
    setTimeout(() => {
      this.soundManager.playBootSound();
    }, 500);
    
    this.completeLoading = () => {
      if (this.isLoadingComplete) return;
      this.isLoadingComplete = true;
      
      if (loadingBar) loadingBar.style.width = '100%';
      if (stage) stage.textContent = 'Load complete. Starting system...';
      const loadingStatus = document.getElementById('loading-status');
      if (loadingStatus) loadingStatus.textContent = 'All resources loaded successfully';
      
      console.log('🎉 すべてのリソース読み込み完了');
      
      setTimeout(() => {
        document.getElementById('loading-screen')?.classList.add('hidden');
        this.startVHSNoiseAnimation();
      }, 1200);
    };
  }
  
  resourceLoaded(resourceName) {
    if (this.isLoadingComplete) return;
    this.resourcesLoaded++;
    const progress = (this.resourcesLoaded / Math.max(1, this.resourcesToLoad)) * 100;
    
    const loadingBar = document.querySelector('.loading-bar');
    const loadingStatus = document.getElementById('loading-status');
    const stage = document.getElementById('loading-stage');
    
    if (loadingBar) loadingBar.style.width = `${progress}%`;
    if (loadingStatus) loadingStatus.textContent = `[${this.resourcesLoaded}/${this.resourcesToLoad}] ${resourceName}`;
    
    if (stage) {
      const stages = [
        'Initializing...',
        'Loading system files...',
        'Configuring graphics...',
        'Loading game packages...',
        'Loading data files...',
        'Finalizing setup...'
      ];
      const stageIndex = Math.floor((this.resourcesLoaded / this.resourcesToLoad) * (stages.length - 1));
      stage.textContent = stages[stageIndex];
    }
    
    console.log(`   ├ [${this.resourcesLoaded}/${this.resourcesToLoad}] ${resourceName}`);
    if (this.resourcesLoaded >= this.resourcesToLoad) this.completeLoading();
  }
  
  setupNavigation() {
    console.log('🧭 ナビゲーションセットアップ');
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        if (tab.classList.contains('active-tab') || this.sectionTransitioning) return;
        
        this.soundManager.playClick();
        this.showSectionTransition();
        
        tabs.forEach(t => {
          t.classList.remove('active-tab');
          t.setAttribute('aria-current', 'false');
        });
        tab.classList.add('active-tab');
        tab.setAttribute('aria-current', 'page');
        
        document.querySelectorAll('.content-section').forEach(section => {
          section.classList.remove('active');
        });
        
        const targetId = tab.dataset.target;
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          setTimeout(() => {
            targetSection.classList.add('active');
            this.hideSectionTransition();
            this.renderCurrentSection(); // セクション切替時にレンダリング
          }, 300);
        }
        
        if (targetId === 'game-dev' && !this.gameSceneInitialized) {
          console.log('🎮 game-devタブが選択されました。3Dシーンを初期化します。');
          this.initGameScene();
          this.gameSceneInitialized = true;
        }
        
        this.updateKeyboardIndicator(targetId);
      });
    });
    
    const closeBtn = document.querySelector('.window-btn.close');
    const minimizeBtn = document.querySelector('.window-btn.minimize');
    const maximizeBtn = document.querySelector('.window-btn.maximize');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.soundManager.playError();
        if (confirm('アプリケーションを終了しますか？')) {
          window.close();
        }
      });
    }
    
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        this.soundManager.playClick();
        this.showMemoryCardAccess('Window minimized');
        setTimeout(() => this.hideMemoryCardAccess(), 1500);
      });
    }
    
    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => {
        this.soundManager.playClick();
        this.showMemoryCardAccess('Window maximized');
        setTimeout(() => this.hideMemoryCardAccess(), 1500);
      });
    }
  }
  
  setupSectionTransition() {
    const indicator = document.getElementById('section-transition');
    if (indicator) {
      indicator.addEventListener('transitionend', () => {
        this.sectionTransitioning = false;
      });
    }
  }
  
  showSectionTransition() {
    this.sectionTransitioning = true;
    const indicator = document.getElementById('section-transition');
    if (indicator) {
      indicator.classList.add('active');
    }
  }
  
  hideSectionTransition() {
    setTimeout(() => {
      const indicator = document.getElementById('section-transition');
      if (indicator) {
        indicator.classList.remove('active');
      }
    }, 200);
  }
  
  updateKeyboardIndicator(section) {
    const indicator = document.getElementById('keyboard-indicator');
    if (section === 'game-dev') {
      indicator.classList.add('visible');
    } else {
      indicator.classList.remove('visible');
    }
  }
  
  setupEffects() {
    console.log('✨ エフェクトセットアップ');
    this.vhsNoiseElement = document.querySelector('.vhs-noise');
  }

  startVHSNoiseAnimation() {
    if (!this.vhsNoiseElement) return;
    setInterval(() => {
      const variation = Math.sin(Date.now() * 0.001) * 0.015 + Math.random() * 0.02;
      this.vhsNoiseElement.style.opacity = `${0.03 + variation}`;
    }, 250);
  }
  
  setupSystemInfo() {
    console.log('💻 システム情報セットアップ');
    const timeElement = document.getElementById('system-time');
    const fpsElement = document.getElementById('system-fps');
    const memElement = document.getElementById('system-mem');
    
    setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ja-JP', { hour12: false });
      if (timeElement) timeElement.textContent = timeStr;
    }, 1000);
    
    setInterval(() => {
      if (memElement) {
        const memUsage = Math.floor(Math.random() * 30 + 70);
        memElement.textContent = `${memUsage}%`;
      }
    }, 3000);
    
    setInterval(() => {
      if (fpsElement) {
        fpsElement.textContent = `${this.fps}`;
      }
    }, 1000);
  }
  
  showMemoryCardAccess(message) {
    // メモリカードアクセス表示（簡易実装）
    const status = document.getElementById('loading-status');
    if (status && this.isLoadingComplete) {
      status.textContent = `Memory Card: ${message}`;
      status.style.display = 'block';
    }
  }
  
  hideMemoryCardAccess() {
    const status = document.getElementById('loading-status');
    if (status && this.isLoadingComplete) {
      status.style.display = 'none';
    }
  }
  
  setupAccessibility() {
    console.log('♿ アクセシビリティセットアップ');
    const closeButton = document.getElementById('close-description');
    const gameDescOverlay = document.getElementById('game-desc-overlay');
    
    const closeOverlay = () => this.deselectGame();
    closeButton?.addEventListener('click', closeOverlay);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.selectedObject) this.deselectGame();
      
      if (e.key === 'ArrowLeft' && this.gamePackages.length > 0) {
        this.currentKeyboardIndex = Math.max(0, this.currentKeyboardIndex - 1);
        this.selectGameByIndex(this.currentKeyboardIndex);
        this.showKeyboardPress('←');
      } else if (e.key === 'ArrowRight' && this.gamePackages.length > 0) {
        this.currentKeyboardIndex = Math.min(this.gamePackages.length - 1, this.currentKeyboardIndex + 1);
        this.selectGameByIndex(this.currentKeyboardIndex);
        this.showKeyboardPress('→');
      }
    });
    
    const canvasContainer = document.getElementById('three-canvas-container');
    if (canvasContainer) {
      canvasContainer.setAttribute('role', 'img');
      canvasContainer.setAttribute('aria-label', '3D卓上ビュー: パッケージをクリックしてください');
    }
  }
  
  showKeyboardPress(key) {
    const indicator = document.querySelector(`.indicator-item[data-key="${key}"]`);
    if (indicator) {
      indicator.classList.add('pressed');
      setTimeout(() => indicator.classList.remove('pressed'), 200);
    }
  }
  
  selectGameByIndex(index) {
    const pkg = this.gamePackages[index];
    if (pkg && !this.isAnimating) {
      this.soundManager.playSelect();
      if (this.selectedObject === pkg) {
        this.deselectGame();
      } else {
        this.selectGame(pkg);
      }
    }
  }
  
  setupFPSCounter() {
    console.log('📊 FPSカウンターセットアップ');
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter && CONFIG.DEBUG_MODE) fpsCounter.classList.add('visible');
  }
  
  setupDebugTools() {
    console.log('🛠️ デバッグツールセットアップ');
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        const fps = document.getElementById('fps-counter');
        fps?.classList.toggle('visible');
      }
      if (e.key === 'F2') {
        console.log('📊 シーン情報:', this.scene);
        console.log('📦 パッケージ:', this.gamePackages);
        console.log('📷 カメラ:', this.camera);
        console.log('📦 アセット:', this.assets);
        console.log('📝 ポートフォリオ:', this.portfolio);
      }
    });
  }
  
  initGLTFLoader() {
    if (!window.THREE) {
      console.error('❌ Three.jsが読み込まれていません！');
      return false;
    }
    if (!THREE.GLTFLoader) {
      console.error('❌ GLTFLoaderが見つかりません！');
      return false;
    }
    this.gltfLoader = new THREE.GLTFLoader();
    console.log('✅ GLTFLoader初期化完了');
    return true;
  }
  
  async loadModel(url, name = '') {
    return new Promise((resolve) => {
      if (!this.gltfLoader) {
        const success = this.initGLTFLoader();
        if (!success) {
          this.resourceLoaded(`✗ ${name} (Loader無)`);
          resolve({ model: this.createDebugPackage(name, 'loader-error'), isFallback: true });
          return;
        }
      }
      
      if (!url || url === 'null' || url === 'undefined') {
        this.resourceLoaded(`✗ ${name} (URL無)`);
        resolve({ model: this.createDebugPackage(name, 'url-error'), isFallback: true });
        return;
      }
      
      if (CONFIG.DEBUG_MODE) console.log(`📥 ロード開始: ${name}`);
      
      const loadTimeout = setTimeout(() => {
        console.warn(`⏱️ タイムアウト: ${name}`);
        this.resourceLoaded(`✗ ${name} (タイムアウト)`);
        resolve({ model: this.createDebugPackage(name, 'timeout'), isFallback: true });
      }, 20000);
      
      this.gltfLoader.load(
        url,
        (gltf) => {
          clearTimeout(loadTimeout);
          console.log(`✅ ロード成功: ${name}`);
          
          let animShapeKeyIndex = -1;
          
          gltf.scene.traverse(node => {
            this.setupPS2Material(node);
            
            if (node.isMesh && node.morphTargetDictionary && node.morphTargetDictionary['Open'] !== undefined) {
                console.log(`   └ 🔑 シェイプキー "Open" を発見: ${name}`);
                animShapeKeyIndex = node.morphTargetDictionary['Open'];
                if (node.morphTargetInfluences) {
                    node.morphTargetInfluences.fill(0);
                }
            }
          });
          
          gltf.scene.userData.animShapeKeyIndex = animShapeKeyIndex;
          
          this.resourceLoaded(`✓ ${name}`);
          resolve({ model: gltf.scene, isFallback: false });
        },
        (progress) => {
          if (CONFIG.DEBUG_MODE && progress.total > 0) {
            const percent = Math.floor(progress.loaded / progress.total * 100);
            const status = document.getElementById('loading-status');
            if (status) status.textContent = `${percent}% ${name}`;
            console.log(`   └ ${name}: ${percent}%`);
          }
        },
        (error) => {
          clearTimeout(loadTimeout);
          console.error(`❌ ロード失敗: ${name}`, error);
          this.resourceLoaded(`✗ ${name} (ロード失敗)`);
          resolve({ model: this.createDebugPackage(name, 'load-error'), isFallback: true });
        }
      );
    });
  }
  
  createDebugPackage(name = '', errorType = '') {
    const geo = new THREE.BoxGeometry(0.8, 1.2, 0.2);
    const colors = {
      'load-error': 0xFF4444,
      'timeout': 0xFF8844,
      'url-error': 0x8844FF,
      'loader-error': 0xFF44FF,
      'default': 0x444444
    };
    const mat = new THREE.MeshLambertMaterial({ 
      color: colors[errorType] || colors.default,
      emissive: colors[errorType] || 0x222222,
      emissiveIntensity: 0.2
    });
    const pkg = new THREE.Mesh(geo, mat);
    pkg.castShadow = true;
    pkg.receiveShadow = true;
    pkg.name = `${name}_${errorType}`;
    return pkg;
  }
  
  setupPS2Material(node) {
    if (!node.isMesh || !node.material) return;
    const originalMat = node.material;
    const ps2Mat = new THREE.MeshLambertMaterial({
      map: originalMat.map || null,
      color: originalMat.color || 0xffffff,
      transparent: originalMat.transparent || false,
      opacity: originalMat.opacity || 1.0,
      side: originalMat.side || THREE.FrontSide
    });
    node.material = ps2Mat;
    node.castShadow = true;
    node.receiveShadow = true;
    
    if (this.isMobile && node.geometry && THREE.BufferGeometryUtils) {
      try {
        node.geometry = THREE.BufferGeometryUtils.mergeVertices(node.geometry);
        node.geometry.computeVertexNormals();
      } catch (e) {
        console.warn('メッシュ最適化失敗:', e);
      }
    }
  }
  
  async initGameScene() {
    const container = document.getElementById('three-canvas-container');
    if (!container) {
      console.error('❌ コンテナ#three-canvas-containerが見つかりません');
      return;
    }

    try {
      console.log('🎬 3Dシーン初期化開始');
      
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: false, 
        powerPreference: 'high-performance',
        alpha: false
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.PERFORMANCE.pixelRatio));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);
      console.log('   ├ レンダラー初期化完了 (高解像度設定)');
      
      this.scene = new THREE.Scene();
      console.log('   ├ シーン作成完了');
      
      const width = Math.max(1, window.innerWidth - this.sideNavWidth);
      const height = Math.max(1, window.innerHeight);
      this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      this.camera.position.copy(this.originalCameraPos);
      this.camera.lookAt(-1.5, 0, -1);
      this.originalCameraRotation.copy(this.camera.rotation);
      console.log('   ├ カメラ設定完了');
      
      this.initGLTFLoader();
      await this.loadHDRI();
      await this.loadScene();
      await this.loadLights();
      this.setupLighting();
      
      this.setupPostProcessing();
      console.log('   ├ ポストプロセス設定完了');
      
      await this.loadAndArrangePackages();
      this.setupInteraction();
      console.log('   ├ インタラクション設定完了');
      
      window.addEventListener('resize', () => this.onWindowResize());
      this.animate();
      
      console.log('🎉 3Dシーン完全初期化完了');
      
    } catch (error) {
      console.error('💥 致命的エラー:', error);
      this.showError('3Dシーン初期化失敗', error.message);
    }
  }
  
  setupPostProcessing() {
    if (!CONFIG.POST_PROCESSING) {
      console.warn('⚠️ ポストプロセス設定無効');
      return;
    }
    
    this.composer = new THREE.EffectComposer(this.renderer);
    
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    if (CONFIG.POST_PROCESSING.vignetteEnabled) {
      this.vignettePass = this.createVignettePass();
      this.composer.addPass(this.vignettePass);
    }
    
    if (CONFIG.POST_PROCESSING.noiseEnabled) {
      this.ps2NoisePass = this.createPS2NoisePass();
      this.composer.addPass(this.ps2NoisePass);
    }
    
    if (CONFIG.POST_PROCESSING.chromaticAberration) {
      this.chromaticPass = this.createChromaticAberrationPass();
      this.composer.addPass(this.chromaticPass);
    }
    
    if (CONFIG.POST_PROCESSING.fogEnabled) {
      this.scene.fog = new THREE.Fog(0x222222, 5, 25);
      console.log('   └ 深度フォグ有効');
    }
    
    if (CONFIG.POST_PROCESSING.pixelateEnabled) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    }
  }
  
  createChromaticAberrationPass() {
    const chromaticShader = {
      uniforms: {
        tDiffuse: { value: null },
        offset: { value: 0.003 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float offset;
        varying vec2 vUv;
        
        void main() {
          vec4 red = texture2D(tDiffuse, vUv + vec2(offset, 0));
          vec4 green = texture2D(tDiffuse, vUv);
          vec4 blue = texture2D(tDiffuse, vUv - vec2(offset, 0));
          gl_FragColor = vec4(red.r, green.g, blue.b, 1.0);
        }
      `
    };
    return new THREE.ShaderPass(chromaticShader);
  }
  
  createVignettePass() {
    const vignetteShader = {
      uniforms: {
        tDiffuse: { value: null },
        offset: { value: 1.2 },
        darkness: { value: 1.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float offset;
        uniform float darkness;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
          color.rgb *= 1.0 - darkness * length(uv);
          gl_FragColor = color;
        }
      `
    };
    return new THREE.ShaderPass(vignetteShader);
  }
  
  createPS2NoisePass() {
    const ps2NoiseShader = {
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        varying vec2 vUv;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float noise = random(vUv * 100.0 + time * 0.1) * 0.03;
          color.rgb += noise;
          color.rgb = floor(color.rgb * 16.0) / 16.0;
          gl_FragColor = color;
        }
      `
    };
    return new THREE.ShaderPass(ps2NoiseShader);
  }
  
  setupInteraction() {
    const canvas = this.renderer.domElement;
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('click', (e) => this.onClick(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    console.log('   └ マウスイベントリスナー設定完了');
  }
  
  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    document.body.style.cursor = 'pointer';
    
    const tooltip = document.getElementById('package-tooltip');
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.gamePackages, true);
    
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !this.gamePackages.includes(obj)) {
        obj = obj.parent;
      }
      if (this.gamePackages.includes(obj)) {
        tooltip.querySelector('.tooltip-title').textContent = obj.userData.name;
        tooltip.querySelector('.tooltip-genre').textContent = obj.userData.genre;
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY - 30}px`;
        tooltip.classList.add('visible');
      }
    } else {
      tooltip.classList.remove('visible');
    }
  }
  
  onClick(event) {
    if (this.isAnimating) {
      console.log('⏳ アニメーション中のためクリックを無効化');
      return;
    }
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.gamePackages, true);
    
    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;
      while (clickedObject.parent && !this.gamePackages.includes(clickedObject)) {
        clickedObject = clickedObject.parent;
      }
      
      if (this.gamePackages.includes(clickedObject)) {
        this.currentKeyboardIndex = this.gamePackages.indexOf(clickedObject);
        this.soundManager.playSelect();
        
        const screenPos = {
          x: event.clientX,
          y: event.clientY
        };
        this.particleSystem.createBurst(screenPos, 0xc5a880);
        
        if (this.selectedObject === clickedObject) {
          this.deselectGame();
        } else {
          if (this.selectedObject) {
            this.deselectGame();
            setTimeout(() => this.selectGame(clickedObject), 300);
          } else {
            this.selectGame(clickedObject);
          }
        }
      }
    } else {
      if (this.selectedObject) {
        this.deselectGame();
      }
    }
  }
  
  selectGame(gameObject) {
    this.isAnimating = true;
    this.selectedObject = gameObject;
    
    console.log(`🎯 ゲーム選択開始: ${gameObject.userData.name}`);
    
    if (CONFIG.CAMERA_SHAKE.enabled) {
      CONFIG.CAMERA_SHAKE.trauma = 0.8;
    }
    
    const shapeKeyIndex = gameObject.userData.animShapeKeyIndex;
    if (shapeKeyIndex !== -1) {
        console.log(`   └ 🔑 シェイプキー "Open" (Index: ${shapeKeyIndex}) を再生`);
        gameObject.traverse(node => {
            if (node.isMesh && node.morphTargetInfluences) {
                const proxy = { value: node.morphTargetInfluences[shapeKeyIndex] };
                gsap.to(proxy, {
                    value: 1.0,
                    duration: 0.8,
                    ease: "power2.inOut",
                    onUpdate: () => {
                        node.morphTargetInfluences[shapeKeyIndex] = proxy.value;
                    }
                });
            }
        });
    }
    
    gsap.timeline({
        onComplete: () => {
            this.showDescription(gameObject.userData);
            this.isAnimating = false;
        }
    })
      .to(gameObject.position, {
        y: 0.5,
        duration: 0.8,
        ease: "power2.out"
      }, 0)
      .to(gameObject.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, 0);
    
    this.gamePackages.forEach(pkg => {
      if (pkg !== gameObject) {
        gsap.to(pkg.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 0.6 });
        pkg.traverse(node => {
          if (node.isMesh) {
            gsap.to(node.material, { opacity: 0.2, duration: 0.6 });
          }
        });
      }
    });
  }
  
  deselectGame() {
    if (!this.selectedObject || this.isAnimating) {
      console.log('⚠️ 選択解除スキップ:', { hasObject: !!this.selectedObject, isAnimating: this.isAnimating });
      return;
    }
    
    this.isAnimating = true;
    console.log('✖️ ゲーム選択解除開始');
    
    if (CONFIG.CAMERA_SHAKE.enabled) {
      CONFIG.CAMERA_SHAKE.trauma = 0.5;
    }
    
    const gameObject = this.selectedObject;
    
    const shapeKeyIndex = gameObject.userData.animShapeKeyIndex;
    if (shapeKeyIndex !== -1) {
        console.log(`   └ 🔑 シェイプキー "Open" (Index: ${shapeKeyIndex}) をリセット`);
        gameObject.traverse(node => {
            if (node.isMesh && node.morphTargetInfluences) {
                const proxy = { value: node.morphTargetInfluences[shapeKeyIndex] };
                gsap.to(proxy, {
                    value: 0.0,
                    duration: 0.8,
                    ease: "power2.inOut",
                    onUpdate: () => {
                        node.morphTargetInfluences[shapeKeyIndex] = proxy.value;
                    }
                });
            }
        });
    }
    
    gsap.timeline({
        onComplete: () => {
            this.selectedObject = null;
            this.isAnimating = false;
            console.log('✅ 選択解除完了');
        }
    })
      .to(gameObject.position, {
        y: gameObject.userData.originalPosition.y,
        duration: 0.8,
        ease: "power2.inOut"
      }, 0)
      .to(gameObject.scale, {
        x: 1.0, y: 1.0, z: 1.0,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, 0);
    
    this.gamePackages.forEach(pkg => {
      gsap.to(pkg.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.6 });
      gsap.to(pkg.position, { y: 0.1, duration: 0.6 });
      pkg.traverse(node => {
        if (node.isMesh) {
          gsap.to(node.material, { opacity: 1.0, duration: 0.6 });
        }
      });
    });
    
    this.hideDescription();
  }
  
  showDescription(gameData) {
    console.log('💬 説明ウィンドウ表示:', gameData.name);
    
    const overlay = document.getElementById('game-desc-overlay');
    const title = document.getElementById('game-title');
    const description = document.getElementById('game-description');
    const genre = document.getElementById('game-genre');
    const playtime = document.getElementById('game-playtime');
    const devtime = document.getElementById('game-devtime');
    const tools = document.getElementById('game-tools');
    
    title.textContent = gameData.name;
    description.textContent = gameData.description;
    genre.textContent = gameData.genre;
    playtime.textContent = gameData.playtime;
    devtime.textContent = gameData.devtime;
    tools.textContent = gameData.tools;
    
    gsap.set('.description-window', { opacity: 1, x: 0 });
    overlay.classList.add('visible');
    
    gsap.from('.description-window', {
      x: 150,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.1
    });
  }
  
  hideDescription() {
    console.log('💬 説明ウィンドウ非表示');
    
    const overlay = document.getElementById('game-desc-overlay');
    gsap.to('.description-window', {
      x: 150,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove('visible');
        gsap.set('.description-window', { clearProps: 'x,opacity' });
      }
    });
  }
  
  async loadHDRI() {
    try {
      console.log('   ├ HDRI読み込み開始');
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      
      const exrLoader = new THREE.EXRLoader();
      const exrTexture = await exrLoader.loadAsync(CONFIG.HDRI_PATH);
      const envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
      
      this.scene.environment = envMap;
      this.scene.background = envMap;
      
      exrTexture.dispose();
      pmremGenerator.dispose();
      
      this.resourceLoaded('HDRI環境マップ');
      console.log('   └ HDRI読み込み成功');
    } catch (error) {
      console.warn('   └ HDRI読み込み失敗:', error);
      this.scene.background = new THREE.Color(0x222222);
      this.resourceLoaded('HDRI(フォールバック)');
    }
  }
  
  async loadScene() {
    try {
      console.log('   ├ Scene.glb読み込み開始');
      if (!this.gltfLoader) this.initGLTFLoader();
      
      const gltf = await this.gltfLoader.loadAsync(CONFIG.SCENE_PATH);
      this.sceneModel = gltf.scene;
      this.scene.add(this.sceneModel);
      this.sceneModel.traverse(node => this.setupPS2Material(node));
      
      this.resourceLoaded('Scene.glb(机)');
      console.log('   └ Scene.glb読み込み成功');
    } catch (error) {
      console.warn('   └ Scene.glb読み込み失敗:', error);
      this.createFallbackScene();
      this.resourceLoaded('Scene(フォールバック)');
    }
  }
  
  async loadLights() {
    console.log('💡 light.glbの読み込み開始');
    try {
        if (!this.gltfLoader) this.initGLTFLoader();
        
        const gltf = await this.gltfLoader.loadAsync(CONFIG.LIGHT_PATH || 'light.glb');
        this.scene.add(gltf.scene);
        
        gltf.scene.traverse((object) => {
            if (object.isLight) {
                console.log(`   └💡 light.glb からライトを発見: ${object.type}`);
                
                object.castShadow = true;
                
                object.shadow.mapSize.width = 1024;
                object.shadow.mapSize.height = 1024;
                object.shadow.bias = -0.001;
            }
        });
        
        this.resourceLoaded('light.glb (ライト)');
        console.log('   └ light.glb読み込み成功');
    } catch (error) {
        console.warn('   └ light.glb読み込み失敗:', error);
        this.resourceLoaded('light.glb (フォールバック)');
    }
  }
  
  createFallbackScene() {
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.2, 6),
      new THREE.MeshLambertMaterial({ color: 0x4a3520 })
    );
    desk.position.y = -0.1;
    desk.receiveShadow = true;
    this.scene.add(desk);
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    console.log('   └ 補助ライト(Ambient)設定完了');
  }
  
  async loadAndArrangePackages() {
    console.log('%c📦 パッケージ読み込み開始', 'color: #00AAFF; font-size: 14px; font-weight: bold;');
    
    const spacing = 1.2;
    const totalModels = this.models.length;
    const startX = -((totalModels - 1) * spacing) / 2;
    
    const loadPromises = this.models.map(async (modelData, i) => {
      const x = startX + (i * spacing);
      const result = await this.loadModel(modelData.url, modelData.name);
      
      const model = result.model;
      model.position.set(x, 0.1, 2.0);
      model.rotation.y = Math.PI;
      model.scale.set(1.0, 1.0, 1.0);
      
      model.userData = {
        ...modelData,
        originalPosition: model.position.clone(),
        originalRotation: model.rotation.clone(),
        isFallback: result.isFallback,
        id: modelData.id,
        index: i,
        hoverIntensity: 0,
        animShapeKeyIndex: model.userData.animShapeKeyIndex || -1
      };
      
      this.scene.add(model);
      this.gamePackages.push(model);
      
      if (result.isFallback) {
        model.traverse(node => {
          if (node.isMesh) {
            node.material = new THREE.MeshLambertMaterial({ 
              color: 0xFF00FF,
              emissive: 0x660066
            });
          }
        });
      }
      
      console.log(`   └ ${modelData.name}: ${result.isFallback ? '❌ フォールバック' : '✅ 成功'}`);
    });
    
    await Promise.all(loadPromises);
    console.log('%c✅ 全パッケージ配置完了', 'color: #00FF00; font-size: 14px; font-weight: bold;');
  }
  
  updateCameraShake() {
    if (!CONFIG.CAMERA_SHAKE.enabled) return;
    
    const time = Date.now() * 0.001;
    this.cameraNoise.set(
      Math.sin(time * 5.0) * CONFIG.CAMERA_SHAKE.intensity * (0.3 + Math.random() * 0.2),
      Math.cos(time * 4.3) * CONFIG.CAMERA_SHAKE.intensity * (0.2 + Math.random() * 0.1),
      Math.sin(time * 6.1) * CONFIG.CAMERA_SHAKE.intensity * (0.15 + Math.random() * 0.1)
    );
    
    if (CONFIG.CAMERA_SHAKE.trauma > 0.001) {
      const shake = Math.pow(CONFIG.CAMERA_SHAKE.trauma, 2);
      const traumaOffset = new THREE.Vector3(
        (Math.random() - 0.5) * shake * 0.5,
        (Math.random() - 0.5) * shake * 0.3,
        (Math.random() - 0.5) * shake * 0.2
      );
      this.cameraShakeOffset.copy(this.cameraNoise).add(traumaOffset);
      CONFIG.CAMERA_SHAKE.trauma *= CONFIG.CAMERA_SHAKE.traumaDecay;
    } else {
      this.cameraShakeOffset.copy(this.cameraNoise);
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    const currentTime = performance.now();
    
    if (!this.isLoadingComplete) return;
    if (document.hidden) return;
    
    this.frameCount++;
    if (this.frameCount % CONFIG.PERFORMANCE.frameSkip !== 0 && !this.selectedObject) {
      if (this.composer) {
        this.composer.render();
      } else if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      return;
    }
    
    const deltaTime = currentTime - this.lastTime;
    if (deltaTime >= 1000) {
      this.fps = Math.floor(this.frameCount / (deltaTime / 1000));
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      const fpsCounter = document.getElementById('fps-counter');
      if (fpsCounter?.classList.contains('visible')) {
        fpsCounter.textContent = `FPS: ${this.fps}`;
      }
    }
    
    if (!this.isAnimating) {
        this.updateHoverEffects();
    }

    if (!this.selectedObject && CONFIG.AUTO_ROTATION.enabled) {
        this.gamePackages.forEach((pkg, i) => {
            pkg.rotation.y += 0.016 * CONFIG.AUTO_ROTATION.speed / 60;
        });
    }
    
    this.gamePackages.forEach(pkg => {
        pkg.lookAt(this.camera.position);
    });
    
    this.updateCameraShake();
    this.camera.position.copy(this.originalCameraPos).add(this.cameraShakeOffset);
    
    if (this.ps2NoisePass) {
      this.ps2NoisePass.uniforms.time.value = currentTime * 0.001;
    }
    
    if (this.composer) {
      this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  updateHoverEffects() {
    if (this.isAnimating || this.selectedObject) {
      if (this.hoveredObject) {
        this.hoveredObject.traverse(node => {
          if (node.isMesh && node.material.emissive) {
            gsap.to(node.material, { emissiveIntensity: 0.0, duration: 0.3 });
          }
        });
        this.hoveredObject = null;
      }
      return;
    }
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.gamePackages, true);
    
    let currentHover = null;
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !this.gamePackages.includes(obj)) {
        obj = obj.parent;
      }
      if (this.gamePackages.includes(obj)) {
        currentHover = obj;
      }
    }

    this.gamePackages.forEach(pkg => {
      if (pkg !== currentHover && pkg.userData.hoverIntensity !== 0) {
        pkg.userData.hoverIntensity = 0;
        pkg.traverse(node => {
          if (node.isMesh && node.material.emissive) {
            gsap.to(node.material, { emissiveIntensity: 0.0, duration: 0.3 });
          }
        });
      }
    });

    if (currentHover && currentHover.userData.hoverIntensity === 0) {
      currentHover.userData.hoverIntensity = 1;
      this.hoveredObject = currentHover;
      currentHover.traverse(node => {
        if (node.isMesh && node.material.emissive) {
          gsap.to(node.material, { emissiveIntensity: 0.3, duration: 0.3 });
        }
      });
    }
  }
  
  onWindowResize() {
    if (!this.renderer || !this.camera) return;
    
    const width = Math.max(1, window.innerWidth - this.sideNavWidth);
    const height = Math.max(1, window.innerHeight);
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM読み込み完了');
  
  if (!window.THREE) {
    console.error('❌ Three.jsが読み込まれていません！');
    return;
  }
  if (window.location.protocol === 'file:') {
    console.error('❌ ファイルプロトコル(file://)では動作しません！');
    return;
  }
  
  try {
    window.ps2Portfolio = new PS2Portfolio();
    console.log('🎮 アプリケーション初期化完了');
  } catch (error) {
    console.error('💥 アプリケーション初期化失敗:', error);
  }
});