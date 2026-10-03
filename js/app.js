/**
 * HOTEL THAPROBANE - Interactive Experience Script
 * Handles Hero Carousel, Live Price Checker, Room Filters, 360 Tour, Testimonial Slider, Animations & Reservations
 */

// Shared Room Pricing Dictionary
const roomRates = {
  'ocean-suite': { name: 'Royal Oceanfront Penthouse Suite', baseRate: 480, tax: 0.12 },
  'heritage-villa': { name: 'Ceylon Heritage Private Plunge Villa', baseRate: 360, tax: 0.12 },
  'premium-view': { name: 'Taprobane Premium Ocean King', baseRate: 250, tax: 0.12 },
  'cinnamon-pavilion': { name: 'Cinnamon Garden Luxury Pavilion', baseRate: 210, tax: 0.12 },
  'presidential-villa': { name: 'Imperial 3-Bedroom Oceanfront Estate', baseRate: 890, tax: 0.12 }
};

// Smart API Endpoint Resolver (works in Live Server, direct file, Docker, or Node port 5000)
function getApiEndpoint(route) {
  const isLocalDevServer = window.location.protocol === 'file:' || 
    (window.location.hostname === 'localhost' && window.location.port !== '5000' && window.location.port !== '8080') ||
    (window.location.hostname === '127.0.0.1' && window.location.port !== '5000' && window.location.port !== '8080');

  if (isLocalDevServer) {
    return `http://localhost:5000${route}`;
  }
  return route;
}

