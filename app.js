const root = document.documentElement;
const progressBar = document.querySelector('.scroll-progress span');
const header = document.querySelector('.site-header');
const heroImage = document.querySelector('.hero-image-wrap img');

requestAnimationFrame(() => document.body.classList.add('page-loaded'));

let ticking = false;
function updateScrollEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar?.style.setProperty('width', `${progress}%`);
  header?.classList.toggle('is-scrolled', window.scrollY > 20);
  if (heroImage && window.scrollY < window.innerHeight * 1.3) {
    heroImage.style.setProperty('--parallax-y', `${Math.min(window.scrollY * 0.055, 34)}px`);
  }
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
}, { passive: true });
updateScrollEffects();

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.global-nav');
const menuBackdrop = document.querySelector('.menu-backdrop');
const drawerMedia = window.matchMedia('(max-width: 1050px)');
const pageRegions = [
  document.querySelector('main'),
  document.querySelector('.site-footer'),
  document.querySelector('.mobile-contact-dock'),
  document.querySelector('.brand'),
  document.querySelector('.header-cta'),
].filter(Boolean);
let lockedScrollY = 0;

function setPageInert(inert) {
  pageRegions.forEach((region) => { region.inert = inert; });
}

function setMenuButtonState(open) {
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
}

function closeMenu({ restoreFocus = false } = {}) {
  const wasOpen = document.body.classList.contains('menu-open');
  document.body.classList.remove('menu-open');
  document.body.style.removeProperty('top');
  setPageInert(false);
  setMenuButtonState(false);

  if (drawerMedia.matches) {
    navigation?.setAttribute('aria-hidden', 'true');
    if (navigation) navigation.inert = true;
  } else {
    navigation?.removeAttribute('aria-hidden');
    if (navigation) navigation.inert = false;
  }

  if (wasOpen) window.scrollTo(0, lockedScrollY);
  if (restoreFocus) requestAnimationFrame(() => menuButton?.focus());
}

function openMenu() {
  if (!drawerMedia.matches || !navigation) return;
  lockedScrollY = window.scrollY;
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.classList.add('menu-open');
  navigation.inert = false;
  navigation.setAttribute('aria-hidden', 'false');
  setPageInert(true);
  setMenuButtonState(true);
  requestAnimationFrame(() => navigation.querySelector('a[href]')?.focus());
}

function syncMenuLayout() {
  if (drawerMedia.matches) {
    if (!document.body.classList.contains('menu-open')) {
      navigation?.setAttribute('aria-hidden', 'true');
      if (navigation) navigation.inert = true;
    }
  } else {
    closeMenu();
  }
}

menuButton?.addEventListener('click', () => {
  if (document.body.classList.contains('menu-open')) closeMenu({ restoreFocus: true });
  else openMenu();
});

menuBackdrop?.addEventListener('click', () => closeMenu({ restoreFocus: true }));

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));

document.addEventListener('keydown', (event) => {
  if (!document.body.classList.contains('menu-open')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu({ restoreFocus: true });
    return;
  }

  if (event.key !== 'Tab' || !navigation || !menuButton) return;
  const links = [...navigation.querySelectorAll('a[href]')];
  const firstLink = links[0];
  const lastLink = links[links.length - 1];

  if (event.shiftKey && document.activeElement === firstLink) {
    event.preventDefault();
    menuButton.focus();
  } else if (event.shiftKey && document.activeElement === menuButton) {
    event.preventDefault();
    lastLink?.focus();
  } else if (!event.shiftKey && document.activeElement === lastLink) {
    event.preventDefault();
    menuButton.focus();
  } else if (!event.shiftKey && document.activeElement === menuButton) {
    event.preventDefault();
    firstLink?.focus();
  }
});

if (typeof drawerMedia.addEventListener === 'function') drawerMedia.addEventListener('change', syncMenuLayout);
else drawerMedia.addListener(syncMenuLayout);
syncMenuLayout();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const counters = document.querySelectorAll('[data-counter]');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.counter || 0);
      const decimals = Number(element.dataset.decimals || 0);
      const duration = 1000;
      const startTime = performance.now();
      const animate = (now) => {
        const elapsed = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        element.textContent = (target * eased).toFixed(decimals);
        if (elapsed < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      counterObserver.unobserve(element);
    });
  }, { threshold: 0.7 });
  counters.forEach((counter) => counterObserver.observe(counter));
}
