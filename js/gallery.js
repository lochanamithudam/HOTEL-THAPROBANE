/**
 * ==============================================================================
 * HOTEL THAPROBANE - PREMIUM VILLA GALLERY & LIGHTBOX ENGINE
 * File: js/gallery.js
 * Description: Ultra-luxury architectural showcase with interactive photo stage,
 *              quick room tabs, bottom thumbnail cards, view-all grid toggle,
 *              touch swipe, and full-screen cinema lightbox.
 * ==============================================================================
 */

// -------------------------------------------------------------
// 1. DATA CONFIGURATION: VILLA PHOTO REGISTRY
// -------------------------------------------------------------
const VILLA_GALLERIES = {
  // 1. Ceylon Heritage Private Plunge Villa (5 Authentic High-Res Photos)
  'heritage-villa': [
    {
      src: 'images/ceylon-heritage%20plung%20villa/Gemini_Generated_Image_keohvekeohvekeoh.jpg',
      caption: 'PRIVATE COBALT PLUNGE POOL & SUN DECK',
      alt: 'Twilight exterior view of Ceylon Heritage Villa showing illuminated private cobalt plunge pool, teak sun deck with luxury daybed, and tropical foliage',
      tag: 'Plunge Pool',
      sub: 'Exterior Deck',
      icon: 'fa-water',
      desc: 'Secluded 2.5m cobalt plunge pool with underwater illumination, teak sun lounger deck & tropical foliage privacy.'
    },
    {
      src: 'images/ceylon-heritage%20plung%20villa/Gemini_Generated_Image_s0udw9s0udw9s0ud.jpg',
      caption: 'HANDCRAFTED CEYLON MASTER BEDROOM',
      alt: 'Spacious master bedroom suite featuring handcrafted Ceylon teak king bed, soaring vaulted ceiling, and sliding glass doors opening to private plunge pool terrace',
      tag: 'Master Bedroom',
      sub: 'Teak King Suite',
      icon: 'fa-bed',
      desc: 'Handcrafted Ceylon teak king bed with Italian linen, soaring vaulted timber ceiling & pool terrace walkout.'
    },
    {
      src: 'images/ceylon-heritage%20plung%20villa/Gemini_Generated_Image_jqxk83jqxk83jqxk.jpg',
      caption: 'OPEN-AIR STONE EN-SUITE & GARDEN BATH',
      alt: 'Luxury open-air ensuite bathroom with twin natural stone basin sinks, sunken black soaking tub, and secluded tropical courtyard rain shower',
      tag: 'Stone En-Suite',
      sub: 'Open-Air Bath',
      icon: 'fa-bath',
      desc: 'Twin carved stone vanities, sunken black granite soaking tub & open-sky tropical courtyard rain shower.'
    },
    {
      src: 'images/ceylon-heritage%20plung%20villa/Gemini_Generated_Image_2tcshi2tcshi2tcs.jpg',
      caption: 'VAULTED LIVING SALON & GARDEN VERANDA',
      alt: 'Ceylon heritage living salon featuring vaulted timber ceiling, plush deep blue seating, carved coffee table, and views onto the private garden veranda',
      tag: 'Living Salon',
      sub: 'Garden Veranda',
      icon: 'fa-couch',
      desc: 'Vaulted timber salon with plush velvet lounges, bespoke Ceylon woodwork & peaceful garden veranda vistas.'
    },
    {
      src: 'images/ceylon-heritage%20plung%20villa/Gemini_Generated_Image_akt7pbakt7pbakt7.jpg',
      caption: 'SECLUDED IN-VILLA WELLNESS & SPA PAVILION',
      alt: 'Private in-villa wellness veranda with twin massage beds, floating flower bowls, candle lanterns, and natural stone plunge pool with waterfall spout',
      tag: 'Spa Pavilion',
      sub: 'Dual Veranda',
      icon: 'fa-spa',
      desc: 'Private dual massage veranda, candle lanterns, floating flower bowls & natural stone waterfall spout.'
    }
  ],

  'ocean-suite': [
    {
      src: 'images/royal-oceanfront-suite/penthouse_master_bedroom.jpg',
      caption: 'PANORAMIC OCEANFRONT MASTER BEDROOM',
      alt: 'Royal Oceanfront Penthouse master bedroom with bespoke teak King bed, soaring vaulted ceiling, and sliding glass doors opening to wrap-around ocean veranda',
      tag: 'Master Bedroom',
      sub: 'Oceanfront King Suite',
      icon: 'fa-bed',
      desc: 'Handcrafted teak King bed with crisp Italian linen, soaring vaulted timber ceiling & wrap-around ocean balcony walkout.'
    },
    {
      src: 'images/royal-oceanfront-suite/penthouse_jacuzzi_terrace.jpg',
      caption: 'OPEN-AIR MARBLE JACUZZI & SUNSET VERANDA',
      alt: 'Top-floor wrap-around teak veranda with sunken marble hydrotherapy Jacuzzi overlooking the turquoise ocean with champagne setup',
      tag: 'Ocean Jacuzzi',
      sub: 'Wrap-Around Terrace',
      icon: 'fa-hot-tub-person',
      desc: 'Sunken marble hydrotherapy Jacuzzi perched above the sea with teak sundeck, plush loungers & golden sunset vistas.'
    },
    {
      src: 'images/royal-oceanfront-suite/penthouse_living_salon.jpg',
      caption: 'DOUBLE-HEIGHT LIVING SALON & OCEAN HORIZON',
      alt: 'Double-height luxury penthouse living room with designer curved sofas, marble coffee table, and panoramic floor-to-ceiling glass ocean walls',
      tag: 'Living Salon',
      sub: 'Top-Floor Lounge',
      icon: 'fa-couch',
      desc: 'Expansive double-height penthouse salon with curved cream sofas, bespoke teak-marble table & 270° uninterrupted ocean horizon.'
    },
    {
      src: 'images/royal-oceanfront-suite/penthouse_ensuite_bathroom.jpg',
      caption: 'PANORAMIC MARBLE SOAKING TUB & EN-SUITE',
      alt: 'Penthouse master ensuite bathroom featuring a freestanding marble soaking tub beside floor-to-ceiling glass overlooking the turquoise ocean',
      tag: 'Marble En-Suite',
      sub: 'Spa Sanctuary',
      icon: 'fa-bath',
      desc: 'Freestanding marble soaking tub, carved natural stone double vanity, brushed brass fixtures & sweeping ocean views.'
    }
  ],
  'premium-view': [
    {
      src: 'images/Ocean%20Horizon%20infinity/villa_exterior_infinity_pool_1792898101425.jpg',
      caption: 'CANTILEVERED INFINITY PLUNGE POOL & TIMBER DECK',
      alt: 'Cantilevered oceanfront infinity plunge pool merging with the horizon, personal timber sun deck, and direct golden beach access',
      tag: 'Infinity Plunge Pool',
      sub: 'Shoreline Deck',
      icon: 'fa-water-ladder',
      desc: 'Cantilevered infinity plunge pool merging directly with the ocean horizon, personal timber deck with plush loungers & private beach walkout.'
    },
    {
      src: 'images/Ocean%20Horizon%20infinity/villa_master_bedroom_1792898134713.jpg',
      caption: 'OCEANFRONT CANOPY MASTER BEDROOM',
      alt: 'Spacious luxury master bedroom featuring king-size canopy bed, soaring ceilings, panoramic floor-to-ceiling coastal glass, and ocean views',
      tag: 'Master Bedroom',
      sub: 'King Canopy Suite',
      icon: 'fa-bed',
      desc: 'Handcrafted king-size canopy bed, dramatic coastal floor-to-ceiling glass, Italian linens & walkout access to the plunge pool terrace.'
    },
    {
      src: 'images/Ocean%20Horizon%20infinity/villa_oceanview_bathtub_1792898174168.jpg',
      caption: 'DEEP SOAKING OCEAN-VIEW BATHTUB & EN-SUITE',
      alt: 'Sculpted freestanding deep soaking bathtub with floor-to-ceiling panoramic ocean view, marble vanity, and walk-in rain shower',
      tag: 'Ocean-View Bath',
      sub: 'Deep Soaking Tub',
      icon: 'fa-bath',
      desc: 'Freestanding deep soaking bathtub positioned against panoramic ocean glass, dual stone vanities & organic botanical amenities.'
    },
    {
      src: 'images/Ocean%20Horizon%20infinity/villa_floating_breakfast_1792898209208.jpg',
      caption: 'SIGNATURE FLOATING PLUNGE POOL BREAKFAST',
      alt: 'Signature luxury floating breakfast tray in the private infinity plunge pool with fresh tropical fruits, pastries, juices, and turquoise ocean backdrop',
      tag: 'Floating Breakfast',
      sub: 'In-Pool Dining',
      icon: 'fa-utensils',
      desc: 'Complimentary artisanal floating breakfast tray with tropical fruits, fresh pastries, Ceylon tea & sparkling champagne in your plunge pool.'
    }
  ],
  'cinnamon-pavilion': [],
  'presidential-villa': [],
  'sunset-pavilion': []
};

