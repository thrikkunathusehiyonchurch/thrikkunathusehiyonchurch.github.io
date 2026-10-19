/**
 * Thrikkunathu Sehiyon Jacobite Syrian Church, Kunnackal
 * Core Interactive & Audio Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-loaded');
  initAudioEngine();
  initScrollAnimations();
  initHeroSlider();
  initGalleryLightbox();
  initStickyHeader();
  initMobileMenu();
  initNextHolyMassCalculator();
  initDailyBibleVerse();
});

/* ==========================================================================
   1. Sacred Audio & Music Player Engine
   ========================================================================== */

function initAudioEngine() {
  const audio = document.getElementById('sacred-audio');
  const modal = document.getElementById('audio-welcome-modal');
  const playModalBtn = document.getElementById('modal-play-btn');
  const silentModalBtn = document.getElementById('modal-silent-btn');
  const floatWidget = document.getElementById('floating-audio-widget');
  const floatToggleBtn = document.getElementById('float-audio-toggle');
  const eqVisualizer = document.getElementById('audio-equalizer');
  const volumeSlider = document.getElementById('audio-volume');

  let audioCtx = null;
  let synthOscs = [];
  let isPlaying = false;

  function playWebAudioSynth() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const chord = [146.83, 220.00, 293.66, 349.23];
      synthOscs.forEach(o => { try{ o.stop(); }catch(e){} });
      synthOscs = [];

      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      chord.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 3.5;
        lfoGain.gain.value = 2.0;
        lfo.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start();
        synthOscs.push(osc);
      });
      
      setAudioPlayingState(true);
    } catch (e) {
      console.log('Web Audio synth notice:', e);
    }
  }

  function stopWebAudioSynth() {
    synthOscs.forEach(o => {
      try { o.stop(); } catch(e){}
    });
    synthOscs = [];
  }

  function startAudio() {
    if (!audio) {
      playWebAudioSynth();
      return;
    }

    audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.6;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setAudioPlayingState(true);
      }).catch(err => {
        console.log('File playback notice, falling back to Web Audio synth', err);
        playWebAudioSynth();
      });
    } else {
      setAudioPlayingState(true);
    }
  }

  function pauseAudio() {
    if (audio) audio.pause();
    stopWebAudioSynth();
    setAudioPlayingState(false);
  }

  function setAudioPlayingState(active) {
    isPlaying = active;
    if (floatWidget) {
      if (active) {
        floatWidget.classList.add('is-playing');
        if (floatToggleBtn) floatToggleBtn.setAttribute('aria-label', 'Pause Sacred Hymn');
        if (eqVisualizer) eqVisualizer.classList.add('animating');
      } else {
        floatWidget.classList.remove('is-playing');
        if (floatToggleBtn) floatToggleBtn.setAttribute('aria-label', 'Play Sacred Hymn');
        if (eqVisualizer) eqVisualizer.classList.remove('animating');
      }
    }
  }

  // Welcome Modal actions
  if (modal) {
    const hasInteracted = sessionStorage.getItem('church_audio_modal_dismissed');
    if (!hasInteracted) {
      setTimeout(() => {
        modal.classList.add('show-modal');
      }, 500);
    } else if (sessionStorage.getItem('church_audio_enabled') === 'true') {
      startAudio();
    }

    if (playModalBtn) {
      playModalBtn.addEventListener('click', () => {
        modal.classList.remove('show-modal');
        sessionStorage.setItem('church_audio_modal_dismissed', 'true');
        sessionStorage.setItem('church_audio_enabled', 'true');
        startAudio();
      });
    }

    if (silentModalBtn) {
      silentModalBtn.addEventListener('click', () => {
        modal.classList.remove('show-modal');
        sessionStorage.setItem('church_audio_modal_dismissed', 'true');
        sessionStorage.setItem('church_audio_enabled', 'false');
      });
    }
  }

  // Floating Controller Toggle
  if (floatToggleBtn) {
    floatToggleBtn.addEventListener('click', () => {
      if (isPlaying) {
        pauseAudio();
        sessionStorage.setItem('church_audio_enabled', 'false');
      } else {
        startAudio();
        sessionStorage.setItem('church_audio_enabled', 'true');
      }
    });
  }

  // Volume control
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      if (audio) audio.volume = parseFloat(e.target.value);
    });
  }

  // Auto start on first user interaction anywhere if enabled
  document.addEventListener('click', function firstClickAudio() {
    if (sessionStorage.getItem('church_audio_enabled') === 'true' && (!audio || audio.paused) && !isPlaying) {
      startAudio();
    }
    document.removeEventListener('click', firstClickAudio);
  }, { once: true });
}

