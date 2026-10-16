/* =============================================================
   Mena Fawzy — Portfolio
   Description: Navigation, theme toggle, scroll reveal,
                active nav highlighting, and small enhancements.
   ============================================================= */

(function () {
  'use strict';

  /* ===========================================================
     1. UTILITIES
     =========================================================== */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ===========================================================
     2. THEME TOGGLE (dark / light) — persisted in localStorage
     =========================================================== */
  const html = document.documentElement;
  const themeToggle = $('#themeToggle');
  const STORAGE_KEY = 'mf-theme';

  const applyTheme = (theme) => {
    html.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      /* localStorage may be blocked — silently ignore */
    }
  };
 
    const getPreferredTheme = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (_) { /* ignore */ }
    // Dark mode is the default regardless of OS preference.
    // Users who toggle to light will have that saved for their next visit.
    return 'dark';
  };
  // Apply saved/preferred theme on load
  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ===========================================================
     3. MOBILE NAVIGATION TOGGLE
     =========================================================== */
  const navToggle = $('#navToggle');
  const navMenu   = $('#navMenu');

  const closeMenu = () => {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a link is clicked (mobile UX)
    $$('.nav__link', navMenu).forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ===========================================================
     4. NAVBAR: shadow on scroll
     =========================================================== */
  const nav = $('#nav');
  const onScrollNav = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ===========================================================
     5. SCROLL REVEAL — Intersection Observer
     =========================================================== */
  const revealEls = $$('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1,
      }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback for very old browsers: show everything
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ===========================================================
     6. ACTIVE NAV LINK based on current section in view
     =========================================================== */
  const sections = $$('main section[id]');
  const navLinks = $$('.nav__link');

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      link.classList.toggle('is-active', href === `#${id}`);
    });
  };

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        // Pick the most visible entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActiveLink(visible.target.id);
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => sectionObserver.observe(s));
  }

  /* ===========================================================
     7. FOOTER YEAR
     =========================================================== */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===========================================================
     8. SMOOTH SCROLL FALLBACK
        (modern browsers already handle this via CSS)
     =========================================================== */
  const supportsSmoothScroll =
    'scrollBehavior' in document.documentElement.style;

  if (!supportsSmoothScroll) {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();

        const navHeight = nav ? nav.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;

        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ===========================================================
     9. CONTACT FORM — AJAX submit + inline status
     =========================================================== */
  const contactForm = $('#contactForm');
  const cfStatus    = $('#cf-status');

  if (contactForm && cfStatus) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const submitTxt = contactForm.querySelector('.contact-form__submit-text');

      // Reset status
      cfStatus.textContent = '';
      cfStatus.className = 'contact-form__status';

      // Basic validation
      if (!contactForm.checkValidity()) {
        cfStatus.textContent = 'Please fill in all fields correctly.';
        cfStatus.classList.add('is-error');
        return;
      }

      // Guard against placeholder endpoint
      if (contactForm.action.includes('YOUR_FORM_ID')) {
        cfStatus.textContent = 'Form endpoint not configured yet. Please email me directly.';
        cfStatus.classList.add('is-error');
        return;
      }

      // Disable during submit
      if (submitBtn) submitBtn.disabled = true;
      if (submitTxt) submitTxt.textContent = 'Sending...';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          cfStatus.textContent = '✓ Message sent! I will get back to you shortly.';
          cfStatus.classList.add('is-success');
          contactForm.reset();
        } else {
          const data = await response.json().catch(() => ({}));
          const msg = (data.errors && data.errors[0] && data.errors[0].message)
            || 'Something went wrong. Please try again or email me directly.';
          cfStatus.textContent = msg;
          cfStatus.classList.add('is-error');
        }
      } catch (_) {
        cfStatus.textContent = 'Network error. Please check your connection or email me directly.';
        cfStatus.classList.add('is-error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitTxt) submitTxt.textContent = 'Send Message';
      }
    });
  }
})();

  