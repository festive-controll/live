/**
 * Kauthukam Arts Fest - Interactive JS Features (Static Minimal Edition)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const btnCelebrate = document.getElementById('btn-celebrate');
  const mediaCard = document.getElementById('media-card');
  const videoModal = document.getElementById('video-modal');
  const closeModal = document.getElementById('close-modal');
  const modalActionBtn = document.getElementById('modal-action-btn');
  const visualizerCanvas = document.getElementById('visualizer-canvas');
  const celebrationCanvas = document.getElementById('celebration-canvas');
  const navBadge = document.getElementById('nav-badge');

  // Festival Color Palette
  const colors = [
    '#37314F', // Dark Indigo
    '#C0912B', // Warm Gold
    '#17635F', // Deep Teal
    '#92205D'  // Deep Berry
  ];

  // ==========================================
  // 1. Confetti Particle System (Celebrate)
  // ==========================================
  let ctxCeleb = null;
  let particles = [];
  let animationFrameId = null;

  if (celebrationCanvas) {
    ctxCeleb = celebrationCanvas.getContext('2d');

    function resizeCelebrationCanvas() {
      celebrationCanvas.width = window.innerWidth;
      celebrationCanvas.height = window.innerHeight;
    }
    resizeCelebrationCanvas();
    window.addEventListener('resize', resizeCelebrationCanvas);
  }

  class ConfettiParticle {
    constructor(x, y, angleDeg, customSpeed) {
      this.x = x;
      this.y = y;
      this.radius = Math.random() * 7 + 4;
      this.color = colors[Math.floor(Math.random() * colors.length)];

      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = customSpeed || (Math.random() * 16 + 10); // Launch speed
      this.vx = Math.cos(angleRad) * speed;
      this.vy = Math.sin(angleRad) * speed;
      this.gravity = 0.35;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 12;
      this.opacity = 1;
      this.fadeSpeed = Math.random() * 0.006 + 0.003; // Slow fade to allow screen crossing
      this.shape = Math.random() > 0.4 ? 'rect' : 'circle';
    }

    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      this.opacity -= this.fadeSpeed;
    }

    draw() {
      if (!ctxCeleb) return;
      ctxCeleb.save();
      ctxCeleb.globalAlpha = Math.max(0, this.opacity);
      ctxCeleb.translate(this.x, this.y);
      ctxCeleb.rotate((this.rotation * Math.PI) / 180);
      ctxCeleb.fillStyle = this.color;

      if (this.shape === 'rect') {
        ctxCeleb.fillRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius * 1.5);
      } else {
        ctxCeleb.beginPath();
        ctxCeleb.arc(0, 0, this.radius / 2, 0, Math.PI * 2);
        ctxCeleb.fill();
      }

      ctxCeleb.restore();
    }
  }

  function launchConfetti(originX, originY) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (typeof originX === 'number' && typeof originY === 'number') {
      // Burst from specified non-fixed position
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * 360;
        const speed = Math.random() * 12 + 4;
        particles.push(new ConfettiParticle(originX, originY, angle, speed));
      }
    } else {
      // Launch from multiple random non-fixed positions across the top/middle screen
      const burstCount = 8;
      for (let b = 0; b < burstCount; b++) {
        const rx = Math.random() * (w * 0.9) + (w * 0.05);
        const ry = Math.random() * (h * 0.45) + (h * 0.05);
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * 360;
          const speed = Math.random() * 10 + 4;
          particles.push(new ConfettiParticle(rx, ry, angle, speed));
        }
      }
    }

    if (!animationFrameId) {
      animateConfetti();
    }
  }

  // Automatically trigger multi-location confetti on refresh / page load
  function autoCelebrateOnRefresh() {
    if (window.disableAutoConfetti || window.location.pathname.includes('contact.html')) {
      return;
    }
    // Initial multi-location burst
    launchConfetti();

    // Additional dynamic bursts from non-fixed random locations on screen
    const delayedBursts = [200, 450, 750, 1100];
    delayedBursts.forEach(delay => {
      setTimeout(() => {
        const rx = Math.random() * (window.innerWidth * 0.8) + (window.innerWidth * 0.1);
        const ry = Math.random() * (window.innerHeight * 0.5) + (window.innerHeight * 0.1);
        launchConfetti(rx, ry);
      }, delay);
    });
  }

  // Automatic confetti on page load has been disabled by request.
  // autoCelebrateOnRefresh();

  // Export globally for page interactions
  window.launchConfetti = launchConfetti;

  function animateConfetti() {
    if (!ctxCeleb || !celebrationCanvas) return;
    ctxCeleb.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
    particles = particles.filter(p => p.opacity > 0);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    if (particles.length > 0) {
      animationFrameId = requestAnimationFrame(animateConfetti);
    } else {
      animationFrameId = null;
    }
  }

  const scorebar = document.getElementById('scorebar');

  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuBadge = document.getElementById('mobile-menu-badge');
  const mobileMenuBtns = document.querySelectorAll('.mobile-menu-btn');

  if (btnCelebrate) {
    btnCelebrate.addEventListener('click', (e) => {
      launchConfetti();
    });
  }

  if (navBadge) {
    navBadge.addEventListener('click', (e) => {
      if (window.innerWidth < 768) {
        if (mobileMenu) mobileMenu.classList.add('active');
      } else {
        if (scorebar) scorebar.classList.toggle('active');
      }
    });
  }

  if (mobileMenuBadge) {
    mobileMenuBadge.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.remove('active');
    });
  }

  mobileMenuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.remove('active');
    });
  });

  // ==========================================
  // 2. Interactive Media Showcase Modal
  // ==========================================
  let visualizerActive = false;



  function closeVideoModal() {
    if (videoModal) videoModal.classList.remove('active');
    visualizerActive = false;
  }

  if (closeModal) closeModal.addEventListener('click', closeVideoModal);
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideoModal();
      }
    });
  }

  if (modalActionBtn) {
    modalActionBtn.addEventListener('click', () => {
      alert('Welcome to the Kauthukam Grand Hall! Enjoy the celebration.');
      closeVideoModal();
    });
  }

  // ==========================================
  // 3. Canvas Media Wave Visualizer
  // ==========================================
  let ctxVis = null;
  let visFrameId = null;

  if (visualizerCanvas) {
    ctxVis = visualizerCanvas.getContext('2d');

    function resizeVisualizerCanvas() {
      visualizerCanvas.width = visualizerCanvas.parentElement.clientWidth;
      visualizerCanvas.height = visualizerCanvas.parentElement.clientHeight;
    }

    window.addEventListener('resize', () => {
      if (visualizerActive) {
        resizeVisualizerCanvas();
      }
    });
  }

  let waveOffset = 0;

  function startVisualizer() {
    if (visualizerCanvas) {
      resizeVisualizerCanvas();
      animateVisualizer();
    }
  }

  function animateVisualizer() {
    if (!visualizerActive || !ctxVis) {
      cancelAnimationFrame(visFrameId);
      return;
    }

    ctxVis.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    // Draw three waves
    drawWave(colors[0], 0.008, 30, waveOffset, 0.4);
    drawWave(colors[1], 0.005, 45, waveOffset * 0.8 + 100, 0.3);
    drawWave(colors[2], 0.006, 35, waveOffset * 1.2 + 200, 0.3);

    waveOffset += 0.03;
    visFrameId = requestAnimationFrame(animateVisualizer);
  }

  function drawWave(color, frequency, amplitude, offset, opacity) {
    if (!ctxVis || !visualizerCanvas) return;
    ctxVis.save();
    ctxVis.globalAlpha = opacity;
    ctxVis.fillStyle = color;
    ctxVis.beginPath();

    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;
    const midY = height / 2;

    ctxVis.moveTo(0, height);
    for (let x = 0; x <= width; x += 5) {
      const y = midY + Math.sin(x * frequency + offset) * amplitude * Math.sin(offset * 0.1);
      ctxVis.lineTo(x, y);
    }
    ctxVis.lineTo(width, height);
    ctxVis.closePath();
    ctxVis.fill();
    ctxVis.restore();
  }

  // Scroll animation for About text opacity (Word-by-word reveal)
  const aboutText = document.getElementById('about-section-text');
  if (aboutText) {
    const textContent = aboutText.innerText.trim();
    // Split text by space and wrap each word in a span
    const wordsArray = textContent.split(/\s+/);
    aboutText.innerHTML = wordsArray.map(word => `<span class="scroll-word" style="color: #e5e5e5; transition: color 0.25s ease-out; display: inline-block;">${word}</span>`).join(' ');

    const wordSpans = aboutText.querySelectorAll('.scroll-word');
    const totalWords = wordSpans.length;

    function handleScrollReveal() {
      const rect = aboutText.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Trigger limits: start revealing when top is at 80%, fully reveal at 25% screen height
      const startTrigger = viewportHeight * 0.85;
      const endTrigger = viewportHeight * 0.25;
      const triggerHeight = startTrigger - endTrigger;

      let progress = (startTrigger - rect.top) / triggerHeight;
      progress = Math.max(0, Math.min(1, progress));

      const wordsToReveal = progress * totalWords;

      wordSpans.forEach((span, idx) => {
        if (idx < wordsToReveal) {
          span.style.color = '#262626'; // Opaque dark charcoal matching screenshot
        } else {
          span.style.color = '#e5e5e5'; // Faded light gray matching screenshot
        }
      });
    }

    window.addEventListener('scroll', handleScrollReveal);
    window.addEventListener('resize', handleScrollReveal);
    handleScrollReveal();
  }

  // ==========================================
  // Live Website Navigation & Offline Mode Sync
  // ==========================================
  function syncWebsiteVisibilityConfig() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      try {
        const db = firebase.firestore();
        db.collection('config').doc('website').onSnapshot(doc => {
          if (!doc.exists) return;
          const config = doc.data();

          // 1. Handle Website Offline / Maintenance Mode
          if (config.isWebsiteOn === false) {
            showMaintenanceScreen();
          } else {
            removeMaintenanceScreen();
          }

          // 2. Handle Page Navigation Visibility & Result Present Toggle
          const isResultPresent = config.resultPresent === true;
          
          const targetResultHref = isResultPresent ? '../results/index.html' : 'results/index.html';

          // Dynamically route Result buttons across scorebars & menus
          const resultButtons = document.querySelectorAll('a[href*="result.html"], a[href*="results/index.html"], a[href*="results/"]');
          resultButtons.forEach(btn => {
            btn.setAttribute('href', targetResultHref);

            // Toggle button aesthetic: Outline (ON) vs Inline/Solid (OFF Coming Soon)
            if (btn.classList.contains('scorebar-btn') || btn.classList.contains('mobile-menu-btn')) {
              if (isResultPresent) {
                btn.classList.remove('bg-[#EA8F23]', 'text-white');
                btn.classList.add('bg-[#FDF3E8]', 'text-[#EA8F23]', 'border-[#EA8F23]/30');
              } else {
                btn.classList.remove('bg-[#FDF3E8]', 'text-[#EA8F23]');
                btn.classList.add('bg-[#EA8F23]', 'text-white', 'border-[#EA8F23]');
              }
            }
          });

          if (config.visiblePages && Array.isArray(config.visiblePages)) {
            const pageMap = {
              'home': 'index.html',
              'standings': targetResultHref,
              'downloads': 'downloads.html',
              'updates': 'updates.html',
              'moments': 'gallery.html',
              'contact': 'contact.html'
            };
            Object.keys(pageMap).forEach(key => {
              const pageFile = pageMap[key];
              const isVisible = config.visiblePages.includes(key);
              const links = document.querySelectorAll(`a[href*="${pageFile}"]`);
              links.forEach(link => {
                if (isVisible) {
                  link.style.display = '';
                } else {
                  link.style.display = 'none';
                }
              });
            });
          }

          // 3. Handle Hero Banner Slideshow Sync
          if (config.heroSlides && Array.isArray(config.heroSlides) && config.heroSlides.length > 0) {
            setupHeroSlider(config.heroSlides);
          } else {
            setupHeroSlider([]);
          }
        }, err => console.warn("Config sync err:", err));
      } catch (e) {
        console.warn("Visibility sync failed:", e);
        setupHeroSlider([]);
      }
    } else {
      setupHeroSlider([]);
    }
  }

  // ==========================================
  // Hero Carousel Slider System
  // ==========================================
  let heroSlidesList = [];
  let currentHeroIndex = 0;
  let heroTimer = null;

  function setupHeroSlider(slides) {
    const container = document.getElementById('hero-slider-container');
    const dotsContainer = document.getElementById('hero-slider-dots');
    if (!container) return;

    const validSlides = slides.filter(url => url !== 'asset/fest_showcase.png' && url !== 'asset/clg.jpg');
    if (!validSlides || !validSlides.length) {
      container.innerHTML = '<div class="text-slate-600 font-sans font-medium">No images available</div>';
      if (dotsContainer) dotsContainer.style.display = 'none';
      return;
    }
    
    heroSlidesList = validSlides;
    currentHeroIndex = 0;

    // Render slides
    container.innerHTML = heroSlidesList.map((url, idx) => `
      <div class="hero-slide-item absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}">
        <img src="${url}" alt="Hero Slide #${idx + 1}" class="w-full h-full object-cover rounded-2xl">
      </div>
    `).join('');

    // Render dots
    if (dotsContainer) {
      if (heroSlidesList.length > 1) {
        dotsContainer.style.display = 'flex';
        dotsContainer.innerHTML = heroSlidesList.map((_, idx) => `
          <button onclick="event.stopPropagation(); window.goToHeroSlide(${idx});" 
            class="hero-dot w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === 0 ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}"></button>
        `).join('');
      } else {
        dotsContainer.style.display = 'none';
      }
    }

    startHeroAutoSlide();
  }

  function startHeroAutoSlide() {
    if (heroTimer) clearInterval(heroTimer);
    if (heroSlidesList.length <= 1) return;

    heroTimer = setInterval(() => {
      window.navigateHeroSlider(1);
    }, 4000);
  }

  window.goToHeroSlide = function (idx) {
    if (!heroSlidesList.length) return;
    currentHeroIndex = (idx + heroSlidesList.length) % heroSlidesList.length;
    updateHeroSlideDOM();
    startHeroAutoSlide();
  };

  window.navigateHeroSlider = function (dir) {
    if (!heroSlidesList.length) return;
    currentHeroIndex = (currentHeroIndex + dir + heroSlidesList.length) % heroSlidesList.length;
    updateHeroSlideDOM();
    startHeroAutoSlide();
  };

  function updateHeroSlideDOM() {
    const slides = document.querySelectorAll('.hero-slide-item');
    const dots = document.querySelectorAll('.hero-dot');

    slides.forEach((slide, idx) => {
      if (idx === currentHeroIndex) {
        slide.classList.remove('opacity-0', 'z-0');
        slide.classList.add('opacity-100', 'z-10');
      } else {
        slide.classList.remove('opacity-100', 'z-10');
        slide.classList.add('opacity-0', 'z-0');
      }
    });

    dots.forEach((dot, idx) => {
      if (idx === currentHeroIndex) {
        dot.className = "hero-dot w-6 h-2.5 rounded-full bg-white transition-all duration-300";
      } else {
        dot.className = "hero-dot w-2.5 h-2.5 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-300";
      }
    });
  }

  function showMaintenanceScreen() {
    let overlay = document.getElementById('website-offline-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'website-offline-overlay';
      overlay.className = 'fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden';

      const style = document.createElement('style');
      style.id = 'website-offline-style';
      style.innerHTML = `
        @import url('https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,300,400,500,600,700&display=swap');
        
        @keyframes error-slide-up { from{opacity:0;transform:translateY(24px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes error-float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes bg-pan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        #website-offline-overlay {
            background: linear-gradient(-45deg, #fdfbfb, #ffffff, #f8f9fa, #fdfbfb) !important;
            background-size: 400% 400% !important;
            animation: bg-pan 15s ease infinite !important;
        }

        .error-card {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(178, 230, 206, 0.6) !important;
            border-radius: 40px !important;
            padding: 30px !important;
            max-width: 700px !important;
            width: calc(100% - 32px) !important;
            text-align: center !important;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02) !important;
            animation: error-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both !important;
            position: relative !important;
            z-index: 10 !important;
            font-family: 'Clash Grotesk', sans-serif !important;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .error-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 20px;
            width: 100%;
        }
        .error-icon-wrapper {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 2px solid #ffb3c6;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: #fff;
            animation: error-float 4s ease-in-out infinite;
            box-shadow: 0 12px 24px -8px rgba(242, 139, 130, 0.3);
        }

        .error-text-container {
            text-align: left;
        }
        .error-title {
            font-size: 46px;
            font-weight: normal;
            color: #f05a4f;
            margin: 0 0 8px;
            line-height: 1.1;
            letter-spacing: -1.5px;
            text-shadow: 0 2px 4px rgba(240, 90, 79, 0.1);
        }
        .error-subtitle {
            font-size: 26px;
            color: #f28b82;
            margin: 0;
            font-weight: 300;
            letter-spacing: -0.5px;
        }

        .error-logo-box {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            border: 1px solid #ffb3c6;
            border-radius: 16px;
            margin: 16px 0;
            background: #ffffff;
            box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05);
            cursor: default;
        }

        .error-logo-img {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            object-fit: contain;
            background: transparent;
            color: transparent;
        }
        .error-logo-text {
            color: #2b3a67;
            text-align: left;
            line-height: 1.2;
        }
        .error-logo-text-title {
            font-size: 20px;
            font-weight: normal;
            letter-spacing: -0.5px;
        }
        .error-logo-text-sub {
            font-size: 14px;
            font-weight: normal;
            opacity: 0.7;
            color: #4a6fa5;
        }

        .error-footer {
            font-size: 16px;
            color: #888;
            margin-top: 16px;
            font-weight: normal;
        }
        .error-footer span {
            color: #4a6fa5;
            font-weight: normal;
            cursor: pointer;
        }

        @media (max-width: 600px) {
            .error-header { flex-direction: column; text-align: center; }
            .error-text-container { text-align: center; }
            .error-title { font-size: 32px; }
            .error-subtitle { font-size: 20px; }
        }
      `;
      document.head.appendChild(style);

      let errorCard = document.createElement('div');
      errorCard.className = 'error-card';
      errorCard.innerHTML = `
        <div class="error-header">
            <div class="error-icon-wrapper">
                <svg viewBox="0 0 100 100" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                  <!-- Browser Window -->
                  <rect x="15" y="25" width="70" height="50" rx="4" fill="#f8f9fa" stroke="#2b3a67" stroke-width="3"/>
                  <line x1="15" y1="38" x2="85" y2="38" stroke="#2b3a67" stroke-width="3"/>
                  <circle cx="23" cy="31.5" r="2.5" fill="#f05a4f"/>
                  <circle cx="31" cy="31.5" r="2.5" fill="#f2c94c"/>
                  <circle cx="39" cy="31.5" r="2.5" fill="#27ae60"/>
                  <!-- Browser Content Lines -->
                  <rect x="25" y="46" width="30" height="3" rx="1.5" fill="#a0aec0"/>
                  <rect x="25" y="54" width="40" height="3" rx="1.5" fill="#a0aec0"/>
                  <rect x="25" y="62" width="20" height="3" rx="1.5" fill="#a0aec0"/>
                  <!-- Warning Triangle -->
                  <polygon points="55,50 35,85 75,85" fill="#f8f9fa" stroke="#2b3a67" stroke-width="3" stroke-linejoin="round"/>
                  <polygon points="55,54 40,81 70,81" fill="#f05a4f" />
                  <line x1="55" y1="62" x2="55" y2="72" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="55" cy="77" r="1.5" fill="#fff"/>
                </svg>
            </div>
            <div class="error-text-container">
                <h1 class="error-title">Website is Shutdown</h1>
                <h2 class="error-subtitle">304 - Backend De-attached</h2>
            </div>
        </div>
        
        <div class="error-logo-box">
            <img class="error-logo-img" data-fest="logo" src="" alt="Logo">
            <div class="error-logo-text">
                <div class="error-logo-text-title" data-fest="name">FestivalName</div>
                <div class="error-logo-text-sub" data-fest="year">FestivalYear</div>
            </div>
        </div>

        <div class="error-footer">
            contact owner is problem exists <span>dezignmvs.</span>
        </div>
      `;
      overlay.appendChild(errorCard);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      if (typeof firebase !== 'undefined' && firebase.firestore) {
        firebase.firestore().collection('config').doc('festData').get().then(doc => {
          if (doc.exists && window.updatePageFaviconAndManifest) {
            window.updatePageFaviconAndManifest(doc.data());
          }
        }).catch(err => console.warn('Failed to fetch festival data for offline screen', err));
      } else if (window.updatePageFaviconAndManifest) {
        fetch('https://firestore.googleapis.com/v1/projects/festie-s1u2h3/databases/(default)/documents/config/festData')
          .then(res => res.json())
          .then(json => {
            if (json && json.fields) {
              const doc = json.fields;
              const data = {};
              for (const key in doc) {
                if (doc[key].stringValue !== undefined) data[key] = doc[key].stringValue;
                else if (doc[key].booleanValue !== undefined) data[key] = doc[key].booleanValue;
                else if (doc[key].integerValue !== undefined) data[key] = doc[key].integerValue;
              }
              window.updatePageFaviconAndManifest(data);
            }
          })
          .catch(e => console.warn(e));
      }
    }
  }

  function removeMaintenanceScreen() {
    const overlay = document.getElementById('website-offline-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
    const style = document.getElementById('website-offline-style');
    if (style) style.remove();
  }

  syncWebsiteVisibilityConfig();
});