/* ==========================================================================
   2. Scroll Reveal Animations (Intersection Observer)
   ========================================================================== */

function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-slide-left, .reveal-slide-right, .reveal-zoom, .timeline-item, .mass-card, .org-card, .person-card, .chapel-card');

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.05
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    // Immediately reveal elements already near top of viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('revealed');
    }
    observer.observe(el);
  });
}

/* ==========================================================================
   3. Hero Slideshow Engine
   ========================================================================== */

function initHeroSlider() {
  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;

  const slides = [
    { title: 'Thrikkunathu Sehiyon Jacobite Syrian Church', sub: 'A Church Rooted in Faith, Growing in Love, Serving in Hope.' },
    { title: 'Sacred Sanctuary of Faith & Heritage', sub: 'Preserving Ancient Syrian Orthodox Traditions in Kunnackal.' },
    { title: 'Welcoming All to Worship & Fellowship', sub: 'Join us in Holy Qurbana and Community Ministry.' }
  ];

  let currentIdx = 0;
  const dotsContainer = heroSection.querySelector('.slider-dots');
  const heroContent = heroSection.querySelector('.hero-content');
  const heroTitle = heroSection.querySelector('.hero-content h2');
  const heroSub = heroSection.querySelector('.hero-content .sub');

  if (!dotsContainer) return;

  dotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('span');
    if (idx === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll('span');

  function goToSlide(index) {
    currentIdx = index;
    const slide = slides[index];

    if (heroContent) {
      heroContent.classList.add('text-animating');
      setTimeout(() => {
        if (heroTitle) heroTitle.textContent = slide.title;
        if (heroSub) heroSub.textContent = slide.sub;
        heroContent.classList.remove('text-animating');
      }, 350);
    } else {
      if (heroTitle) heroTitle.textContent = slide.title;
      if (heroSub) heroSub.textContent = slide.sub;
    }

    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  let slideInterval = setInterval(() => {
    goToSlide((currentIdx + 1) % slides.length);
  }, 6000);

  heroSection.addEventListener('mouseenter', () => clearInterval(slideInterval));
  heroSection.addEventListener('mouseleave', () => {
    slideInterval = setInterval(() => {
      goToSlide((currentIdx + 1) % slides.length);
    }, 6000);
  });
}

/* ==========================================================================
   4. Gallery Lightbox Modal & Filtering
   ========================================================================== */

function initGalleryLightbox() {
  const allInteractiveCards = Array.from(document.querySelectorAll('.gallery-item, .construction-photo-card, .facility-image-wrap'));
  if (allInteractiveCards.length === 0) return;

  let lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'gallery-lightbox';
    lightbox.className = 'lightbox-modal';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image preview modal');
    lightbox.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <div class="lightbox-header-bar">
          <span class="lightbox-counter">Photo 1 of 1</span>
          <button class="lightbox-close" aria-label="Close Lightbox">&times;</button>
        </div>
        <div class="lightbox-image-wrap">
          <button class="lightbox-nav-btn lightbox-prev" aria-label="Previous photo">&#10094;</button>
          <img class="lightbox-img" src="" alt="Enlarged photo view" />
          <button class="lightbox-nav-btn lightbox-next" aria-label="Next photo">&#10095;</button>
        </div>
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbCaption = lightbox.querySelector('.lightbox-caption');
  const lbCounter = lightbox.querySelector('.lightbox-counter');
  const lbClose = lightbox.querySelector('.lightbox-close');
  const lbOverlay = lightbox.querySelector('.lightbox-overlay');
  const lbPrev = lightbox.querySelector('.lightbox-prev');
  const lbNext = lightbox.querySelector('.lightbox-next');

  let activeList = [];
  let currentIdx = 0;

  function updateLightboxPhoto(idx) {
    if (!activeList.length) return;
    // Clamp index so it strictly stops at boundaries (stops at 1 and stops at 75)
    if (idx < 0) idx = 0;
    if (idx >= activeList.length) idx = activeList.length - 1;
    currentIdx = idx;

    const item = activeList[currentIdx];
    const img = item.querySelector('img');
    const title = item.dataset.title || (item.querySelector('.gallery-overlay h4, .gallery-overlay p, p, h4') || {}).textContent || (img ? img.alt : '') || '';
    const src = item.dataset.src || (img ? img.src : '');

    lbImg.src = src;
    lbImg.alt = title;
    lbCaption.textContent = title;
    lbCounter.textContent = `Photo ${currentIdx + 1} of ${activeList.length}`;

    // Boundaries: disable prev at first item, disable next at last item
    if (currentIdx === 0) {
      lbPrev.style.opacity = '0.3';
      lbPrev.style.pointerEvents = 'none';
    } else {
      lbPrev.style.opacity = '1';
      lbPrev.style.pointerEvents = 'auto';
    }

    if (currentIdx === activeList.length - 1) {
      lbNext.style.opacity = '0.3';
      lbNext.style.pointerEvents = 'none';
    } else {
      lbNext.style.opacity = '1';
      lbNext.style.pointerEvents = 'auto';
    }
  }

  allInteractiveCards.forEach(item => {
    item.addEventListener('click', () => {
      // Find the parent section to strictly isolate navigation within that section
      const parentSection = item.closest('section');
      if (parentSection) {
        activeList = Array.from(parentSection.querySelectorAll('.gallery-item, .construction-photo-card, .facility-image-wrap'));
      } else {
        activeList = [item];
      }

      const idx = activeList.indexOf(item);
      currentIdx = idx >= 0 ? idx : 0;
      updateLightboxPhoto(currentIdx);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLb = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (lbClose) lbClose.addEventListener('click', closeLb);
  if (lbOverlay) lbOverlay.addEventListener('click', closeLb);
  if (lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); updateLightboxPhoto(currentIdx - 1); });
  if (lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); updateLightboxPhoto(currentIdx + 1); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') updateLightboxPhoto(currentIdx - 1);
    else if (e.key === 'ArrowRight') updateLightboxPhoto(currentIdx + 1);
  });

  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) updateLightboxPhoto(currentIdx + 1);
    if (touchEndX > touchStartX + 50) updateLightboxPhoto(currentIdx - 1);
  }, { passive: true });
}

