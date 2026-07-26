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

  // Festival Color Palette (matching 5Rect.png and SIBAQ logo)
  const colors = [
    '#00A3E0', // Cyan-blue
    '#FFC20E', // Gold-yellow
    '#EA3650', // Red/Pink
    '#2075BC', // Blue
    '#09ABB1'  // Teal
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

  // Trigger automatically on page load / refresh
  if (document.readyState === 'complete') {
    autoCelebrateOnRefresh();
  } else {
    window.addEventListener('load', autoCelebrateOnRefresh);
  }

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

  if (mediaCard) {
    mediaCard.addEventListener('click', () => {
      if (videoModal) {
        videoModal.classList.add('active');
        visualizerActive = true;
        startVisualizer();
      }
    });
  }

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
          const targetResultHref = isResultPresent ? 'results/index.html' : 'result.html';

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
            setupHeroSlider(['asset/fest_showcase.png', 'asset/clg.jpg']);
          }
        }, err => console.warn("Config sync err:", err));
      } catch (e) {
        console.warn("Visibility sync failed:", e);
        setupHeroSlider(['asset/fest_showcase.png', 'asset/clg.jpg']);
      }
    } else {
      setupHeroSlider(['asset/fest_showcase.png', 'asset/clg.jpg']);
    }
  }

  // ==========================================
  // Hero Carousel Slider System
  // ==========================================
  let heroSlidesList = [];
  let currentHeroIndex = 0;
  let heroTimer = null;

  function setupHeroSlider(slides) {
    if (!slides || !slides.length) return;
    heroSlidesList = slides;
    currentHeroIndex = 0;

    const container = document.getElementById('hero-slider-container');
    const dotsContainer = document.getElementById('hero-slider-dots');
    if (!container) return;

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
      overlay.className = 'fixed inset-0 z-[9999] bg-[#050805] flex flex-col items-center justify-center p-6 text-center overflow-hidden';

      // Inject hacker style block dynamically
      const style = document.createElement('style');
      style.id = 'website-offline-style';
      style.innerHTML = `
        @keyframes hacker-slide-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        #matrix-canvas-public {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            opacity: 0.75;
        }
        .hacker-card {
            background: rgba(5, 8, 5, 0.9) !important;
            border: 2px solid #39FF14 !important;
            border-radius: 4px !important;
            padding: 40px 30px !important;
            max-width: 440px !important;
            width: calc(100% - 32px) !important;
            text-align: center !important;
            box-shadow: 0 0 30px rgba(57, 255, 20, 0.3) !important;
            animation: hacker-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both !important;
            position: relative !important;
            z-index: 10 !important;
            color: #39FF14 !important;
            font-family: 'Courier New', Courier, monospace !important;
        }
        .hacker-icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(57, 255, 20, 0.1);
            color: #39FF14;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
            border: 1px solid #39FF14;
            text-shadow: 0 0 5px rgba(57, 255, 20, 0.5);
            font-size: 24px;
        }
        .hacker-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(57, 255, 20, 0.05);
            border: 1px solid rgba(57, 255, 20, 0.3);
            border-radius: 4px;
            padding: 4px 12px;
            margin-bottom: 16px;
        }
        .hacker-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #39FF14;
            box-shadow: 0 0 8px #39FF14;
        }
        .hacker-btn-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 18px;
            background: transparent;
            color: #39FF14 !important;
            border: 2px solid #39FF14;
            border-radius: 4px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 24px;
            text-decoration: none;
            width: 100%;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .hacker-btn-link:hover {
            background: #39FF14 !important;
            color: #050805 !important;
            box-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
        }
      `;
      document.head.appendChild(style);

      let canvas = document.createElement('canvas');
      canvas.id = 'matrix-canvas-public';
      overlay.appendChild(canvas);

      let hackerCard = document.createElement('div');
      hackerCard.className = 'hacker-card';
      hackerCard.innerHTML = `
        <div class="hacker-icon">☠</div>
        <div class="hacker-status">
          <div class="hacker-dot"></div>
          <span style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">WEBSITE_DEACTIVATED</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#39FF14;margin:0 0 8px;line-height:1.2;letter-spacing:-0.02em;text-shadow: 0 0 8px rgba(57, 255, 20, 0.6);">
            [ YOU HAVE BEEN HACKED! ]
        </h1>
        <p style="font-size:13px;color:#88ff88;line-height:1.5;margin:0 0 20px;max-width:320px;margin-left:auto;margin-right:auto;">
            This system node is currently shut down by security protocol. All front-facing user client pages are restricted.
        </p>
        <div style="background:#000;border:1px solid #1a331a;padding:12px;border-radius:4px;text-align:left;font-size:12px;line-height:1.5;color:#39FF14;margin-bottom:16px;font-family:monospace;">
            <div>guest@portal:~# STATUS: WAITING_FOR_ROOT</div>
            <div>guest@portal:~# CLIENTS: forbidden</div>
            <div>guest@portal:~# PING: offline</div>
            <div style="display:inline-block;">guest@portal:~# </div>
        </div>
      `;
      overlay.appendChild(hackerCard);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      // Initialize Matrix rain animation
      let ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ☠⚡⚠☣🕷";
      const charArray = characters.split("");
      const fontSize = 14;
      const columns = canvas.width / fontSize;
      const drops = [];
      for (let x = 0; x < columns; x++) drops[x] = 1;

      function draw() {
        ctx.fillStyle = 'rgba(5, 8, 5, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#39FF14';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
          const text = charArray[Math.floor(Math.random() * charArray.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }

      window.publicMatrixInterval = setInterval(draw, 33);
      window.publicMatrixResizeHandler = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', window.publicMatrixResizeHandler);
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

    if (window.publicMatrixInterval) {
      clearInterval(window.publicMatrixInterval);
      window.publicMatrixInterval = null;
    }
    if (window.publicMatrixResizeHandler) {
      window.removeEventListener('resize', window.publicMatrixResizeHandler);
      window.publicMatrixResizeHandler = null;
    }
  }

  syncWebsiteVisibilityConfig();
});

