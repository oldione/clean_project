// ── Header scroll effect ──────────────────────────────────────────────────────
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Mobile menu ───────────────────────────────────────────────────────────────
const burger  = document.getElementById('burger');
const navMenu = document.getElementById('nav-menu');

burger.addEventListener('click', () => {
  const open = navMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});

navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
  });
});

// ── Scroll-reveal (Intersection Observer) ────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // fire once
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function initReveal() {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    revealObserver.observe(el);
  });
}

// ── Organic dot particles in hero ────────────────────────────────────────────
function createParticles() {
  const hero = document.querySelector('.hero');
  if (!hero || window.innerWidth < 640) return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes orb-drift {
      0%   { transform: translate(0, 0) scale(1);       opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 0.5; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0.7); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  for (let i = 0; i < 10; i++) {
    const orb = document.createElement('div');
    const size = Math.random() * 6 + 4;
    const tx = (Math.random() - 0.5) * 120;
    const ty = -(Math.random() * 160 + 60);
    orb.style.cssText = `
      position: absolute; pointer-events: none; border-radius: 50%; z-index: 0;
      width: ${size}px; height: ${size}px;
      background: rgba(92,139,98,${(Math.random() * 0.2 + 0.08).toFixed(2)});
      left: ${Math.random() * 90 + 5}%;
      top:  ${Math.random() * 80 + 10}%;
      --tx: ${tx}px; --ty: ${ty}px;
      animation: orb-drift ${(Math.random() * 12 + 10).toFixed(1)}s ease-in-out
                 ${(Math.random() * 6).toFixed(1)}s infinite;
    `;
    hero.appendChild(orb);
  }
}

// ── Animated stat counters ────────────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// Trigger counters when stats bar enters viewport
const statsBar = document.querySelector('.stats-bar');
if (statsBar) {
  let counted = false;
  const statsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !counted) {
      counted = true;
      animateCounters();
    }
  }, { threshold: 0.4 });
  statsObserver.observe(statsBar);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const modal        = document.getElementById('booking-modal');
const modalOverlay = document.getElementById('modal-overlay');