/* ==========================================================================
   5. Sticky Navigation & Header Transitions
   ========================================================================== */

function initStickyHeader() {
  const header = document.querySelector('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   6. Mobile Menu Toggle
   ========================================================================== */

function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  const navLinks = nav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle.checked = false;
    });
  });
}

/* ==========================================================================
  7. Dynamic Holy Qurbana Schedule Calculator
   ========================================================================== */

function initNextHolyMassCalculator() {
  const qurbanaTimeEl = document.querySelector('.qurbana-time');
  const qurbanaLocEl = document.querySelector('.qurbana-loc');
  if (!qurbanaTimeEl) return;

  const now = new Date();

  // 1. Calculate Next Sunday 8:00 AM Qurbana (Main Church)
  function getNextSundayMass(fromDate) {
    const d = new Date(fromDate);
    const day = d.getDay();
    const daysUntilSunday = (7 - day) % 7;
    
    const nextSunday = new Date(d);
    nextSunday.setDate(d.getDate() + daysUntilSunday);
    nextSunday.setHours(8, 0, 0, 0);

    // If today is Sunday and it's already past 8:00 AM, get next Sunday
    if (daysUntilSunday === 0 && d >= nextSunday) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }
    return {
      date: nextSunday,
      title: 'Holy Qurbana (Sunday)',
      location: 'Main Church, Kunnackal'
    };
  }

  // 2. Calculate 2nd Saturday 7:00 AM Qurbana (St. Mary's Chapel)
  function getSecondSaturday(year, month) {
    // 2nd Saturday falls between 8th and 14th of the month
    for (let day = 8; day <= 14; day++) {
      const d = new Date(year, month, day, 7, 0, 0, 0);
      if (d.getDay() === 6) { // 6 = Saturday
        return d;
      }
    }
    return null;
  }

  function getNextSecondSaturdayMass(fromDate) {
    let year = fromDate.getFullYear();
    let month = fromDate.getMonth();
    
    let satDate = getSecondSaturday(year, month);
    if (!satDate || fromDate >= satDate) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
      satDate = getSecondSaturday(year, month);
    }
    return {
      date: satDate,
      title: 'Holy Qurbana (2nd Sat)',
      location: "St. Mary's Chapel"
    };
  }

  const sundayMass = getNextSundayMass(now);
  const secondSatMass = getNextSecondSaturdayMass(now);

  // Pick whichever upcoming mass date/time is sooner
  let nextMass = sundayMass;
  if (secondSatMass.date && secondSatMass.date < sundayMass.date) {
    nextMass = secondSatMass;
  }

  // Format Date Output
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const targetDate = nextMass.date;
  const dayName = daysOfWeek[targetDate.getDay()];
  const monthName = months[targetDate.getMonth()];
  const dayNum = targetDate.getDate();
  
  let hours = targetDate.getHours();
  const minutes = targetDate.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;

  const isToday = now.toDateString() === targetDate.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = tomorrow.toDateString() === targetDate.toDateString();

  let formattedDateStr = '';
  if (isToday) {
    formattedDateStr = `Today • ${timeStr}`;
  } else if (isTomorrow) {
    formattedDateStr = `Tomorrow • ${timeStr}`;
  } else {
    formattedDateStr = `${dayName}, ${monthName} ${dayNum} • ${timeStr}`;
  }

  qurbanaTimeEl.textContent = formattedDateStr;
  if (qurbanaLocEl) {
    qurbanaLocEl.textContent = nextMass.location;
  }
}

