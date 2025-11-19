// =============================================================================
// PS2ポートフォリオサイト - 完全版 script.js (最終修正版)
// =============================================================================

// =============================================================================
// 設定オブジェクト - ここを環境に合わせて編集してください
// =============================================================================
const CONFIG = {
  // ★★★ ファイルパス設定（環境に合わせて変更）★★★
  CAT_PATH: './models/cat.glb',
  MODELS_PATH: './models/',
  SCENE_PATH: './models/Scene.glb',
  LIGHT_PATH: './models/light.glb',
  HDRI_PATH: './hdr.avif',

  // 機能設定
  USE_ABSOLUTE_PATH: false,
  DEBUG_MODE: true,

  // カメラシェイク設定
  CAMERA_SHAKE: {
    enabled: true,
    intensity: 0.08,
    frequency: 0.15,
    trauma: 0,
    traumaDecay: 0.8
  },

  // ポストプロセス設定
  POST_PROCESSING: {
    fogEnabled: true,
    vignetteEnabled: true,
    noiseEnabled: true,
    pixelateEnabled: false,
    chromaticAberration: true
  },

  // 自動回転設定
  AUTO_ROTATION: {
    enabled: true,
    speed: 0.5
  },

  // パフォーマンス設定
  PERFORMANCE: {
    frameSkip: 1,
    enableSound: true,
    particleEffects: true,
    pixelRatio: 2.0
  }
};

// =============================================================================
// PS2風サウンドマネージャー
// =============================================================================
class PS2SoundManager {
  constructor() {
    this.enabled = CONFIG.PERFORMANCE.enableSound;
    this.audioContext = null;
    this.masterGain = null;
  }

  init() {
    if (!this.enabled || this.audioContext) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;
      console.log('✅ AudioContext 初期化完了');
    } catch (e) {
      console.warn('オーディオコンテキスト初期化失敗:', e);
      this.enabled = false;
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state !== 'running') {
      this.audioContext.resume().then(() => {
        console.log('✅ AudioContext 再開');
      });
    }
  }

  playBootSound() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
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
    this.resume();
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
    this.resume();
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
    this.resume();
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

// =============================================================================
// PS2風パーティクルシステム
// =============================================================================
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