function openModal() {
  modal.classList.add('open');
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modal.classList.remove('open');
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.open-modal-btn').forEach(btn => btn.addEventListener('click', openModal));
document.getElementById('modal-close-btn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Form submission ───────────────────────────────────────────────────────────
const bookingForm  = document.getElementById('booking-form');
const submitBtn    = document.getElementById('modal-submit-btn');
const contactRadios = document.querySelectorAll('input[name="contact_method"]');

contactRadios.forEach(r => r.addEventListener('change', () => { submitBtn.disabled = false; }));

bookingForm.addEventListener('submit', e => {
  e.preventDefault();

  const selected = document.querySelector('input[name="contact_method"]:checked');
  if (!selected) { showToast(t('modal_required_contact'), 'error'); return; }

  const area          = document.getElementById('area').value;
  const cleanType     = document.getElementById('clean-type');
  const cleanTypeText = cleanType.options[cleanType.selectedIndex].text;
  const name          = document.getElementById('client-name').value;
  const phone         = document.getElementById('client-phone').value;

  const addServices = [...document.querySelectorAll('input[name="add_service"]:checked')]
    .map(cb => cb.parentElement.querySelector('.cb-label').textContent.trim());

  const equip = [...document.querySelectorAll('input[name="equipment"]:checked')]
    .map(cb => cb.parentElement.querySelector('.cb-label').textContent.trim());

  if (selected.value === 'telegram') {
    const msg = buildTelegramMessage({ area, cleanTypeText, addServices, equip, name, phone });
    window.open('https://t.me/clcleanrs?text=' + encodeURIComponent(msg), '_blank');
    showToast(t('toast_tg'), 'success');
    closeModal();
    bookingForm.reset();
    submitBtn.disabled = true;
  } else {
    const formData = new FormData(bookingForm);
    formData.append('area_m2', area);
    formData.append('cleaning_type', cleanTypeText);
    formData.append('additional_services', addServices.join(', ') || t('tg_msg_none'));
    formData.append('equipment_available',  equip.join(', ')       || t('tg_msg_none'));

    fetch(bookingForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).then(res => {
      if (res.ok) {
        showToast(t('toast_email'), 'success');
        closeModal();
        bookingForm.reset();
        submitBtn.disabled = true;
      } else {
        showToast('Ошибка. Попробуйте ещё раз.', 'error');
      }
    }).catch(() => showToast('Ошибка соединения.', 'error'));
  }
});

function buildTelegramMessage({ area, cleanTypeText, addServices, equip, name, phone }) {
  return [
    t('tg_msg_header'), '',
    `${t('tg_msg_area')}: ${area ? area + ' м²' : '—'}`,
    `${t('tg_msg_type')}: ${cleanTypeText}`,
    `${t('tg_msg_add')}: ${addServices.length ? addServices.join(', ') : t('tg_msg_none')}`,
    `${t('tg_msg_equip')}: ${equip.length ? equip.join(', ') : t('tg_msg_none')}`,
    `${t('tg_msg_name')}: ${name || '—'}`,
    `${t('tg_msg_phone')}: ${phone || '—'}`,
  ].join('\n');
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className = 'toast--' + type + ' toast--visible';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('toast--visible'), 3200);
}

// ── Gallery lightbox ──────────────────────────────────────────────────────────
const galleryImages = [
  'assets/gallery/work-01.jpg',
  'assets/gallery/work-02.jpg',
  'assets/gallery/work-03.jpg',
  'assets/gallery/work-04.jpg',
  'assets/gallery/work-05.jpg',
  'assets/gallery/work-06.jpg',
  'assets/gallery/work-07.jpg',
  'assets/gallery/work-08.jpg',
];

const galleryOverlay  = document.getElementById('gallery-overlay');
const galleryModal    = document.getElementById('gallery-modal');
const galleryTrack    = document.getElementById('gallery-track');
const galleryCounter  = document.getElementById('gallery-counter');
const galleryPrev     = document.getElementById('gallery-prev');
const galleryNext     = document.getElementById('gallery-next');
const galleryCloseBtn = document.getElementById('gallery-close');
const galleryOpenBtn  = document.getElementById('gallery-open-btn');

let galleryIndex = 0;

function openGallery(index = 0) {
  galleryIndex = index;
  renderGallerySlide(0);
  galleryOverlay.classList.add('open');
  galleryModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  galleryOverlay.classList.remove('open');
  galleryModal.classList.remove('open');
  document.body.style.overflow = '';
}

function renderGallerySlide(direction) {
  const img = document.createElement('img');
  img.src = galleryImages[galleryIndex];
  img.alt = 'До и после уборки ' + (galleryIndex + 1);
  if (direction > 0)      img.className = 'gallery-enter-right';
  else if (direction < 0) img.className = 'gallery-enter-left';
  else                    img.className = 'gallery-enter-fade';
  galleryTrack.innerHTML = '';
  galleryTrack.appendChild(img);
  galleryCounter.textContent = (galleryIndex + 1) + ' / ' + galleryImages.length;
  galleryPrev.disabled = galleryIndex === 0;
  galleryNext.disabled = galleryIndex === galleryImages.length - 1;
}

function galleryGoTo(delta) {
  const next = galleryIndex + delta;
  if (next < 0 || next >= galleryImages.length) return;
  galleryIndex = next;
  renderGallerySlide(delta);
}

if (galleryOpenBtn) galleryOpenBtn.addEventListener('click', () => openGallery(0));
galleryCloseBtn.addEventListener('click', closeGallery);
galleryOverlay.addEventListener('click', closeGallery);
galleryPrev.addEventListener('click', () => galleryGoTo(-1));
galleryNext.addEventListener('click', () => galleryGoTo(1));

document.addEventListener('keydown', e => {
  if (!galleryModal.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  galleryGoTo(-1);
  if (e.key === 'ArrowRight') galleryGoTo(1);
  if (e.key === 'Escape')     closeGallery();
});

// Touch swipe support
let touchStartX = 0;
galleryModal.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
galleryModal.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) galleryGoTo(dx < 0 ? 1 : -1);
}, { passive: true });

// ── Smooth scroll for anchor links ────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - header.offsetHeight - 8, behavior: 'smooth' });
    }
  });
});

// ── Language switcher ─────────────────────────────────────────────────────────
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  submitBtn.disabled = true;
  initReveal();
  createParticles();
});