// Helper: Format Date to YYYY-MM-DD in local timezone
function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Global Toast Helper
function showToast(message) {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-gem" style="color:#0077b6;"></i> <span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header Sticky Effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Luxury Slide-out Menu Overlay
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const luxuryMenuOverlay = document.getElementById('luxuryMenuOverlay');
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  const menuCloseBackdrop = document.getElementById('menuCloseBackdrop');
  const drawerLinks = document.querySelectorAll('.drawer-nav-item, #drawerBookBtn');

  function openLuxuryMenu() {
    if (luxuryMenuOverlay) {
      luxuryMenuOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLuxuryMenu() {
    if (luxuryMenuOverlay) {
      luxuryMenuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (menuToggleBtn) menuToggleBtn.addEventListener('click', openLuxuryMenu);
  if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeLuxuryMenu);
  if (menuCloseBackdrop) menuCloseBackdrop.addEventListener('click', closeLuxuryMenu);
  drawerLinks.forEach(link => link.addEventListener('click', closeLuxuryMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && luxuryMenuOverlay && luxuryMenuOverlay.classList.contains('active')) {
      closeLuxuryMenu();
    }
  });

  // Ambient Hero Background Video Auto-play
  const heroBgVideo = document.querySelector('.hero-bg-video');
  if (heroBgVideo) {
    heroBgVideo.muted = true;
    heroBgVideo.play().catch(() => {});
  }

  // 2. Hero Carousel Slider
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  function startSlideShow() {
    slideInterval = setInterval(nextSlide, 6000);
  }

  function resetSlideShow() {
    clearInterval(slideInterval);
    startSlideShow();
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.slide, 10);
      showSlide(idx);
      resetSlideShow();
    });
  });

  startSlideShow();

  // 3. Datepicker Setup with Local Timezone & Dynamic Min Date
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');

  if (checkinInput && checkoutInput) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 3);

    const todayStr = formatLocalDate(today);
    const futureStr = formatLocalDate(future);

    checkinInput.value = todayStr;
    checkinInput.min = todayStr;
    checkoutInput.value = futureStr;
    checkoutInput.min = todayStr;

    // Update checkout min date when checkin changes
    checkinInput.addEventListener('change', () => {
      if (checkinInput.value) {
        const nextDay = new Date(checkinInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = formatLocalDate(nextDay);
        checkoutInput.min = nextDayStr;

        if (checkoutInput.value <= checkinInput.value) {
          checkoutInput.value = nextDayStr;
        }
        calculateBookingSummary();
      }
    });

    checkoutInput.addEventListener('change', calculateBookingSummary);
  }

  // 4. Live Price Calculation & Modal Display
  const bookingForm = document.getElementById('hero-booking-form');
  const modalBackdrop = document.getElementById('booking-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function calculateBookingSummary() {
    const roomType = document.getElementById('room-type')?.value || 'ocean-suite';
    const checkin = new Date(checkinInput?.value || Date.now());
    const checkout = new Date(checkoutInput?.value || Date.now());
    const guests = parseInt(document.getElementById('guests-count')?.value || '2', 10);

    let diffDays = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0 || isNaN(diffDays)) diffDays = 1;

    const roomData = roomRates[roomType] || roomRates['ocean-suite'];
    const subtotal = roomData.baseRate * diffDays;
    const taxes = Math.round(subtotal * roomData.tax);
    const total = subtotal + taxes;

    // Update modal elements
    const roomNameEl = document.getElementById('modal-room-name');
    const nightsEl = document.getElementById('modal-nights-count');
    const rateEl = document.getElementById('modal-nightly-rate');
    const subtotalEl = document.getElementById('modal-subtotal');
    const taxEl = document.getElementById('modal-taxes');
    const totalEl = document.getElementById('modal-total');

    if (roomNameEl) roomNameEl.textContent = roomData.name;
    if (nightsEl) nightsEl.textContent = `${diffDays} Night${diffDays > 1 ? 's' : ''} (${guests} Guests)`;
    if (rateEl) rateEl.textContent = `$${roomData.baseRate}/night`;
    if (subtotalEl) subtotalEl.textContent = `$${subtotal}`;
    if (taxEl) taxEl.textContent = `$${taxes}`;
    if (totalEl) totalEl.textContent = `$${total} USD`;

    // Update live estimate on hero bar
    const liveEstPrice = document.getElementById('live-estimate-price');
    if (liveEstPrice) {
      liveEstPrice.textContent = `Live Available: From $${roomData.baseRate}/night · Total ~$${total} for ${diffDays} nights`;
    }
  }

  // Listen to input changes on the widget for dynamic recalculation
  if (bookingForm) {
    bookingForm.addEventListener('change', calculateBookingSummary);
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateBookingSummary();
      if (modalBackdrop) modalBackdrop.classList.add('open');
    });
  }

  // Close Modal
  if (modalCloseBtn && modalBackdrop) {
    modalCloseBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
    });
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('open');
      }
    });
  }

  // Quick Book buttons in room cards
  const quickBookBtns = document.querySelectorAll('.room-quick-book');
  quickBookBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const roomKey = e.target.closest('[data-room]')?.dataset.room;
      if (roomKey) {
        const select = document.getElementById('room-type');
        if (select) select.value = roomKey;
        calculateBookingSummary();
        if (modalBackdrop) modalBackdrop.classList.add('open');
      }
    });
  });

  // 5. Unified Reservation Submission to Backend
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', async () => {
      const roomKey = document.getElementById('room-type')?.value || 'ocean-suite';
      const roomData = roomRates[roomKey] || { name: 'Royal Oceanfront Suite', baseRate: 480, tax: 0.12 };

      const checkIn = checkinInput?.value || formatLocalDate(new Date());
      const checkOut = checkoutInput?.value || formatLocalDate(new Date());
      const guestsSelect = document.getElementById('guests-count');
      const guests = guestsSelect ? guestsSelect.options[guestsSelect.selectedIndex]?.text : '2 Adults (Couple)';

      const guestNameInput = document.getElementById('modal-guest-name');
      const guestEmailInput = document.getElementById('modal-guest-email');
      const guestPhoneInput = document.getElementById('modal-guest-phone');

      const guestName = guestNameInput?.value.trim() || '';
      const guestEmail = guestEmailInput?.value.trim() || '';
      const guestPhone = guestPhoneInput?.value.trim() || '';

      if (!guestName) {
        alert('Please enter your full name for the reservation.');
        if (guestNameInput) guestNameInput.focus();
        return;
      }

      if (!guestEmail || !guestEmail.includes('@')) {
        alert('Please enter a valid email address so we can dispatch your confirmation.');
        if (guestEmailInput) guestEmailInput.focus();
        return;
      }

      const checkinDate = new Date(checkIn);
      const checkoutDate = new Date(checkOut);
      let nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      if (nights <= 0 || isNaN(nights)) nights = 1;

      const subtotal = roomData.baseRate * nights;
      const tax = Math.round(subtotal * roomData.tax);
      const totalAmount = subtotal + tax;

      const bookingDetails = {
        roomCategory: roomData.name,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
        nights: nights,
        subtotal: subtotal,
        tax: tax,
        totalAmount: totalAmount,
        guestName: guestName,
        guestEmail: guestEmail,
        guestPhone: guestPhone || 'Not Provided'
      };

      try {
        modalConfirmBtn.disabled = true;
        modalConfirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirming Reservation...';

        const endpoint = getApiEndpoint('/api/bookings');

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingDetails)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Server returned error`);
        }

        const result = await response.json();

        if (modalBackdrop) modalBackdrop.classList.remove('open');

        if (result.success) {
          const refMsg = result.bookingRef ? ` [Ref: ${result.bookingRef}]` : '';
          const mailNote = result.emailSent
            ? ` Confirmation email sent to ${guestEmail}!`
            : ' (Saved, email pending)';
          showToast(`✨ Reservation confirmed${refMsg}!${mailNote}`);
          if (guestNameInput) guestNameInput.value = '';
          if (guestEmailInput) guestEmailInput.value = '';
          if (guestPhoneInput) guestPhoneInput.value = '';
        } else {
          showToast('⚠️ Reservation saved locally in backup mode.');
        }
      } catch (err) {
        console.error('Reservation API Error:', err);
        if (modalBackdrop) modalBackdrop.classList.remove('open');
        showToast('⚠️ Could not reach server (http://localhost:5000). Please ensure "npm start" is running.');
      } finally {
        modalConfirmBtn.disabled = false;
        modalConfirmBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Reserve with Free Cancellation';
      }
    });
  }

  // 6. Featured Rooms Filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const roomCards = document.querySelectorAll('.room-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      roomCards.forEach((card) => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
          setTimeout(() => (card.style.opacity = '1'), 50);
        } else {
          card.style.opacity = '0';
          setTimeout(() => (card.style.display = 'none'), 300);
        }
      });
    });
  });

  // 7. Photo Gallery: Staggered Slide-In + Filter + Lightbox
  const galFilterBtns = document.querySelectorAll('.gal-filter-btn');
  const galleryItems  = Array.from(document.querySelectorAll('.gallery-item'));
  const galleryGrid   = document.getElementById('gallery-grid');
  const lightbox      = document.getElementById('gallery-lightbox');
  const lightboxImg   = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev  = document.getElementById('lightbox-prev');
  const lightboxNext  = document.getElementById('lightbox-next');

  let currentLightboxIndex = 0;
  let activeItems = [...galleryItems];

  // Direction map: gives each item a slide direction based on position in grid
  // Pattern cycles: left, right, bottom, right, left, bottom, left, right …
  const directionCycle = [
    'slide-from-left', 'slide-from-right', 'slide-from-bottom',
    'slide-from-right','slide-from-left',  'slide-from-bottom',
    'slide-from-left', 'slide-from-right', 'slide-from-bottom',
    'slide-from-right','slide-from-left',  'slide-from-bottom',
  ];

  function getDirection(index) {
    return directionCycle[index % directionCycle.length];
  }

  // Trigger slide-in animation for a list of items with staggered delays
  function animateItems(items) {
    items.forEach((item, i) => {
      // Reset: remove all slide classes and slide-done so animation re-fires
      item.classList.remove('slide-from-left', 'slide-from-right', 'slide-from-bottom', 'slide-done');
      item.style.setProperty('--slide-delay', '0s');
      item.style.setProperty('--slide-dur', '0s');

      // Force a reflow to restart the animation
      void item.offsetWidth;

      const delay  = (i * 0.06).toFixed(2); // 60ms stagger between items
      const dur    = (0.6 + Math.min(i * 0.015, 0.2)).toFixed(2); // slight duration variation
      const dir    = getDirection(i);

      item.style.setProperty('--slide-delay', `${delay}s`);
      item.style.setProperty('--slide-dur',   `${dur}s`);
      item.classList.add(dir);

      // Once animation ends, add slide-done so hover effects kick in
      const totalMs = (parseFloat(delay) + parseFloat(dur)) * 1000 + 50;
      setTimeout(() => {
        item.classList.add('slide-done');
      }, totalMs);
    });
  }

  // IntersectionObserver: fire entrance animations when gallery scrolls into view
  let galleryAnimated = false;
  if (galleryGrid) {
    const galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !galleryAnimated) {
          galleryAnimated = true;
          animateItems(galleryItems.filter(it => !it.classList.contains('gallery-hidden')));
          galleryObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    galleryObserver.observe(galleryGrid);
  }

  // Gallery Filter with re-animation on filter change
  galFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      galFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.gfilter;

      // First: hide non-matching, reveal matching
      galleryItems.forEach((item) => {
        if (filter === 'all' || item.dataset.gcategory === filter) {
          item.classList.remove('gallery-hidden');
        } else {
          item.classList.add('gallery-hidden');
          // Reset animation state for hidden items so they re-animate on next show
          item.classList.remove('slide-from-left', 'slide-from-right', 'slide-from-bottom', 'slide-done');
          item.style.setProperty('--slide-delay', '0s');
          item.style.setProperty('--slide-dur',   '0s');
        }
      });

      // Re-animate the visible set
      const visible = galleryItems.filter(it => !it.classList.contains('gallery-hidden'));
      activeItems = visible;
      animateItems(visible);
    });
  });

  // Update active items on first load
  activeItems = [...galleryItems];

  // ── Lightbox with directional slide ──
  let lbDirection = 1; // 1 = forward (left slide), -1 = backward (right slide)

  function openLightbox(index, direction) {
    if (!lightbox || activeItems.length === 0) return;
    currentLightboxIndex = index;
    const item    = activeItems[index];
    const src     = item.dataset.gsrc || item.querySelector('img')?.src || '';
    const caption = item.dataset.gcaption || item.querySelector('img')?.alt || '';

    if (lightboxImg) {
      // Remove old slide classes, force reflow, add new
      lightboxImg.classList.remove('lb-slide-left', 'lb-slide-right');
      void lightboxImg.offsetWidth;
      lightboxImg.classList.add(direction >= 0 ? 'lb-slide-left' : 'lb-slide-right');
      lightboxImg.src = src;
      lightboxImg.alt = caption;
    }
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${activeItems.length}`;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    lbDirection = dir;
    currentLightboxIndex = (currentLightboxIndex + dir + activeItems.length) % activeItems.length;
    openLightbox(currentLightboxIndex, dir);
  }

  // Click gallery item to open lightbox
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      activeItems = galleryItems.filter((it) => !it.classList.contains('gallery-hidden'));
      const idx = activeItems.indexOf(item);
      lbDirection = 1;
      openLightbox(idx >= 0 ? idx : 0, 1);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev)  lightboxPrev.addEventListener('click',  () => navigateLightbox(-1));
  if (lightboxNext)  lightboxNext.addEventListener('click',  () => navigateLightbox(1));

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'Escape')     closeLightbox();
  });

  // 8. Testimonials Slider
  const testTrack = document.getElementById('testimonial-track');
  const prevTestBtn = document.getElementById('test-prev-btn');
  const nextTestBtn = document.getElementById('test-next-btn');
  let currentTestIndex = 0;
  const testSlides = document.querySelectorAll('.testimonial-slide');

  function updateTestimonialSlide() {
    if (testTrack && testSlides.length > 0) {
      testTrack.style.transform = `translateX(-${currentTestIndex * 100}%)`;
    }
  }

  if (prevTestBtn && nextTestBtn) {
    nextTestBtn.addEventListener('click', () => {
      currentTestIndex = (currentTestIndex + 1) % testSlides.length;
      updateTestimonialSlide();
    });

    prevTestBtn.addEventListener('click', () => {
      currentTestIndex = (currentTestIndex - 1 + testSlides.length) % testSlides.length;
      updateTestimonialSlide();
    });
  }


  // 9. Newsletter Subscription Handling
  const newsletterForm = document.getElementById('newsletter-form') || document.querySelector('.newsletter-form');
  const newsletterEmail = document.getElementById('newsletter-email') || document.getElementById('newsletter-input');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = newsletterEmail ? newsletterEmail.value.trim() : '';
      if (!email) {
        showToast('Please enter a valid email address.');
        return;
      }

      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subscribing...';
        }

        const endpoint = getApiEndpoint('/api/subscribe');

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const emailNote = data.emailSent
            ? ` Confirmation email sent to ${email}!`
            : '';
          showToast(`✨ Welcome to Thaprobane Club Privileges!${emailNote}`);
          newsletterForm.reset();
        } else {
          showToast(data.message || '⚠️ Subscription failed. Please try again.');
        }
      } catch (err) {
        console.error('Newsletter Fetch error:', err);
        showToast('⚠️ Unable to connect to server. Please ensure "npm start" is running on port 5000.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

// 10. Scroll Reveal Animations (Intersection Observer)
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  }
);

revealElements.forEach((el) => revealObserver.observe(el));

// Initialize booking calculation on first load
calculateBookingSummary();
});