// =============================================================================
// メインポートフォリオクラス
// =============================================================================
class PS2Portfolio {
  constructor() {
    console.log('🚀 PS2Portfolio初期化開始');

    this.gameSceneInitialized = false;
    this.desktopNavWidth = 260;
    this.mobileHeaderHeight = 100;

    const isMobile = (window.innerWidth <= 1024);
    this.sideNavWidth = isMobile ? 0 : this.desktopNavWidth;

    this.isLoadingComplete = false;
    this.isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.isAnimating = false;
    this.selectedObject = null;
    this.hoveredObject = null;
    this.currentKeyboardIndex = 0;
    this.sectionTransitioning = false;

    this.models = [];
    this.gamePackages = [];
    this.assets = [];
    this.portfolio = [];

    this.catMixer = null;
    this.catModel = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.gltfLoader = null;
    this.composer = null;
    this.chromaticPass = null;
    this.mouseLight = null;
    this.targetMouseLightIntensity = 0;

    this.desktopCameraPos = new THREE.Vector3(6, 2.5, 5);
    this.desktopLookAt = new THREE.Vector3(-1.5, 0, -1);

    this.mobileCameraPos = new THREE.Vector3(6, 1.8, 5);
    this.mobileLookAt = new THREE.Vector3(-2.5, 0, -0.5);

    this.activeCameraPos = isMobile ? this.mobileCameraPos.clone() : this.desktopCameraPos.clone();
    this.activeLookAt = isMobile ? this.mobileLookAt.clone() : this.desktopLookAt.clone();

    this.originalCameraRotation = new THREE.Euler();
    this.cameraShakeOffset = new THREE.Vector3();
    this.cameraNoise = new THREE.Vector3();

    this.resourcesToLoad = 0;
    this.resourcesLoaded = 0;

    this.frameCount = 0;
    this.lastTime = performance.now();
    this.lastFpsTime = performance.now();
    this.lastRenderTime = performance.now(); // 60fps制限用
    this.fps = 0;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.clock = new THREE.Clock();
    this.mixers = [];

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

      await this.loadAllData();

      // ★ 修正: ロード完了後、クリック待ちメッセージを表示し、イベントリスナーを設定
      const loadingText = document.querySelector('.loading-text');
      if (loadingText) loadingText.textContent = 'Load complete.';

      const startApp = async () => {
        this.soundManager.init();
        this.soundManager.playBootSound();

        const initialActiveTab = document.querySelector('.nav-tab.active-tab');
        if (initialActiveTab?.dataset.target === 'game-dev' && !this.gameSceneInitialized) {
          await this.initGameScene();
          this.gameSceneInitialized = true;
        }

        this.renderCurrentSection();
        this.startVHSNoiseAnimation();

        setTimeout(() => {
          document.getElementById('loading-screen')?.classList.add('hidden');
        }, 500);
      };

      // 自動的に開始
      startApp();

    } catch (error) {
      console.error('❌ 初期化中にエラーが発生しました:', error);
      this.showError('初期化エラー', error.message);
    }
  }

  async loadAllData() {
    const stage = document.getElementById('loading-stage');

    if (stage) stage.textContent = 'Loading data files...';

    const [assetsResult, portfolioResult] = await Promise.allSettled([
      this.loadAssets(),
      this.loadPortfolio()
    ]);

    if (assetsResult.status === 'fulfilled') {
      this.assets = assetsResult.value;
    } else {
      this.assets = [];
    }

    if (portfolioResult.status === 'fulfilled') {
      this.portfolio = portfolioResult.value;
    } else {
      this.portfolio = [];
    }

    this.resourcesToLoad += 2;
    this.resourceLoaded('assets.json');
    this.resourceLoaded('portfolio.json');

    this.isLoadingComplete = true;
  }

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

  renderAssets() {
    const container = document.getElementById('asset-grid');
    if (!container || container.children.length > 0) return;

    const bgLayer = document.getElementById('layer-asset-bg');
    const imgNormal = bgLayer ? bgLayer.querySelector('.bg-image.normal') : null;
    const imgWire = bgLayer ? bgLayer.querySelector('.bg-image.wireframe') : null;

    console.log('🎨 renderAssets開始');

    let hoverTimer = null;

    if (this.assets.length === 0) {
      container.innerHTML = `<div class="error-notification" style="position: static; margin: 40px auto;"><h3>データ読み込みエラー</h3><p>データがありません。</p></div>`;
      return;
    }

    this.assets.forEach((asset) => {
      const card = document.createElement('div');
      card.className = 'asset-card-modern';

      const links = asset.links || (asset.link ? [{ label: '詳細を見る', url: asset.link }] : []);
      let buttonsHtml = links.length > 0
        ? `<div class="asset-links-container"><div class="split-btn-trigger">詳細を見る</div><div class="split-btn-menu">${links.map(l => `<a href="${l.url}" target="_blank" class="shop-link-item">${l.label}</a>`).join('')}</div></div>`
        : `<button class="btn" disabled>準備中</button>`;

      card.innerHTML = `
        <div class="asset-image-container">
          <img src="${asset.image}" alt="${asset.title}">
          ${asset.badge ? `<span class="asset-badge ${asset.badge === '人気' ? 'popular' : ''}">${asset.badge}</span>` : ''}
        </div>
        <div class="asset-content">
          <h3 class="ps2-text">${asset.title}</h3>
          <p class="asset-description ps2-text">${asset.description}</p>
          <div class="asset-meta">
            <span>${asset.polycount}</span>
            <span>${asset.software}</span>
          </div>
        </div>
        <div class="asset-footer">
          <span class="asset-price ps2-text">${asset.price}</span>
          ${buttonsHtml}
        </div>
      `;

      card.querySelector('img').onerror = function () {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PC9zdmc+';
      };

      if (bgLayer && imgNormal && imgWire) {
        card.addEventListener('mouseenter', () => {
          const normalSrc = asset.image;
          const wireSrc = asset.wireframe_image || asset.image;

          imgNormal.style.backgroundImage = `url('${normalSrc}')`;
          imgWire.style.backgroundImage = `url('${wireSrc}')`;

          bgLayer.classList.add('active');
          bgLayer.setAttribute('data-mode', 'normal');

          if (hoverTimer) clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => {
            bgLayer.setAttribute('data-mode', 'wireframe');
            this.soundManager.playSelect();
          }, 1000);
        });

        card.addEventListener('mouseleave', () => {
          if (hoverTimer) clearTimeout(hoverTimer);

          bgLayer.classList.remove('active');

          setTimeout(() => {
            bgLayer.setAttribute('data-mode', 'normal');
          }, 500);
        });
      }

      const btn = card.querySelector('.asset-links-container');
      if (btn) btn.addEventListener('mouseenter', () => this.soundManager.playSelect());

      container.appendChild(card);
    });

    console.log('✅ アセットグリッド描画完了');
  }

  renderPortfolio() {
    const container = document.getElementById('portfolio-grid');
    if (!container || container.children.length > 0) return;

    console.log('📝 ポートフォリオグリッドをレンダリング開始');

    if (this.portfolio.length === 0) {
      container.innerHTML = `<div class="error-notification" style="position: static; margin: 40px auto; max-width: 600px;"><h3>データ読み込みエラー</h3><p>制作記録のデータが見つかりません。</p></div>`;
      return;
    }

    this.portfolio.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'portfolio-card';
      card.innerHTML = `
        <div class="portfolio-image">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmEyNzI1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM3YTc1NzEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';>
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

      const img = card.querySelector('img');
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmEyNzI1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM3YTc1NzEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L2RldHh0Pjwvc3ZnPg==';
      });

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

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) return;
        this.soundManager.playSelect();
        this.particleSystem.createBurst({ x: e.clientX, y: e.clientY }, 0xc5a880);
        this.showPortfolioDetail(item);
      });

      container.appendChild(card);
    });

    console.log('✅ ポートフォリオグリッドレンダリング完了');
  }

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

    const DEFAULT_GAME_DATA = [
      {
        id: '未制作',
        file: 'package_01.glb',
        name: 'xxx',
        description: 'xxx',
        genre: 'xxx',
        playtime: 'xxx',
        devtime: 'xxx',
        tools: 'Unreal Engine 5.7'
      },
      {
        id: '未制作',
        file: 'package_02.glb',
        name: 'xxx',
        description: 'xxx',
        genre: 'xxx',
        playtime: 'xxx',
        devtime: 'xxx',
        tools: 'Unreal Engine 5.7'
      },
      {
        id: '未制作',
        file: 'package_03.glb',
        name: 'xxx',
        description: '3xxx',
        genre: 'xxx',
        playtime: 'xxx',
        devtime: 'xxx',
        tools: 'Unreal Engine 5.7'
      },
      {
        id: '未制作',
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
        name: '山奥ダム',
        description: '2045年、山奥のダム。 人口減少により麓の村は廃村と化し、管理員である主人公は完全な孤独の中にいた。 助けを呼んでも、誰も来ない。ここを訪れるのは野生のクマと、巣を張る蜘蛛だけのはずだった。 ――あの出来事までは。',
        genre: 'ホラー',
        playtime: '5時間程度で完結する規模感',
        devtime: '2026年5月から開発予定',
        tools: 'Unreal Engine 5.7'
      }
    ];

    this.models = DEFAULT_GAME_DATA.map(game => ({
      ...game,
      url: this.getModelUrl(game.file)
    }));

    this.resourcesToLoad = this.models.length + 4;
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

    this.completeLoading = () => {
      if (loadingBar) loadingBar.style.width = '100%';
      if (stage) stage.textContent = 'Load complete.'; // メッセージを簡略化
      const loadingStatus = document.getElementById('loading-status');
      if (loadingStatus) loadingStatus.textContent = 'All resources loaded successfully';

      console.log('🎉 すべてのリソース読み込み完了');
      this.isLoadingComplete = true;
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
        'Loading cat model...',
        'Finalizing setup...'
      ];
      const stageIndex = Math.min(stages.length - 1, Math.floor((this.resourcesLoaded / this.resourcesToLoad) * (stages.length)));
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
            this.renderCurrentSection();
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
    // FPSはanimate()で更新するため、ここではDOM要素の取得のみ。
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
  }

  showMemoryCardAccess(message) {
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

    // 制作記録（2D）とゲーム選択（3D）の閉じる処理を統合
    const handleClose = () => {
      this.soundManager.playClick();
      if (this.selectedObject) {
        this.deselectGame();
      }
      // 3Dオブジェクトが選択されていなくても、説明ウィンドウが開いていれば閉じる
      else {
        this.hideDescription();
      }
    };

    closeButton?.addEventListener('click', handleClose);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }

      if (!this.isAnimating && !this.selectedObject && this.gamePackages.length > 0) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.currentKeyboardIndex = (this.currentKeyboardIndex - 1 + this.gamePackages.length) % this.gamePackages.length;
          this.selectGameByIndex(this.currentKeyboardIndex, false);
          this.showKeyboardPress('←');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.currentKeyboardIndex = (this.currentKeyboardIndex + 1) % this.gamePackages.length;
          this.selectGameByIndex(this.currentKeyboardIndex, false);
          this.showKeyboardPress('→');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.selectGameByIndex(this.currentKeyboardIndex, true);
        }
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

  selectGameByIndex(index, doZoom) {
    const pkg = this.gamePackages[index];
    if (!pkg) return;

    this.soundManager.playClick();

    this.gamePackages.forEach(p => {
      if (p !== pkg) {
        gsap.to(p.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        p.userData.hoverIntensity = 0;
        p.traverse(node => {
          if (node.isMesh && node.material.emissive) {
            gsap.to(node.material, { emissiveIntensity: 0.0, duration: 0.3 });
          }
        });
      }
    });

    gsap.to(pkg.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3 });
    pkg.userData.hoverIntensity = 1;
    pkg.traverse(node => {
      if (node.isMesh && node.material.emissive) {
        gsap.to(node.material, { emissiveIntensity: 0.3, duration: 0.3 });
      }
    });
    this.hoveredObject = pkg;

    if (doZoom) {
      this.selectGame(pkg);
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
        console.log('🐱 catMixer:', this.catMixer);
        console.log('🐱 catModel:', this.catModel);
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

          // アニメーションクリップを検出
          let packageOpenClip = null;
          let packageCloseClip = null;

          if (gltf.animations && gltf.animations.length > 0) {
            console.log(`   └ 🎬 検出されたアニメーション: ${gltf.animations.map(a => `'${a.name}'`).join(', ')}`);

            packageOpenClip = gltf.animations.find(clip => clip.name === 'package_open');
            packageCloseClip = gltf.animations.find(clip => clip.name === 'package_close');

            if (packageOpenClip) console.log(`   └ ✅ 'package_open' アニメーション発見`);
            if (packageCloseClip) console.log(`   └ ✅ 'package_close' アニメーション発見`);
          }

          gltf.scene.traverse(node => {
            this.setupPS2Material(node);
          });

          // アニメーション情報をuserDataに保存
          gltf.scene.userData.animations = {
            openClip: packageOpenClip,
            closeClip: packageCloseClip,
            mixer: null  // 後で設定
          };

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
      side: originalMat.side || THREE.FrontSide,
      skinning: node.isSkinnedMesh === true
    });
    node.material = ps2Mat;
    node.castShadow = true;
    node.receiveShadow = true;

    if (this.isMobile && node.geometry && THREE.BufferGeometryUtils) {
      try {
        node.geometry = THREE.BufferGeometryUtils.mergeVertices(node.geometry);
        node.geometry.computeVertexNormals();
      } catch (e) {
        // console.warn('メッシュ最適化失敗:', e);
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
      console.log('   ├ レンダラー初期化完了');

      this.scene = new THREE.Scene();
      console.log('   ├ シーン作成完了');

      const isMobileView = (window.innerWidth <= 1024);
      this.sideNavWidth = isMobileView ? 0 : this.desktopNavWidth;
      const width = Math.max(1, window.innerWidth - this.sideNavWidth);
      const height = Math.max(1, window.innerHeight - (this.sideNavWidth === 0 ? this.mobileHeaderHeight : 0));

      const fov = isMobileView ? 65 : 50;

      this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);

      this.activeCameraPos = isMobileView ? this.mobileCameraPos.clone() : this.desktopCameraPos.clone();
      this.activeLookAt = isMobileView ? this.mobileLookAt.clone() : this.desktopLookAt.clone();

      this.camera.position.copy(this.activeCameraPos);
      this.camera.lookAt(this.activeLookAt);

      this.originalCameraRotation.copy(this.camera.rotation);
      this.cameraShakeOffset = new THREE.Vector3();

      this.mouseLight = new THREE.PointLight(0xffaa00, 0, 10);
      this.mouseLight.position.set(0, 0, 3);
      this.scene.add(this.mouseLight);

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

    // マウスライトの目標強度を設定する (減衰アニメーションはanimate()で実行)
    this.targetMouseLightIntensity = (Math.abs(this.mouse.x) < 1.2 && Math.abs(this.mouse.y) < 1.2) ? 2.0 : 0;

    // マウスライトの位置更新
    if (this.mouseLight && this.camera) {
      const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
      vector.unproject(this.camera);

      const dir = vector.sub(this.camera.position).normalize();
      const distance = -this.camera.position.z / dir.z + 2.0;
      const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

      this.mouseLight.position.set(pos.x, pos.y + 1.0, 3.0);
    }

    // カーソル制御
    document.body.style.cursor = (this.hoveredObject || this.isAnimating || this.selectedObject) ? 'pointer' : 'default';
  }

  onClick(event) {
    if (this.isAnimating) {
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

    // アニメーション再生
    const animations = gameObject.userData.animations;
    if (animations && animations.mixer && animations.openClip) {
      console.log(`   └ 🎬 'package_open' アニメーション再生`);

      // 既存のアクションを停止
      animations.mixer.stopAllAction();

      // openアニメーションを再生（ループなし）
      const action = animations.mixer.clipAction(animations.openClip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;  // 最後のフレームで停止
      action.reset();
      action.play();
    } else if (!animations || !animations.openClip) {
      console.warn(`   └ ⚠️ package_openアニメーションが見つかりません`);
    }

    // 説明ウィンドウを表示（拡大・移動アニメーションなし）
    setTimeout(() => {
      this.showDescription(gameObject.userData);
      this.isAnimating = false;
    }, 100);

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
      return;
    }

    this.isAnimating = true;
    console.log('✖️ ゲーム選択解除開始');

    if (CONFIG.CAMERA_SHAKE.enabled) {
      CONFIG.CAMERA_SHAKE.trauma = 0.5;
    }

    const gameObject = this.selectedObject;

    // アニメーション再生
    const animations = gameObject.userData.animations;
    if (animations && animations.mixer && animations.closeClip) {
      console.log(`   └ 🎬 'package_close' アニメーション再生`);

      // 既存のアクションを停止
      animations.mixer.stopAllAction();

      // closeアニメーションを再生（ループなし）
      const action = animations.mixer.clipAction(animations.closeClip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.reset();
      action.play();
    } else if (!animations || !animations.closeClip) {
      console.warn(`   └ ⚠️ package_closeアニメーションが見つかりません`);
    }

    // 説明ウィンドウを非表示（拡大・移動アニメーションなし）
    this.selectedObject = null;
    setTimeout(() => {
      this.isAnimating = false;
      console.log('✅ 選択解除完了');
    }, 100);

    // 他のパッケージの透明度を元に戻す
    this.gamePackages.forEach(pkg => {
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

      let envMap;

      if (CONFIG.HDRI_PATH.toLowerCase().endsWith('.exr')) {
        const exrLoader = new THREE.EXRLoader();
        const exrTexture = await exrLoader.loadAsync(CONFIG.HDRI_PATH);
        envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
        exrTexture.dispose();
      } else {
        const textureLoader = new THREE.TextureLoader();
        const texture = await new Promise((resolve, reject) => {
          textureLoader.load(CONFIG.HDRI_PATH, resolve, undefined, reject);
        });
        texture.mapping = THREE.EquirectangularReflectionMapping;
        envMap = pmremGenerator.fromEquirectangular(texture).texture;
        texture.dispose();
      }

      this.scene.environment = envMap;
      this.scene.background = envMap;

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
      console.log('   ├ Scene.glb 読み込み開始');
      if (!this.gltfLoader) this.initGLTFLoader();

      const gltf = await this.gltfLoader.loadAsync(CONFIG.SCENE_PATH);
      this.sceneModel = gltf.scene;
      this.scene.add(this.sceneModel);
      this.sceneModel.traverse(node => this.setupPS2Material(node));

      this.resourceLoaded('Scene.glb (机)');
      console.log('   └ Scene.glb 読み込み成功');
    } catch (error) {
      console.warn('   └ Scene.glb 読み込み失敗:', error);
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

  async loadCatModel() {
    console.log('🐱 cat.glb 読み込み開始');
    console.log(`   └ パス: ${CONFIG.CAT_PATH}`);

    this.catMixer = null;
    this.catModel = null;

    try {
      if (!this.gltfLoader) {
        console.log('   └ GLTFLoader初期化が必要');
        this.initGLTFLoader();
      }

      console.log('   └ GLTFLoaderで読み込み開始...');
      const gltf = await this.gltfLoader.loadAsync(CONFIG.CAT_PATH);
      console.log('   └ ✅ GLTFデータ読み込み成功');

      const catModel = gltf.scene;
      this.catModel = catModel;

      catModel.traverse(node => this.setupPS2Material(node));
      console.log(`   └ ✅ マテリアルセットアップ完了`);

      if (gltf.animations && gltf.animations.length > 0) {
        console.log(`   └ 🎬 検出されたGLTFアニメーション一覧: ${gltf.animations.map(a => `'${a.name}'`).join(', ')}`);

        const catwalkAnimation = gltf.animations.find(clip => clip.name === 'CATWALK');
        if (catwalkAnimation) {
          this.catMixer = new THREE.AnimationMixer(catModel);
          const action = this.catMixer.clipAction(catwalkAnimation);
          action.setLoop(THREE.LoopRepeat);
          action.play();
          console.log(`   └ ▶️ GLTFアニメーション 'CATWALK' を再生開始`);
        }
      }

      catModel.position.set(3.5, 0.5, 0);
      catModel.scale.set(1.0, 1.0, 1.0);

      this.scene.add(catModel);
      this.resourceLoaded('cat.glb (アニメーション)');
      console.log('   └ ✅ cat.glb シーン追加完了');

      return catModel;

    } catch (error) {
      console.error(`   └ ❌ cat.glb 読み込みで例外発生:`, error);
      console.error(`   └ エラースタック:`, error.stack);
      this.resourceLoaded('cat.glb (エラー)');

      const fallbackGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const fallbackMat = new THREE.MeshLambertMaterial({
        color: 0xFF00FF,
        emissive: 0x660066
      });
      const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
      fallbackMesh.position.set(3.5, 0.5, 0);
      fallbackMesh.name = 'cat_fallback';
      this.scene.add(fallbackMesh);

      return null;
    }
  }

  async loadAndArrangePackages() {
    console.log('%c📦 パッケージ＆cat.glb読み込み開始', 'color: #00AAFF; font-size: 14px; font-weight: bold;');

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
        animations: model.userData.animations || { openClip: null, closeClip: null, mixer: null }
      };

      // AnimationMixerを作成
      if (model.userData.animations.openClip || model.userData.animations.closeClip) {
        const mixer = new THREE.AnimationMixer(model);
        model.userData.animations.mixer = mixer;
        this.mixers.push(mixer);  // animate()で更新するために保存
        console.log(`   └ 🎭 AnimationMixer作成: ${modelData.name}`);
      }

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

    console.log('🐱 cat.glb ロードを開始します...');
    try {
      await this.loadCatModel();
      console.log('✅ cat.glb ロード成功');
    } catch (catError) {
      console.error('❌ cat.glb ロード失敗:', catError);
    }

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

    if (!this.gameSceneInitialized) {
      return;
    }

    if (document.hidden) return;

    // 60fps制限: 前回のレンダリングから一定時間経過していない場合はスキップ
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - this.lastRenderTime;
    const targetFrameTime = 15; // 約60fps (処理オーバーヘッドを考慮して15msに設定)

    if (timeSinceLastRender < targetFrameTime) {
      return; // まだ次のフレームを描画する時間ではない
    }

    // 実際のレンダリング時刻を記録
    this.lastRenderTime = currentTime;

    try {
      this.frameCount++;

      if (currentTime - this.lastFpsTime >= 1000) {
        this.fps = Math.floor(this.frameCount / ((currentTime - this.lastFpsTime) / 1000));
        this.frameCount = 0;
        this.lastFpsTime = currentTime;

        const fpsElement = document.getElementById('system-fps');
        if (fpsElement) fpsElement.textContent = `${this.fps}`;

        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter?.classList.contains('visible')) {
          fpsCounter.textContent = `FPS: ${this.fps}`;
        }
      }

      const shouldUpdateLogic = this.frameCount % CONFIG.PERFORMANCE.frameSkip === 0;

      if (shouldUpdateLogic) {
        // Raycasterをanimate()内に移動
        if (!this.isAnimating && !this.selectedObject) {
          this.updateHoverEffects();
        }

        // マウスライトの減衰アニメーションをanimate()内で実行
        if (this.mouseLight) {
          this.mouseLight.intensity += (this.targetMouseLightIntensity - this.mouseLight.intensity) * 0.1;
        }
      }

      this.gamePackages.forEach(pkg => {
        if (pkg?.lookAt) {
          pkg.lookAt(this.camera.position);
          if (!this.isAnimating && !this.selectedObject && CONFIG.AUTO_ROTATION.enabled) {
            pkg.rotation.y += 0.016 * CONFIG.AUTO_ROTATION.speed / 60;
          }
        }
      });

      const rawDelta = this.clock.getDelta();
      const safeDelta = (typeof rawDelta === 'number' && isFinite(rawDelta) && rawDelta >= 0)
        ? Math.min(rawDelta, 0.1)
        : 0.016;

      if (this.catMixer && this.catModel && typeof this.catMixer.update === 'function') {
        try {
          this.catMixer.update(safeDelta);
        } catch (mixerError) {
          console.error('💥 catMixer.update() エラー:', mixerError);
          this.catMixer = null;
        }
      }

      this.mixers.forEach(mixer => {
        if (mixer?.update) mixer.update(safeDelta);
      });

      this.updateCameraShake();
      if (this.camera) {
        this.camera.position.copy(this.activeCameraPos).add(this.cameraShakeOffset);
        if (!this.selectedObject) {
          this.camera.lookAt(this.activeLookAt);
        }
      }

      if (this.ps2NoisePass?.uniforms?.time) {
        this.ps2NoisePass.uniforms.time.value = currentTime * 0.001;
      }

      if (this.composer) {
        this.composer.render();
      } else if (this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }

    } catch (mainError) {
      console.error('🚨 animate() 未捕捉例外:', mainError);
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

    const isMobileView = (window.innerWidth <= 1024);
    this.sideNavWidth = isMobileView ? 0 : this.desktopNavWidth;
    const width = Math.max(1, window.innerWidth - this.sideNavWidth);
    const height = Math.max(1, window.innerHeight - (this.sideNavWidth === 0 ? this.mobileHeaderHeight : 0));

    this.activeCameraPos = isMobileView ? this.mobileCameraPos.clone() : this.desktopCameraPos.clone();
    this.activeLookAt = isMobileView ? this.mobileLookAt.clone() : this.desktopLookAt.clone();

    this.camera.aspect = width / height;
    this.camera.fov = isMobileView ? 65 : 50;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // EffectComposerのサイズ更新とレンダーターゲットの再構築
    if (this.composer) {
      this.composer.setSize(width, height);

      // 各パスのレンダーターゲットも更新
      this.composer.passes.forEach(pass => {
        if (pass.fullscreenMaterial) {
          pass.uniforms = pass.fullscreenMaterial.uniforms;
        }
      });
    }
  }
}

// =============================================================================
// DOM読み込み完了後の初期化
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM読み込み完了');

  if (!window.THREE) {
    console.error('❌ Three.jsが読み込まれていません！');
    return;
  }
  if (window.location.protocol === 'file:') {
    console.error('❌ ファイルプロトコル(file://)では動作しません！HTTPサーバーが必要です。');
    alert('⚠️ ローカルファイル(file://)では動作しません。\n\nHTTPサーバーを起動してください:\n\n1. ターミナルでプロジェクトルートに移動\n2. コマンド実行: npx serve . -p 3000\n3. ブラウザで http://localhost:3000 にアクセス');
    return;
  }

  try {
    window.ps2Portfolio = new PS2Portfolio();
    console.log('🎮 アプリケーション初期化完了');
  } catch (error) {
    console.error('💥 アプリケーション初期化失敗:', error);
  }
});