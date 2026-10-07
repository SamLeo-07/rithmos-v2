/**
 * Mobile Navigation Drawer Manager
 * Provides a fluid, accessible mobile drawer navigation for viewports <= 768px.
 * On desktop (>= 769px), elements remain hidden via CSS.
 */
export class MobileNav {
  constructor() {
    this.init();
  }

  init() {
    const topNav = document.querySelector('.top-nav');
    if (!topNav) return;

    // 1. Ensure mobile hamburger button exists in top-nav
    let toggleBtn = topNav.querySelector('.mobile-menu-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'mobile-menu-toggle';
      toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = `
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      `;
      topNav.appendChild(toggleBtn);
    }

    // 2. Ensure mobile nav drawer exists in DOM
    let drawer = document.getElementById('mobile-nav-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'mobile-nav-drawer';
      drawer.className = 'mobile-nav-drawer';
      drawer.setAttribute('aria-hidden', 'true');

      const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

      drawer.innerHTML = `
        <div class="mobile-nav-backdrop"></div>
        <div class="mobile-nav-content">
          <div class="mobile-nav-header">
            <a href="/" class="mobile-nav-brand">
              <img src="/assets/logo.png" alt="RITHMOS" class="mobile-nav-logo">
            </a>
            <button class="mobile-nav-close-btn" aria-label="Close navigation menu">&times;</button>
          </div>
          
          <nav class="mobile-nav-links" aria-label="Mobile Navigation">
            <a href="/" class="mobile-nav-link ${currentPath === '' || currentPath === '/' ? 'active' : ''}">HOME</a>
            <a href="/about" class="mobile-nav-link ${currentPath.includes('about') ? 'active' : ''}">ABOUT</a>
            <a href="/competition" class="mobile-nav-link ${currentPath.includes('competition') ? 'active' : ''}">THE COMPETITION</a>
            <a href="/sponsors" class="mobile-nav-link ${currentPath.includes('sponsors') ? 'active' : ''}">SPONSORS DECK</a>
            <a href="/contact" class="mobile-nav-link ${currentPath.includes('contact') ? 'active' : ''}">CONTACT</a>
          </nav>

          <div class="mobile-nav-actions">
            <a href="/register" class="mobile-nav-cta-btn">
              <span>REGISTER YOUR BAND</span>
              <span>→</span>
            </a>
          </div>

          <div class="mobile-nav-footer">
            <div class="mobile-nav-brand-sub">WHERE BANDS RISE</div>
            <div class="mobile-nav-brand-prop">A property of Right Hand Entertainments</div>
            <div class="mobile-nav-socials">
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
              <a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube">YT</a>
              <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">FB</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn">LI</a>
              <a href="https://x.com" target="_blank" rel="noopener" aria-label="X">X</a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }

    const backdrop = drawer.querySelector('.mobile-nav-backdrop');
    const closeBtn = drawer.querySelector('.mobile-nav-close-btn');
    const links = drawer.querySelectorAll('.mobile-nav-link, .mobile-nav-cta-btn');

    const openDrawer = () => {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (drawer.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    links.forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Close drawer on viewport resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }
}