// -------------------------------------------------------------
// 2. LIGHTBOX SINGLETON CONTROLLER
// -------------------------------------------------------------
class LuxuryLightbox {
  constructor() {
    this.modal = null;
    this.currentGallery = [];
    this.currentIndex = 0;
    this.villaTitle = '';
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    let el = document.getElementById('luxuryGalleryLightbox');
    if (!el) {
      el = document.createElement('div');
      el.id = 'luxuryGalleryLightbox';
      el.className = 'gallery-lightbox';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', 'Luxury Villa Photo Gallery');
      el.innerHTML = `
        <div class="lightbox-header">
          <div class="lightbox-title-area">
            <span class="lightbox-hotel-tag">Hotel Thaprobane</span>
            <span class="lightbox-villa-name" id="lightboxVillaTitle">Villa Gallery</span>
          </div>
          <div class="lightbox-header-right">
            <div class="lightbox-counter" id="lightboxCounter">1 / 5</div>
            <button class="lightbox-close-btn" id="lightboxCloseBtn" aria-label="Close Lightbox (Esc)">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div class="lightbox-stage" id="lightboxStage">
          <button class="lightbox-nav-arrow prev" id="lightboxPrevBtn" aria-label="Previous Photo (Left Arrow)">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          
          <div class="lightbox-img-container">
            <img src="" alt="" class="lightbox-main-img" id="lightboxMainImg">
            <div class="lightbox-caption-display">
              <span class="lightbox-caption-text" id="lightboxCaptionText"></span>
              <span class="lightbox-alt-text" id="lightboxAltText"></span>
            </div>
          </div>

          <button class="lightbox-nav-arrow next" id="lightboxNextBtn" aria-label="Next Photo (Right Arrow)">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div class="lightbox-thumbnail-strip-wrapper">
          <div class="lightbox-thumbnail-strip" id="lightboxThumbStrip"></div>
        </div>
      `;
      document.body.appendChild(el);
    }
    this.modal = el;
    this.imgEl = el.querySelector('#lightboxMainImg');
    this.counterEl = el.querySelector('#lightboxCounter');
    this.titleEl = el.querySelector('#lightboxVillaTitle');
    this.captionEl = el.querySelector('#lightboxCaptionText');
    this.altEl = el.querySelector('#lightboxAltText');
    this.thumbStrip = el.querySelector('#lightboxThumbStrip');
    this.stage = el.querySelector('#lightboxStage');
  }