/* ==========================================================================
   8. 365-Day Dynamic Daily Bible Verse Engine
   ========================================================================== */

function initDailyBibleVerse() {
  const quoteEl = document.querySelector('.verse-quote');
  const refEl = document.querySelector('.verse-ref');
  if (!quoteEl || !refEl) return;

  const bibleVerses = [
    { quote: "For where two or three gather in my name, there am I with them.", ref: "Matthew 18:20" },
    { quote: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
    { quote: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { quote: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
    { quote: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.", ref: "Jeremiah 29:11" },
    { quote: "Be strong and courageous. Do not be afraid; for the Lord your God is with you wherever you go.", ref: "Joshua 1:9" },
    { quote: "The Lord is my light and my salvation—whom shall I fear?", ref: "Psalm 27:1" },
    { quote: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
    { quote: "And we know that in all things God works for the good of those who love him.", ref: "Romans 8:28" },
    { quote: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", ref: "1 Corinthians 13:4" },
    { quote: "The steadfast love of the Lord never ceases; his mercies never come to an end.", ref: "Lamentations 3:22" },
    { quote: "Come to me, all you who are weary and burdened, and I will give you rest.", ref: "Matthew 11:28" },
    { quote: "God is our refuge and strength, an ever-present help in trouble.", ref: "Psalm 46:1" },
    { quote: "Your word is a lamp for my feet, a light on my path.", ref: "Psalm 119:105" },
    { quote: "Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.", ref: "Philippians 4:6" },
    { quote: "The peace of God, which transcends all understanding, will guard your hearts and minds.", ref: "Philippians 4:7" },
    { quote: "Give thanks to the Lord, for he is good; his love endures forever.", ref: "Psalm 107:1" },
    { quote: "The Lord will fight for you; you need only to be still.", ref: "Exodus 14:14" },
    { quote: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", ref: "Psalm 51:10" },
    { quote: "Draw near to God, and he will draw near to you.", ref: "James 4:8" },
    { quote: "For God so loved the world that he gave his one and only Son.", ref: "John 3:16" },
    { quote: "He heals the brokenhearted and binds up their wounds.", ref: "Psalm 147:3" },
    { quote: "The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness.", ref: "Galatians 5:22" },
    { quote: "Be still, and know that I am God.", ref: "Psalm 46:10" },
    { quote: "We walk by faith, not by sight.", ref: "2 Corinthians 5:7" },
    { quote: "Delight yourself in the Lord, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
    { quote: "Blessed are the peacemakers, for they will be called children of God.", ref: "Matthew 5:9" },
    { quote: "Set your minds on things above, not on earthly things.", ref: "Colossians 3:2" },
    { quote: "The Lord bless you and keep you; the Lord make his face shine on you.", ref: "Numbers 6:24-25" },
    { quote: "Wait for the Lord; be strong and take heart and wait for the Lord.", ref: "Psalm 27:14" },
    { quote: "In him was life, and that life was the light of all mankind.", ref: "John 1:4" },
    { quote: "Every good and perfect gift is from above, coming down from the Father of lights.", ref: "James 1:17" }
  ];

  // Calculate Day of Year (1 to 365)
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Cycle dynamically through 365 day sequence
  const verseIndex = (dayOfYear - 1) % bibleVerses.length;
  const todayVerse = bibleVerses[verseIndex];

  quoteEl.textContent = `"${todayVerse.quote}"`;
  refEl.textContent = `— ${todayVerse.ref}`;
}