  bindEvents() {
    this.modal.querySelector('#lightboxCloseBtn').addEventListener('click', () => this.close());
    this.modal.querySelector('#lightboxPrevBtn').addEventListener('click', () => this.prev());
    this.modal.querySelector('#lightboxNextBtn').addEventListener('click', () => this.next());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target === this.stage || e.target.classList.contains('lightbox-img-container')) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('active')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    this.stage.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.stage.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) this.next();
      else this.prev();
    }
  }

  open(items, index = 0, title = 'Villa Gallery') {
    if (!items || !items.length) return;
    this.currentGallery = items;
    this.currentIndex = index;
    this.villaTitle = title;

    if (this.titleEl) this.titleEl.textContent = title;
    this.renderThumbnails();
    this.updateImage(false);

    this.modal.classList.add('active');
    document.body.classList.add('gallery-modal-open');
  }

  close() {
    this.modal.classList.remove('active');
    document.body.classList.remove('gallery-modal-open');
    if (typeof this.onClose === 'function') {
      this.onClose(this.currentIndex);
    }
  }

  next() {
    if (!this.currentGallery.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.currentGallery.length;
    this.updateImage(true);
  }

  prev() {
    if (!this.currentGallery.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.currentGallery.length) % this.currentGallery.length;
    this.updateImage(true);
  }

  updateImage(animate = true) {
    const item = this.currentGallery[this.currentIndex];
    if (!item) return;

    if (animate) {
      this.imgEl.style.opacity = '0';
      this.imgEl.style.transform = 'scale(0.97)';
      setTimeout(() => {
        this.imgEl.src = item.src;
        this.imgEl.alt = item.alt;
        this.imgEl.style.opacity = '1';
        this.imgEl.style.transform = 'scale(1)';
      }, 150);
    } else {
      this.imgEl.src = item.src;
      this.imgEl.alt = item.alt;
      this.imgEl.style.opacity = '1';
      this.imgEl.style.transform = 'scale(1)';
    }

    if (this.captionEl) this.captionEl.textContent = item.caption;
    if (this.altEl) this.altEl.textContent = item.desc || item.alt;
    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentIndex + 1} / ${this.currentGallery.length}`;
    }

    const thumbs = this.thumbStrip.querySelectorAll('.lightbox-thumb');
    thumbs.forEach((th, i) => {
      if (i === this.currentIndex) {
        th.classList.add('active');
        const offset = th.offsetLeft - this.thumbStrip.offsetLeft - (this.thumbStrip.clientWidth / 2) + (th.clientWidth / 2);
        this.thumbStrip.scrollTo({ left: offset, behavior: 'smooth' });
      } else {
        th.classList.remove('active');
      }
    });

    this.preloadAdjacent();
  }

  preloadAdjacent() {
    const nextIdx = (this.currentIndex + 1) % this.currentGallery.length;
    const prevIdx = (this.currentIndex - 1 + this.currentGallery.length) % this.currentGallery.length;
    [nextIdx, prevIdx].forEach(idx => {
      const item = this.currentGallery[idx];
      if (item && item.src) {
        const img = new Image();
        img.src = item.src;
      }
    });
  }

  renderThumbnails() {
    this.thumbStrip.innerHTML = '';
    this.currentGallery.forEach((item, i) => {
      const thumb = document.createElement('div');
      thumb.className = `lightbox-thumb ${i === this.currentIndex ? 'active' : ''}`;
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('aria-label', `View image ${i + 1}: ${item.caption}`);
      thumb.innerHTML = `<img src="${item.src}" alt="${item.caption}">`;
      thumb.addEventListener('click', () => {
        this.currentIndex = i;
        this.updateImage(true);
      });
      this.thumbStrip.appendChild(thumb);
    });
  }
}

// -------------------------------------------------------------
// 3. LUXURY GALLERY CONTROLLER FOR VILLA CARDS
// -------------------------------------------------------------
class LuxuryGallerySystem {
  constructor() {
    this.lightbox = new LuxuryLightbox();
    this.initGalleries();
  }

  initGalleries() {
    const wrappers = document.querySelectorAll('.premium-gallery-wrapper');
    wrappers.forEach(wrapper => {
      const villaCard = wrapper.closest('.villa-card');
      const galleryId = wrapper.dataset.galleryId || villaCard?.getAttribute('data-room');
      const villaTitle = villaCard?.querySelector('.villa-title')?.textContent?.trim() || 'Luxury Villa';
      const photos = VILLA_GALLERIES[galleryId];

      if (!photos || photos.length === 0) {
        wrapper.style.display = 'none';
        wrapper.classList.add('is-hidden');
        return;
      }

      wrapper.style.display = '';
      wrapper.classList.remove('is-hidden');

      this.renderShowcaseGallery(wrapper, photos, villaTitle);
    });
  }

  renderShowcaseGallery(wrapper, photos, villaTitle) {
    let currentIndex = 0;
    let isGridView = false;

    // Eagerly preload all villa photos in memory for instant switching with zero flicker
    photos.forEach(photo => {
      const preloadImg = new Image();
      preloadImg.src = photo.src;
    });

    // Build Toolbar HTML
    let tabsHtml = '';
    photos.forEach((photo, idx) => {
      tabsHtml += `
        <button class="gallery-room-tab ${idx === 0 ? 'active' : ''}" data-index="${idx}" role="tab" aria-selected="${idx === 0}">
          <i class="fa-solid ${photo.icon || 'fa-camera'}"></i>
          <span>${photo.tag || photo.caption}</span>
        </button>
      `;
    });

    // Build Stage Slides HTML
    let slidesHtml = '';
    photos.forEach((photo, idx) => {
      slidesHtml += `
        <div class="stage-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
          <img src="${photo.src}" 
               alt="${photo.alt}" 
               class="stage-slide-img" 
               ${idx === 0 ? 'fetchpriority="high"' : ''} 
               decoding="async">
        </div>
      `;
    });

    // Build Bottom Filmstrip Thumbnails HTML
    let thumbsHtml = '';
    photos.forEach((photo, idx) => {
      const numStr = (idx + 1).toString().padStart(2, '0');
      thumbsHtml += `
        <button class="thumb-card ${idx === 0 ? 'active' : ''}" data-index="${idx}" role="tab" aria-selected="${idx === 0}" aria-label="View ${photo.caption}">
          <div class="thumb-img-box">
            <img src="${photo.src}" alt="${photo.tag} thumbnail" loading="lazy">
            <span class="thumb-num">${numStr}</span>
          </div>
          <div class="thumb-info">
            <span class="thumb-label">${photo.tag || `Photo ${idx + 1}`}</span>
            <span class="thumb-sub">${photo.sub || 'Sanctuary'}</span>
          </div>
          <div class="thumb-active-indicator"></div>
        </button>
      `;
    });

    // Build All-Photos Grid HTML (5 Distinct Spacious Cards)
    let gridHtml = '';
    photos.forEach((photo, idx) => {
      const numStr = (idx + 1).toString().padStart(2, '0');
      gridHtml += `
        <article class="all-grid-card" data-index="${idx}" tabindex="0" role="button" aria-label="Open ${photo.caption}">
          <div class="all-grid-img-wrap">
            <img src="${photo.src}" alt="${photo.alt}" loading="lazy" decoding="async">
            <span class="all-grid-badge">${numStr} · ${photo.tag || 'Villa Space'}</span>
            <span class="all-grid-zoom-pill">
              <i class="fa-solid fa-expand"></i> Inspect
            </span>
          </div>
          <div class="all-grid-body">
            <h3 class="all-grid-title">${photo.caption}</h3>
            <p class="all-grid-desc">${photo.desc || photo.alt}</p>
            <div class="all-grid-footer">
              <span class="all-grid-room-tag">
                <i class="fa-solid ${photo.icon || 'fa-camera'}"></i> ${photo.sub || 'Hotel Thaprobane'}
              </span>
              <span class="all-grid-cta">
                View High-Res <i class="fa-solid fa-arrow-right"></i>
              </span>
            </div>
          </div>
        </article>
      `;
    });

    // Assemble Full Container HTML
    wrapper.innerHTML = `
      <div class="gallery-toolbar">
        <div class="gallery-tabs-scroll">
          <div class="gallery-room-tabs" role="tablist">
            ${tabsHtml}
          </div>
        </div>
        <div class="gallery-view-actions">
          <button class="gallery-mode-toggle" aria-label="Switch between single showcase and all photos grid">
            <i class="fa-solid fa-table-cells-large"></i>
            <span class="mode-text">View All ${photos.length} Photos</span>
          </button>
          <button class="gallery-fullscreen-action" aria-label="Open Fullscreen Lightbox">
            <i class="fa-solid fa-expand"></i>
            <span>Fullscreen</span>
          </button>
        </div>
      </div>

      <!-- Single Photo Showcase Stage -->
      <div class="gallery-showcase-view active">
        <div class="gallery-showcase-stage" role="region" aria-label="Villa Photo Showcase">
          <div class="stage-top-bar">
            <div class="stage-counter-badge">
              <span class="counter-curr">01</span>
              <span class="counter-sep">/</span>
              <span class="counter-total">0${photos.length}</span>
              <span class="counter-dot">•</span>
              <span class="counter-room-name">${photos[0].tag}</span>
            </div>
            <button class="stage-expand-btn" aria-label="Open Fullscreen Lightbox">
              <i class="fa-solid fa-expand"></i>
              <span>VIEW FULLSCREEN</span>
            </button>
          </div>

          <button class="stage-nav-arrow prev" aria-label="Previous Photo">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button class="stage-nav-arrow next" aria-label="Next Photo">
            <i class="fa-solid fa-chevron-right"></i>
          </button>

          <div class="stage-slides-container">
            ${slidesHtml}
          </div>


        </div>

        <!-- Bottom Filmstrip Thumbnails Row -->
        <div class="gallery-thumbnail-filmstrip" role="tablist" aria-label="Photo Thumbnails">
          ${thumbsHtml}
        </div>
      </div>

      <!-- All Photos Expansive Grid -->
      <div class="gallery-all-grid-view">
        ${gridHtml}
      </div>
    `;

    // Elements inside wrapper
    const showcaseView = wrapper.querySelector('.gallery-showcase-view');
    const allGridView = wrapper.querySelector('.gallery-all-grid-view');
    const modeToggleBtn = wrapper.querySelector('.gallery-mode-toggle');
    const modeText = modeToggleBtn.querySelector('.mode-text');
    const modeIcon = modeToggleBtn.querySelector('i');
    const fullscreenActionBtn = wrapper.querySelector('.gallery-fullscreen-action');
    const stageExpandBtn = wrapper.querySelector('.stage-expand-btn');

    const slides = wrapper.querySelectorAll('.stage-slide');
    const tabs = wrapper.querySelectorAll('.gallery-room-tab');
    const thumbs = wrapper.querySelectorAll('.thumb-card');
    const gridCards = wrapper.querySelectorAll('.all-grid-card');

    const counterCurr = wrapper.querySelector('.counter-curr');
    const counterRoomName = wrapper.querySelector('.counter-room-name');


    const prevBtn = wrapper.querySelector('.stage-nav-arrow.prev');
    const nextBtn = wrapper.querySelector('.stage-nav-arrow.next');
    const stage = wrapper.querySelector('.gallery-showcase-stage');

    let transitionLock = false;

    // Function to set active photo index with 3D page-flip book-turn animation
    const goToIndex = (index, fromUser = false, direction = 1) => {
      if (transitionLock) return;
      const prevIndex = currentIndex;
      currentIndex = (index + photos.length) % photos.length;
      if (currentIndex === prevIndex) return;
      const photo = photos[currentIndex];

      transitionLock = true;

      const incoming = slides[currentIndex];
      const outgoing = slides[prevIndex];

      // Outgoing fold-away direction
      const foldExit   = direction > 0 ? 'rotateY(-90deg)' : 'rotateY(90deg)';
      // Incoming unfold start position
      const unfoldFrom = direction > 0 ? 'rotateY(90deg)'  : 'rotateY(-90deg)';

      // --- Phase 1: Fold the outgoing page away ---
      if (outgoing) {
        outgoing.style.transition = 'none';
        outgoing.style.transform  = 'rotateY(0deg)';
        outgoing.style.opacity    = '1';
        outgoing.style.visibility = 'visible';
        outgoing.style.zIndex     = '3';
        outgoing.getBoundingClientRect(); // reflow
        outgoing.style.transition = 'transform 0.32s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.28s ease';
        outgoing.style.transform  = foldExit;
        outgoing.style.opacity    = '0.3';
      }

      // --- Phase 2: After half-flip, unfold the incoming page ---
      setTimeout(() => {
        // Snap incoming into starting (off-screen rotated) position instantly
        incoming.style.transition = 'none';
        incoming.style.transform  = unfoldFrom;
        incoming.style.opacity    = '0.3';
        incoming.style.visibility = 'visible';
        incoming.style.zIndex     = '4';
        incoming.getBoundingClientRect(); // reflow

        // Unfold into full view
        incoming.style.transition = 'transform 0.34s cubic-bezier(0, 0.55, 0.45, 1), opacity 0.28s ease';
        incoming.style.transform  = 'rotateY(0deg)';
        incoming.style.opacity    = '1';

        // Clean up after animation ends
        setTimeout(() => {
          slides.forEach((sl, idx) => {
            if (idx === currentIndex) {
              sl.classList.add('active');
            } else {
              sl.classList.remove('active');
            }
            sl.style.transition = '';
            sl.style.transform  = '';
            sl.style.opacity    = '';
            sl.style.visibility = '';
            sl.style.zIndex     = '';
          });
          transitionLock = false;
        }, 360);
      }, 300);

      // Update tabs
      tabs.forEach((tb, idx) => {
        const isActive = idx === currentIndex;
        tb.classList.toggle('active', isActive);
        tb.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive && fromUser) {
          tb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });

      // Update thumbs
      thumbs.forEach((th, idx) => {
        const isActive = idx === currentIndex;
        th.classList.toggle('active', isActive);
        th.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive && fromUser) {
          th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });

      // Update counter
      if (counterCurr) counterCurr.textContent = (currentIndex + 1).toString().padStart(2, '0');
      if (counterRoomName) counterRoomName.textContent = photo.tag || photo.caption;
    };

    // Navigation buttons
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToIndex(currentIndex - 1, true, -1);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToIndex(currentIndex + 1, true, 1);
    });

    // Room tab clicks
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const idx = parseInt(tab.dataset.index, 10);
        goToIndex(idx, true);
        if (isGridView) {
          toggleMode();
        }
      });
    });

    // Thumbnail clicks
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.dataset.index, 10);
        goToIndex(idx, true);
      });
    });

    // Synchronize stage index when lightbox is closed
    this.lightbox.onClose = (idx) => {
      goToIndex(idx, false);
    };

    // Tracking for swipe vs click
    let didSwipe = false;
    let touchStartX = 0;
    let isDragging = false;
    let dragStartX = 0;



    // Toggle Between Single Showcase & All Photos Grid
    const toggleMode = () => {
      isGridView = !isGridView;
      if (isGridView) {
        showcaseView.classList.remove('active');
        allGridView.classList.add('active');
        modeText.textContent = 'Single Showcase';
        modeIcon.className = 'fa-solid fa-panorama';
      } else {
        allGridView.classList.remove('active');
        showcaseView.classList.add('active');
        modeText.textContent = `View All ${photos.length} Photos`;
        modeIcon.className = 'fa-solid fa-table-cells-large';
        goToIndex(currentIndex, true);
      }
    };

    modeToggleBtn.addEventListener('click', toggleMode);

    // Desktop Mouse Drag to slide photos
    stage.addEventListener('mousedown', (e) => {
      if (e.target.closest('.stage-nav-arrow') || e.target.closest('.stage-expand-btn')) return;
      isDragging = true;
      didSwipe = false;
      dragStartX = e.clientX;
    });

    stage.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      if (Math.abs(e.clientX - dragStartX) > 8) {
        didSwipe = true;
      }
    });

    const handleMouseUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diff = dragStartX - e.clientX;
      if (Math.abs(diff) > 40) {
        didSwipe = true;
        if (diff > 0) goToIndex(currentIndex + 1, true, 1);
        else goToIndex(currentIndex - 1, true, -1);
      }
    };

    stage.addEventListener('mouseup', handleMouseUp);
    stage.addEventListener('mouseleave', () => { isDragging = false; });

    // Mobile / Tablet Touch Swipe handling on Stage
    stage.addEventListener('touchstart', (e) => {
      didSwipe = false;
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        didSwipe = true;
        if (diff > 0) goToIndex(currentIndex + 1, true, 1);
        else goToIndex(currentIndex - 1, true, -1);
      }
    }, { passive: true });

    // Keyboard Arrow Keys (Left / Right) Navigation when gallery is in view
    document.addEventListener('keydown', (e) => {
      if (this.lightbox.modal && this.lightbox.modal.classList.contains('active')) return;
      const rect = stage.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowRight') {
        goToIndex(currentIndex + 1, true, 1);
      } else if (e.key === 'ArrowLeft') {
        goToIndex(currentIndex - 1, true, -1);
      }
    });
  }
}

// Robust Initialization
function initGallerySystem() {
  if (!window.hotelGallerySystem) {
    window.hotelGallerySystem = new LuxuryGallerySystem();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallerySystem);
} else {
  initGallerySystem();
}
