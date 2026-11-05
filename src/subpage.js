/**
 * RITHMOS Subpages Client Script
 * Handles navigation, registration modal triggers, and form interactions for /about, /competition, /contact
 */

import './cms/runtime.js'; // must stay first: maps the page text before any script changes it
import { MobileNav } from './ui/MobileNav.js';

document.addEventListener('DOMContentLoaded', () => {
  new MobileNav();

  // Highlight active nav link based on current path
  const currentPath = window.location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href').replace(/\/$/, '');
    if (href === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Centralized submission recorder for /admin
  function recordSubmission(submission) {
    try {
      const list = JSON.parse(localStorage.getItem('rithmos_submissions') || '[]');
      const typeCode = submission.type === 'brand' ? 'SPN' : submission.type === 'message' ? 'MSG' : 'BND';
      const record = {
        id: submission.id || `RTH-2026-${typeCode}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        type: submission.type || 'band',
        status: 'NEW',
        ...submission
      };
      list.unshift(record);
      localStorage.setItem('rithmos_submissions', JSON.stringify(list));
      return record;
    } catch (e) {
      console.error('Storage recording error:', e);
    }
  }


  // Modal Setup
  const registerModal = document.getElementById('register-modal');
  const modalCloseBtn = document.getElementById('modal-close');
  const openButtons = document.querySelectorAll('.open-band-modal-btn');

  function openModal() {
    if (registerModal) {
      registerModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (registerModal) {
      registerModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  openButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (registerModal) {
    registerModal.addEventListener('click', (e) => {
      if (e.target === registerModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && registerModal && registerModal.classList.contains('open')) {
      closeModal();
    }
  });

  // Modal Registration Form Handling
  const regForm = document.getElementById('registration-form');
  const successMsg = document.getElementById('form-success-msg');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (successMsg) {
        successMsg.style.display = 'block';
        regForm.reset();
        setTimeout(() => {
          closeModal();
          successMsg.style.display = 'none';
        }, 3000);
      }
    });
  }

  // FAQ Accordion Interaction
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close others for clean accordion feel
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
          }
        });
        if (isOpen) {
          item.classList.remove('open');
          questionBtn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          questionBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // Department Channel Route Buttons
  const routeButtons = document.querySelectorAll('.channel-route-btn');
  const deptSelect = document.getElementById('c-dept');
  routeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetVal = btn.getAttribute('data-dept-val');
      if (deptSelect && targetVal) {
        deptSelect.value = targetVal;
        const deskSection = document.getElementById('transmission-desk');
        if (deskSection) {
          deskSection.scrollIntoView({ behavior: 'smooth' });
        }
        deptSelect.focus();
      }
    });
  });

  // Message Character Counter
  const messageInput = document.getElementById('c-msg');
  const charCounter = document.getElementById('char-counter');
  if (messageInput && charCounter) {
    messageInput.addEventListener('input', () => {
      const len = messageInput.value.length;
      charCounter.textContent = `${len} / 500`;
    });
  }

  // Contact Form Handling (on /contact)
  const contactForm = document.getElementById('subpage-contact-form');
  const contactSuccess = document.getElementById('contact-form-success');
  const contactSubmitBtn = document.getElementById('contact-submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      recordSubmission({
        type: 'message',
        name: document.getElementById('c-name')?.value || 'Guest',
        email: document.getElementById('c-email')?.value || '',
        phone: document.getElementById('c-phone')?.value || '',
        dept: document.getElementById('c-dept')?.value || 'General',
        org: document.getElementById('c-band')?.value || '',
        message: document.getElementById('c-msg')?.value || ''
      });

      if (contactSubmitBtn) {
        contactSubmitBtn.disabled = true;
        contactSubmitBtn.innerHTML = '<span>Sending Message...</span>';
      }

      setTimeout(() => {
        if (contactSuccess) {
          contactSuccess.style.display = 'block';
        }
        contactForm.reset();
        if (charCounter) {
          charCounter.textContent = '0 / 500';
        }
        if (contactSubmitBtn) {
          contactSubmitBtn.disabled = false;
          contactSubmitBtn.innerHTML = '<span>Send Message</span> <span class="btn-arrow">&rarr;</span>';
        }
        setTimeout(() => {
          if (contactSuccess) {
            contactSuccess.style.display = 'none';
          }
        }, 7000);
      }, 700);
    });
  }

  // Band Registration Form Handling (on /register)
  const bandForm = document.getElementById('band-registration-form');
  const bandSuccess = document.getElementById('band-form-success');
  const bandSubmitBtn = document.getElementById('band-submit-btn');
  const bandRefCode = document.getElementById('band-ref-code');

  if (bandForm) {
    bandForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const randCode = 'RTH-2026-BND-' + Math.floor(1000 + Math.random() * 9000);
      recordSubmission({
        id: randCode,
        type: 'band',
        bandName: document.getElementById('b-name')?.value || '',
        language: document.getElementById('b-lang')?.value || 'Telugu + Hindi',
        leader: document.getElementById('b-leader')?.value || '',
        city: document.getElementById('b-city')?.value || '',
        phone: document.getElementById('b-phone')?.value || '',
        email: document.getElementById('b-email')?.value || '',
        demoUrl: document.getElementById('b-link')?.value || '',
        social: document.getElementById('b-social')?.value || '',
        techBrief: document.getElementById('b-tech')?.value || ''
      });

      if (bandSubmitBtn) {
        bandSubmitBtn.disabled = true;
        bandSubmitBtn.innerHTML = '<span>Transmitting Band Dossier...</span>';
      }

      setTimeout(() => {
        if (bandRefCode) {
          bandRefCode.textContent = randCode;
        }
        if (bandSuccess) {
          bandSuccess.style.display = 'block';
          bandSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        bandForm.reset();
        if (bandSubmitBtn) {
          bandSubmitBtn.disabled = false;
          bandSubmitBtn.innerHTML = '<span>SUBMIT BAND FOR AUDITION</span> <span class="btn-arrow">&rarr;</span>';
        }
      }, 800);
    });
  }

  // Sponsor Inquiry Form Handling (on /sponsors)
  const sponsorForm = document.getElementById('sponsor-inquiry-form');
  const sponsorSuccess = document.getElementById('sponsor-form-success');
  const sponsorSubmitBtn = document.getElementById('sponsor-submit-btn');
  const sponsorRefCode = document.getElementById('sponsor-ref-code');

  if (sponsorForm) {
    sponsorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const randCode = 'RTH-2026-SPN-' + Math.floor(1000 + Math.random() * 9000);
      recordSubmission({
        id: randCode,
        type: 'brand',
        brandName: document.getElementById('sp-brand')?.value || '',
        contact: document.getElementById('sp-lead')?.value || '',
        designation: document.getElementById('sp-role')?.value || '',
        phone: document.getElementById('sp-phone')?.value || '',
        email: document.getElementById('sp-email')?.value || '',
        tier: document.getElementById('sp-tier')?.value || '',
        notes: document.getElementById('sp-notes')?.value || ''
      });

      if (sponsorSubmitBtn) {
        sponsorSubmitBtn.disabled = true;
        sponsorSubmitBtn.innerHTML = '<span>Transmitting Prospectus Request...</span>';
      }

      setTimeout(() => {
        if (sponsorRefCode) {
          sponsorRefCode.textContent = randCode;
        }
        if (sponsorSuccess) {
          sponsorSuccess.style.display = 'block';
          sponsorSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        sponsorForm.reset();
        if (sponsorSubmitBtn) {
          sponsorSubmitBtn.disabled = false;
          sponsorSubmitBtn.innerHTML = '<span>TRANSMIT PROSPECTUS REQUEST</span> <span class="btn-arrow">&rarr;</span>';
        }
      }, 800);
    });
  }

  // ==========================================================================
  // SCROLL MOTION & INTERACTIVE HOVER EFFECTS (About Page Foundations & 5 Pillars)
  // ==========================================================================
  const motionObserverOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const sectionMotionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');

        // Staggered reveal for Foundation cards (Img 3)
        if (entry.target.id === 'foundations-grid') {
          const cards = entry.target.querySelectorAll('.foundation-interactive-card');
          cards.forEach((card, idx) => {
            setTimeout(() => {
              card.classList.add('card-entered');
            }, idx * 140);
          });

          // Gentle welcome highlight wave across Purpose -> Mission -> Vision
          setTimeout(() => {
            cards.forEach((card, idx) => {
              setTimeout(() => {
                card.style.borderColor = 'rgba(255, 28, 54, 0.7)';
                card.style.boxShadow = '0 0 20px rgba(255, 28, 54, 0.25)';
                setTimeout(() => {
                  card.style.borderColor = '';
                  card.style.boxShadow = '';
                }, 600);
              }, idx * 240);
            });
          }, 600);
        }

        // Staggered reveal for 5 Pillars Rack (Img 4)
        if (entry.target.id === 'pillars-grid') {
          const cards = entry.target.querySelectorAll('.pillar-rack-card');
          cards.forEach((card, idx) => {
            setTimeout(() => {
              card.classList.add('card-entered');
            }, idx * 90);
          });
        }

        observer.unobserve(entry.target);
      }
    });
  }, motionObserverOptions);

  const foundationsGrid = document.getElementById('foundations-grid');
  if (foundationsGrid) {
    sectionMotionObserver.observe(foundationsGrid);

    // Interactive 3D micro-tilt for Foundation cards
    const fCards = foundationsGrid.querySelectorAll('.foundation-interactive-card');
    fCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (-y / rect.height) * 8;
        const rotateY = (x / rect.width) * 8;
        card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  const pillarsGrid = document.getElementById('pillars-grid');
  if (pillarsGrid) {
    sectionMotionObserver.observe(pillarsGrid);

    // Interactive 3D micro-tilt & VU meter pulse for 5 Pillars
    const pCards = pillarsGrid.querySelectorAll('.pillar-rack-card');
    pCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (-y / rect.height) * 6;
        const rotateY = (x / rect.width) * 6;
        card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`;
      });

      card.addEventListener('mouseenter', () => {
        const dots = card.querySelectorAll('.vu-dot');
        dots.forEach((dot, idx) => {
          setTimeout(() => {
            dot.style.background = '#ff1c36';
            dot.style.boxShadow = '0 0 8px rgba(255, 28, 54, 0.9)';
          }, idx * 60);
        });
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        const dots = card.querySelectorAll('.vu-dot');
        dots.forEach((dot) => {
          dot.style.background = '';
          dot.style.boxShadow = '';
        });
      });
    });
  }

  // ==========================================================================
  // CONTACT PAGE // TAB SWITCHER (BAND, BRAND, MESSAGE)
  // ==========================================================================
  const contactTabs = document.querySelectorAll('.contact-tab-btn');
  const contactPanels = document.querySelectorAll('.contact-tab-panel');

  if (contactTabs.length > 0) {
    function switchContactTab(tabName) {
      contactTabs.forEach((btn) => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isActive);
        btn.style.background = isActive
          ? 'linear-gradient(90deg, rgba(255, 17, 45, 0.25) 0%, rgba(22, 16, 32, 0.95) 100%)'
          : 'rgba(18, 14, 25, 0.75)';
        btn.style.borderColor = isActive ? '#ff112d' : 'rgba(255, 255, 255, 0.1)';
        btn.style.color = isActive ? '#fff' : '#9e9ea8';
      });

      contactPanels.forEach((panel) => {
        const isTarget = panel.id === `tab-${tabName}-panel`;
        panel.style.display = isTarget ? 'block' : 'none';
      });
    }

    contactTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        switchContactTab(btn.dataset.tab);
      });
    });

    // Deep links: /contact#register-band opens the band form, /contact#partner-form the brand form
    if (window.location.hash === '#register-band' || window.location.hash === '#partner-form') {
      switchContactTab(window.location.hash === '#partner-form' ? 'brand' : 'band');
      const formsContainer = document.getElementById('contact-forms-container');
      if (formsContainer) {
        window.scrollTo(0, formsContainer.getBoundingClientRect().top + window.scrollY - 100);
      }
    }

    // Department route buttons in channels
    const channelRouteBtns = document.querySelectorAll('.channel-route-btn');
    channelRouteBtns.forEach((rBtn) => {
      rBtn.addEventListener('click', () => {
        const deptVal = rBtn.dataset.deptVal;
        if (deptVal === 'Sponsorship') {
          switchContactTab('brand');
        } else {
          switchContactTab('message');
          const deptSelect = document.getElementById('c-dept');
          if (deptSelect) deptSelect.value = deptVal;
        }
        const targetContainer = document.getElementById('contact-forms-container');
        if (targetContainer) {
          targetContainer.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    const navRegBtn = document.getElementById('nav-reg-btn');
    if (navRegBtn) {
      navRegBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchContactTab('band');
        const targetContainer = document.getElementById('contact-forms-container');
        if (targetContainer) {
          targetContainer.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Form handlers
    const contactBandForm = document.getElementById('contact-band-form');
    if (contactBandForm) {
      contactBandForm.addEventListener('submit', (e) => {
        e.preventDefault();
        recordSubmission({
          type: 'band',
          bandName: document.getElementById('cb-name')?.value || 'Band',
          leader: document.getElementById('cb-leader')?.value || '',
          city: document.getElementById('cb-city')?.value || '',
          phone: document.getElementById('cb-phone')?.value || '',
          email: document.getElementById('cb-email')?.value || '',
          demoUrl: document.getElementById('cb-link')?.value || ''
        });
        const success = document.getElementById('contact-band-success');
        if (success) success.style.display = 'block';
        contactBandForm.reset();
      });
    }

    const contactBrandForm = document.getElementById('contact-brand-form');
    if (contactBrandForm) {
      contactBrandForm.addEventListener('submit', (e) => {
        e.preventDefault();
        recordSubmission({
          type: 'brand',
          brandName: document.getElementById('cbr-brand')?.value || 'Brand',
          contact: document.getElementById('cbr-lead')?.value || '',
          phone: document.getElementById('cbr-phone')?.value || '',
          email: document.getElementById('cbr-email')?.value || '',
          tier: document.getElementById('cbr-tier')?.value || '',
          notes: document.getElementById('cbr-notes')?.value || ''
        });
        const success = document.getElementById('contact-brand-success');
        if (success) success.style.display = 'block';
        contactBrandForm.reset();
      });
    }
  }

  // ==========================================================================
  // THE COMPETITION PAGE // EMBEDDED BAND REGISTRATION & CIRCUIT CABLE
  // ==========================================================================
  const compBandForm = document.getElementById('comp-band-registration-form');
  if (compBandForm) {
    compBandForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const randId = `RTH-2026-BND-${randomNum}`;
      recordSubmission({
        id: randId,
        type: 'band',
        bandName: document.getElementById('comp-b-name')?.value || 'Band',
        language: document.getElementById('comp-b-lang')?.value || 'Telugu + Hindi',
        leader: document.getElementById('comp-b-leader')?.value || '',
        city: document.getElementById('comp-b-city')?.value || '',
        phone: document.getElementById('comp-b-phone')?.value || '',
        email: document.getElementById('comp-b-email')?.value || '',
        demoUrl: document.getElementById('comp-b-link')?.value || '',
        social: document.getElementById('comp-b-social')?.value || '',
        techBrief: document.getElementById('comp-b-tech')?.value || ''
      });

      const successEl = document.getElementById('comp-band-form-success');
      const refCodeEl = document.getElementById('comp-band-ref-code');
      if (refCodeEl) {
        refCodeEl.textContent = randId;
      }
      if (successEl) {
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      compBandForm.reset();
    });
  }

  // Pinned six-stage journey on /competition: scroll reveals one stage at a time
  const compJourney = document.getElementById('comp-journey');
  if (compJourney && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    compJourney.classList.add('is-ready');
    const stageEls = Array.from(compJourney.querySelectorAll('.comp-stage'));
    const counterEl = compJourney.querySelector('.comp-counter-current');
    const last = stageEls.length - 1;
    let activeIdx = -1;

    const scrollRange = () => Math.max(compJourney.offsetHeight - window.innerHeight, 1);

    const updateJourney = () => {
      const p = Math.min(1, Math.max(0, -compJourney.getBoundingClientRect().top / scrollRange()));
      compJourney.style.setProperty('--p', p.toFixed(4));
      const idx = Math.min(last, Math.floor(p * stageEls.length));
      if (idx === activeIdx) return;
      activeIdx = idx;
      stageEls.forEach((el, i) => {
        el.classList.toggle('is-active', i === idx);
        el.classList.toggle('is-past', i < idx);
        el.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      if (counterEl) counterEl.textContent = String(idx + 1).padStart(2, '0');
      compJourney.classList.toggle('is-finale', idx === last);
    };

    window.addEventListener('scroll', updateJourney, { passive: true });
    window.addEventListener('resize', updateJourney);
    updateJourney();
  }

  // Cinematic "why participate" stage on /competition: cards light up on entry, silhouettes rise with scroll
  const whyStage = document.getElementById('why-participate');
  if (whyStage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    whyStage.classList.add('is-armed');
    const whyIO = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        whyStage.classList.add('is-visible');
        whyIO.disconnect();
      }
    }, { threshold: 0.12 });
    whyIO.observe(whyStage);

    const tableau = whyStage.querySelector('.why-stage-tableau');
    let whyTicking = false;
    const updateWhyStage = () => {
      whyTicking = false;
      const vh = window.innerHeight;
      const t = tableau.getBoundingClientRect().top;
      const sp = Math.min(1, Math.max(0, (vh - t) / (vh * 0.8)));
      whyStage.style.setProperty('--sp', sp.toFixed(3));
    };
    window.addEventListener('scroll', () => {
      if (!whyTicking) {
        whyTicking = true;
        requestAnimationFrame(updateWhyStage);
      }
    }, { passive: true });
    updateWhyStage();

    // live cards: cursor spotlight + gentle 3D tilt, and a glow that travels card to card on its own
    const whyCards = Array.from(whyStage.querySelectorAll('.benefit-box'));
    let whyHover = false;
    let whyInView = false;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      whyCards.forEach((card) => {
        card.addEventListener('pointerenter', () => {
          whyHover = true;
          whyCards.forEach((c) => c.classList.remove('is-lit'));
        });
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
          card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
          card.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
          card.style.setProperty('--rx', `${((0.5 - y) * 8).toFixed(2)}deg`);
        });
        card.addEventListener('pointerleave', () => {
          whyHover = false;
          ['--mx', '--my', '--rx', '--ry'].forEach((p) => card.style.removeProperty(p));
        });
      });
    }
    new IntersectionObserver((entries) => {
      whyInView = entries.some((e) => e.isIntersecting);
      if (!whyInView) whyCards.forEach((c) => c.classList.remove('is-lit'));
    }, { threshold: 0.25 }).observe(whyStage.querySelector('.benefit-cards-grid'));
    let whyLit = 0;
    setInterval(() => {
      if (whyHover || !whyInView || !whyCards.length) return;
      whyCards.forEach((c, k) => c.classList.toggle('is-lit', k === whyLit));
      whyLit = (whyLit + 1) % whyCards.length;
    }, 2200);
  }

  // ==========================================================================
  // SPONSORS DECK // FOUNDER GALLERY MARQUEE SLIDER
  // ==========================================================================
  const founderMarquee = document.getElementById('founder-marquee-track');
  const sliderPrevBtn = document.getElementById('slider-prev-btn');
  const sliderNextBtn = document.getElementById('slider-next-btn');

  if (founderMarquee) {
    // Clone cards once for continuous infinite scroll
    const items = Array.from(founderMarquee.children);
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      founderMarquee.appendChild(clone);
    });

    founderMarquee.classList.add('is-animating');

    let currentOffset = 0;
    const cardStep = 354; // 330px width + 24px gap

    if (sliderPrevBtn) {
      sliderPrevBtn.addEventListener('click', () => {
        founderMarquee.classList.remove('is-animating');
        currentOffset = Math.max(0, currentOffset - cardStep);
        founderMarquee.style.transform = `translateX(-${currentOffset}px)`;
      });
    }

    if (sliderNextBtn) {
      sliderNextBtn.addEventListener('click', () => {
        founderMarquee.classList.remove('is-animating');
        currentOffset += cardStep;
        founderMarquee.style.transform = `translateX(-${currentOffset}px)`;
      });
    }
  }

  // ==========================================================================
  // SECTION 2: SPONSORS DECK // 11 SLEEK MINIMALISTIC CARDS HORIZONTAL SLIDER
  // ==========================================================================
  function initSleekCardsSlider() {
    const stageSection = document.getElementById('own-the-stage');
    const viewport = document.getElementById('stage-cards-viewport');
    const trackContainer = document.getElementById('stage-cards-track-container');
    const track = document.getElementById('stage-cards-track');
    if (!stageSection || !viewport || !trackContainer || !track) return;

    const cards = Array.from(document.querySelectorAll('.stage-minimal-card'));
    const activeNumEl = document.getElementById('cards-active-num');
    const progressBar = document.getElementById('cards-progress-fill');
    const prevBtn = document.getElementById('stage-card-prev');
    const nextBtn = document.getElementById('stage-card-next');

    const totalCards = cards.length;
    if (totalCards === 0) return;

    let currentActiveIndex = 0;
    let isNavigating = false;

    function updateActiveState(index) {
      if (index < 0 || index >= totalCards) return;
      currentActiveIndex = index;

      cards.forEach((card, idx) => {
        card.classList.toggle('active', idx === index);
      });

      if (activeNumEl) {
        activeNumEl.textContent = String(index + 1).padStart(2, '0');
      }

      if (progressBar) {
        progressBar.style.width = `${((index) / (totalCards - 1)) * 100}%`;
      }
    }

    // Scroll Progression: Window Scroll drives the horizontal sliding of the cards
    function handleWindowScroll() {
      if (isNavigating) return;

      const rect = stageSection.getBoundingClientRect();
      const windowH = window.innerHeight;
      const totalScrollable = stageSection.offsetHeight - windowH;

      if (totalScrollable <= 0) return;

      const maxTranslate = Math.max(0, track.scrollWidth - trackContainer.clientWidth);

      if (rect.top <= 0 && rect.bottom >= windowH) {
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
        
        // Translate the track horizontally
        track.style.transform = `translate3d(-${progress * maxTranslate}px, 0, 0)`;

        // Calculate which card is currently active/centered
        const activeIdx = Math.min(totalCards - 1, Math.round(progress * (totalCards - 1)));
        if (activeIdx !== currentActiveIndex) {
          updateActiveState(activeIdx);
        }
      } else if (rect.top > 0) {
        track.style.transform = 'translate3d(0, 0, 0)';
        if (currentActiveIndex !== 0) {
          updateActiveState(0);
        }
      } else if (rect.bottom < windowH) {
        track.style.transform = `translate3d(-${maxTranslate}px, 0, 0)`;
        if (currentActiveIndex !== totalCards - 1) {
          updateActiveState(totalCards - 1);
        }
      }
    }

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', handleWindowScroll, { passive: true });

    // Smoothly Jump to a specific card via window scroll
    function jumpToCard(index) {
      if (index < 0 || index >= totalCards) return;
      updateActiveState(index);

      const sectionTop = stageSection.getBoundingClientRect().top + window.scrollY;
      const totalScrollable = stageSection.offsetHeight - window.innerHeight;
      const progress = index / (totalCards - 1);
      const targetScrollY = sectionTop + (progress * totalScrollable);

      isNavigating = true;
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isNavigating = false;
        handleWindowScroll();
      }, 700);
    }

    // Card click -> Center if inactive, or prefill form & scroll to #sponsor-desk if already active
    cards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (idx !== currentActiveIndex) {
          jumpToCard(idx);
        } else {
          const targetTier = card.getAttribute('data-tier') || '';
          const categoryName = card.getAttribute('data-category') || '';
          
          const deskSection = document.getElementById('sponsor-desk');
          const tierSelect = document.getElementById('sp-tier');
          const notesField = document.getElementById('sp-notes');
          const brandField = document.getElementById('sp-brand');

          if (tierSelect && targetTier) {
            for (let i = 0; i < tierSelect.options.length; i++) {
              if (tierSelect.options[i].value === targetTier) {
                tierSelect.selectedIndex = i;
                break;
              }
            }
          }

          if (notesField && categoryName) {
            notesField.value = `Interested in exploring: ${categoryName}`;
          }

          if (deskSection) {
            deskSection.scrollIntoView({ behavior: 'smooth' });
          }

          if (brandField) {
            setTimeout(() => {
              brandField.focus();
            }, 650);
          }
        }
      });
    });

    // Prev / Next Arrows
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToCard(Math.max(0, currentActiveIndex - 1));
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToCard(Math.min(totalCards - 1, currentActiveIndex + 1));
      });
    }

    // Keyboard Arrow Navigation (Left/Right & Up/Down)
    document.addEventListener('keydown', (e) => {
      const rect = stageSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isVisible) return;

      if (e.key === 'ArrowRight') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (currentActiveIndex < totalCards - 1) {
          e.preventDefault();
          jumpToCard(currentActiveIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (currentActiveIndex > 0) {
          e.preventDefault();
          jumpToCard(currentActiveIndex - 1);
        }
      }
    });

    // Touch Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    viewport.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0 && currentActiveIndex < totalCards - 1) {
          jumpToCard(currentActiveIndex + 1);
        } else if (diffX > 0 && currentActiveIndex > 0) {
          jumpToCard(currentActiveIndex - 1);
        }
      }
    }, { passive: true });

    // Trackpad Horizontal Wheel
    let wheelTimeout = null;
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > 35 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (wheelTimeout) return;
        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, 450);

        if (e.deltaX > 0 && currentActiveIndex < totalCards - 1) {
          jumpToCard(currentActiveIndex + 1);
        } else if (e.deltaX < 0 && currentActiveIndex > 0) {
          jumpToCard(currentActiveIndex - 1);
        }
      }
    }, { passive: true });

    // CTA Button Action -> Seamless Form Pre-Fill & Navigation to #sponsor-desk
    const ctaButtons = document.querySelectorAll('.card-action-btn, .slide-action-cta');
    ctaButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTier = btn.getAttribute('data-tier') || '';
        const categoryName = btn.getAttribute('data-category') || '';
        
        const deskSection = document.getElementById('sponsor-desk');
        const tierSelect = document.getElementById('sp-tier');
        const notesField = document.getElementById('sp-notes');
        const brandField = document.getElementById('sp-brand');

        if (tierSelect && targetTier) {
          for (let i = 0; i < tierSelect.options.length; i++) {
            if (tierSelect.options[i].value === targetTier) {
              tierSelect.selectedIndex = i;
              break;
            }
          }
        }

        if (notesField && categoryName) {
          notesField.value = `Interested in exploring: ${categoryName}`;
        }

        if (deskSection) {
          deskSection.scrollIntoView({ behavior: 'smooth' });
        }

        if (brandField) {
          setTimeout(() => {
            brandField.focus();
          }, 650);
        }
      });
    });

    // Initialize first card
    updateActiveState(0);
    handleWindowScroll();
  }

  // Initialize Sleek Cards Slider
  initSleekCardsSlider();

  // ==========================================================================
  // SECTION 3: CINEMATIC SCROLL REVEAL TIERS
  // True continuous scroll-driven physical unorganized card deck peel & reveal
  // ==========================================================================
  function initTiersScrollReveal() {
    const scrollTrack = document.getElementById('tiers-reveal-scroll-track');
    const stage = document.getElementById('tiers-deck-stage');
    const cards = Array.from(document.querySelectorAll('.tier-physical-card'));
    const hudStepTag = document.getElementById('hud-step-tag');
    const hudDots = document.querySelectorAll('.tier-hud-dot');
    const progressFill = document.getElementById('tiers-progress-fill');
    const scrollHint = document.getElementById('tiers-scroll-hint');

    if (!scrollTrack || !stage || cards.length !== 4) return;

    const stepTitles = [
      'DECK // TIER 01: TITLE PARTNER',
      'DECK // TIER 02: POWERED BY PARTNER',
      'DECK // TIER 03: CATEGORY PARTNER',
      'DECK // TIER 04: DIGITAL PARTNER',
      'COMPLETE LINEUP // ALL 4 TIERS REVEALED'
    ];

    function smoothstep(min, max, val) {
      const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
      return x * x * (3 - 2 * x);
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    let isNavigating = false;
    let targetProgress = 0;

    function applyTransforms(p) {
      // Progress fill width (8% to 100%)
      if (progressFill) {
        const percent = Math.min(100, Math.max(8, Math.round(p * 100)));
        progressFill.style.width = `${percent}%`;
      }

      // Phase 4: All-Cards Mode (p >= 0.74)
      if (p >= 0.74) {
        if (!stage.classList.contains('mode-all-cards')) {
          stage.classList.remove('mode-deck');
          stage.classList.add('mode-all-cards');
          cards.forEach((c) => {
            c.style.transform = '';
            c.style.opacity = '';
            c.style.filter = '';
            c.style.zIndex = '';
            c.classList.remove('is-active');
          });
        }
        if (hudStepTag) hudStepTag.textContent = stepTitles[4];
        hudDots.forEach((dot, idx) => dot.classList.toggle('active', idx === 4));
        if (scrollHint) scrollHint.textContent = 'ALL 4 TIERS REVEALED \u2193';
        return;
      }

      // Otherwise: Deck Mode
      if (!stage.classList.contains('mode-deck')) {
        stage.classList.remove('mode-all-cards');
        stage.classList.add('mode-deck');
      }

      // Determine active chapter & HUD text
      let activeIdx = 0;
      if (p < 0.22) {
        activeIdx = 0;
      } else if (p < 0.44) {
        activeIdx = 1;
      } else if (p < 0.62) {
        activeIdx = 2;
      } else {
        activeIdx = 3;
      }

      if (hudStepTag) hudStepTag.textContent = stepTitles[activeIdx];
      hudDots.forEach((dot, idx) => dot.classList.toggle('active', idx === activeIdx));
      if (scrollHint) scrollHint.textContent = 'SCROLL TO PEEL CARDS \u2192';

      cards.forEach((card, idx) => {
        card.classList.toggle('is-active', idx === activeIdx);
      });

      // --- CARD 0 (Title Partner) ---
      // Peels from p = 0.04 to p = 0.22 (left peel)
      if (p < 0.04) {
        cards[0].style.transform = 'translate3d(0, -6px, 80px) rotate(-1.8deg) scale(1)';
        cards[0].style.opacity = '1';
        cards[0].style.filter = 'brightness(1)';
        cards[0].style.zIndex = '10';
        cards[0].style.pointerEvents = 'auto';
      } else if (p < 0.22) {
        const t = smoothstep(0.04, 0.22, p);
        const x = lerp(0, -145, t);
        const y = lerp(-6, -90, t);
        const z = lerp(80, 240, t);
        const rot = lerp(-1.8, -34, t);
        const rotY = lerp(0, 28, t);
        const op = lerp(1, 0, t);
        cards[0].style.transform = `translate3d(${x}%, ${y}px, ${z}px) rotateY(${rotY}deg) rotateZ(${rot}deg) scale(${lerp(1, 0.88, t)})`;
        cards[0].style.opacity = op.toFixed(3);
        cards[0].style.filter = `blur(${lerp(0, 4, t)}px)`;
        cards[0].style.zIndex = '10';
        cards[0].style.pointerEvents = t > 0.5 ? 'none' : 'auto';
      } else {
        cards[0].style.transform = 'translate3d(-150%, -90px, 240px) rotateY(28deg) rotateZ(-34deg) scale(0.88)';
        cards[0].style.opacity = '0';
        cards[0].style.filter = 'blur(4px)';
        cards[0].style.zIndex = '1';
        cards[0].style.pointerEvents = 'none';
      }

      // --- CARD 1 (Powered By Partner) ---
      // Starts stacked under Card 0: (38px, -18px, 40px, 5.8deg, bright 0.82)
      // Rises to top as Card 0 peels (p = 0.04 to 0.22)
      // Resting top from p = 0.22 to 0.26
      // Peels right from p = 0.26 to 0.44
      if (p < 0.04) {
        cards[1].style.transform = 'translate3d(38px, -18px, 40px) rotate(5.8deg)';
        cards[1].style.opacity = '0.94';
        cards[1].style.filter = 'brightness(0.82)';
        cards[1].style.zIndex = '8';
        cards[1].style.pointerEvents = 'auto';
      } else if (p < 0.22) {
        const t = smoothstep(0.04, 0.22, p);
        const x = lerp(38, 0, t);
        const y = lerp(-18, -6, t);
        const z = lerp(40, 80, t);
        const rot = lerp(5.8, 1.5, t);
        const br = lerp(0.82, 1.0, t);
        const op = lerp(0.94, 1.0, t);
        cards[1].style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg) scale(1)`;
        cards[1].style.opacity = op.toFixed(3);
        cards[1].style.filter = `brightness(${br.toFixed(2)})`;
        cards[1].style.zIndex = '8';
        cards[1].style.pointerEvents = 'auto';
      } else if (p < 0.26) {
        cards[1].style.transform = 'translate3d(0, -6px, 80px) rotate(1.5deg) scale(1)';
        cards[1].style.opacity = '1';
        cards[1].style.filter = 'brightness(1)';
        cards[1].style.zIndex = '10';
        cards[1].style.pointerEvents = 'auto';
      } else if (p < 0.44) {
        const t = smoothstep(0.26, 0.44, p);
        const x = lerp(0, 145, t);
        const y = lerp(-6, -90, t);
        const z = lerp(80, 240, t);
        const rot = lerp(1.5, 34, t);
        const rotY = lerp(0, -28, t);
        const op = lerp(1, 0, t);
        cards[1].style.transform = `translate3d(${x}%, ${y}px, ${z}px) rotateY(${rotY}deg) rotateZ(${rot}deg) scale(${lerp(1, 0.88, t)})`;
        cards[1].style.opacity = op.toFixed(3);
        cards[1].style.filter = `blur(${lerp(0, 4, t)}px)`;
        cards[1].style.zIndex = '10';
        cards[1].style.pointerEvents = t > 0.5 ? 'none' : 'auto';
      } else {
        cards[1].style.transform = 'translate3d(150%, -90px, 240px) rotateY(-28deg) rotateZ(34deg) scale(0.88)';
        cards[1].style.opacity = '0';
        cards[1].style.filter = 'blur(4px)';
        cards[1].style.zIndex = '1';
        cards[1].style.pointerEvents = 'none';
      }

      // --- CARD 2 (Category Partner) ---
      // Starts under Card 1: (-44px, 16px, 10px, -6.4deg, bright 0.72)
      // Shifts up as Card 0 peels (0.04 to 0.22): (-40px, 14px, 40px, -5.8deg, 0.84)
      // Shifts to top as Card 1 peels (0.26 to 0.44): (0, -6px, 80px, -1.4deg, 1.0)
      // Resting top from 0.44 to 0.48
      // Peels left from 0.48 to 0.64
      if (p < 0.22) {
        const t = smoothstep(0.04, 0.22, p);
        const x = lerp(-44, -40, t);
        const y = lerp(16, 14, t);
        const z = lerp(10, 40, t);
        const rot = lerp(-6.4, -5.8, t);
        const br = lerp(0.72, 0.84, t);
        cards[2].style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg)`;
        cards[2].style.opacity = '0.88';
        cards[2].style.filter = `brightness(${br.toFixed(2)})`;
        cards[2].style.zIndex = '6';
        cards[2].style.pointerEvents = 'auto';
      } else if (p < 0.44) {
        const t = smoothstep(0.26, 0.44, p);
        const x = lerp(-40, 0, t);
        const y = lerp(14, -6, t);
        const z = lerp(40, 80, t);
        const rot = lerp(-5.8, -1.4, t);
        const br = lerp(0.84, 1.0, t);
        const op = lerp(0.88, 1.0, t);
        cards[2].style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg)`;
        cards[2].style.opacity = op.toFixed(3);
        cards[2].style.filter = `brightness(${br.toFixed(2)})`;
        cards[2].style.zIndex = '8';
        cards[2].style.pointerEvents = 'auto';
      } else if (p < 0.48) {
        cards[2].style.transform = 'translate3d(0, -6px, 80px) rotate(-1.4deg) scale(1)';
        cards[2].style.opacity = '1';
        cards[2].style.filter = 'brightness(1)';
        cards[2].style.zIndex = '10';
        cards[2].style.pointerEvents = 'auto';
      } else if (p < 0.64) {
        const t = smoothstep(0.48, 0.64, p);
        const x = lerp(0, -145, t);
        const y = lerp(-6, -90, t);
        const z = lerp(80, 240, t);
        const rot = lerp(-1.4, -34, t);
        const rotY = lerp(0, 28, t);
        const op = lerp(1, 0, t);
        cards[2].style.transform = `translate3d(${x}%, ${y}px, ${z}px) rotateY(${rotY}deg) rotateZ(${rot}deg) scale(${lerp(1, 0.88, t)})`;
        cards[2].style.opacity = op.toFixed(3);
        cards[2].style.filter = `blur(${lerp(0, 4, t)}px)`;
        cards[2].style.zIndex = '10';
        cards[2].style.pointerEvents = t > 0.5 ? 'none' : 'auto';
      } else {
        cards[2].style.transform = 'translate3d(-150%, -90px, 240px) rotateY(28deg) rotateZ(-34deg) scale(0.88)';
        cards[2].style.opacity = '0';
        cards[2].style.filter = 'blur(4px)';
        cards[2].style.zIndex = '1';
        cards[2].style.pointerEvents = 'none';
      }

      // --- CARD 3 (Digital Partner) ---
      // Starts at bottom: (52px, 32px, -20px, 8.8deg, bright 0.62)
      // Shifts up to (44px, 24px, 10px, 7.8deg, 0.74) by p = 0.22
      // Shifts up to (38px, 16px, 40px, 6.2deg, 0.88) by p = 0.44
      // Shifts to top center by p = 0.64: (0, -6px, 80px, 0.8deg, 1.0)
      // Resting top from p = 0.64 to 0.74!
      if (p < 0.22) {
        const t = smoothstep(0.04, 0.22, p);
        const x = lerp(52, 44, t);
        const y = lerp(32, 24, t);
        const z = lerp(-20, 10, t);
        const rot = lerp(8.8, 7.8, t);
        const br = lerp(0.62, 0.74, t);
        cards[3].style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg)`;
        cards[3].style.opacity = '0.80';
        cards[3].style.filter = `brightness(${br.toFixed(2)})`;
        cards[3].style.zIndex = '4';
        cards[3].style.pointerEvents = 'auto';
      } else if (p < 0.44) {
        const t = smoothstep(0.26, 0.44, p);
        const x = lerp(44, 38, t);
        const y = lerp(24, 16, t);
        const z = lerp(10, 40, t);
        const rot = lerp(7.8, 6.2, t);
        const br = lerp(0.74, 0.88, t);
        cards[3].style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg)`;
        cards[3].style.opacity = '0.88';
        cards[3].style.filter = `brightness(${br.toFixed(2)})`;
        cards[3].style.zIndex = '6';
        cards[3].style.pointerEvents = 'auto';
      } else if (p < 0.64) {
        const t = smoothstep(0.48, 0.64, p);
        const x = lerp(38, 0, t);
        const y = lerp(16, -6, t);
        const z = lerp(40, 80, t);
        const rot = lerp(6.2, 0.8, t);
        const br = lerp(0.88, 1.0, t);
        const op = lerp(0.88, 1.0, t);
        cards[3].style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg)`;
        cards[3].style.opacity = op.toFixed(3);
        cards[3].style.filter = `brightness(${br.toFixed(2)})`;
        cards[3].style.zIndex = '8';
        cards[3].style.pointerEvents = 'auto';
      } else {
        cards[3].style.transform = 'translate3d(0, -6px, 80px) rotate(0.8deg) scale(1)';
        cards[3].style.opacity = '1';
        cards[3].style.filter = 'brightness(1)';
        cards[3].style.zIndex = '10';
        cards[3].style.pointerEvents = 'auto';
      }
    }

    function handleScroll() {
      if (isNavigating) return;

      const rect = scrollTrack.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollableDist = scrollTrack.offsetHeight - windowHeight;

      if (scrollableDist <= 0) return;

      // Track sticks when top is <= 72px
      const scrolled = 72 - rect.top;
      targetProgress = Math.max(0, Math.min(1, scrolled / scrollableDist));

      applyTransforms(targetProgress);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Interactive Dot Navigation
    hudDots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const targetStep = parseInt(dot.getAttribute('data-step'), 10);
        if (isNaN(targetStep)) return;

        const trackTop = scrollTrack.getBoundingClientRect().top + window.scrollY;
        const scrollableDist = scrollTrack.offsetHeight - window.innerHeight;

        const targetPMap = [0.02, 0.23, 0.45, 0.65, 0.88];
        const targetP = targetPMap[targetStep] !== undefined ? targetPMap[targetStep] : 0;
        const targetY = (trackTop - 72) + (targetP * scrollableDist);

        isNavigating = true;
        applyTransforms(targetP);

        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });

        // Robust scroll completion detection
        let navTimeout;
        const onNavScroll = () => {
          clearTimeout(navTimeout);
          navTimeout = setTimeout(() => {
            isNavigating = false;
            window.removeEventListener('scroll', onNavScroll);
            handleScroll();
          }, 120);
        };
        window.addEventListener('scroll', onNavScroll, { passive: true });

        // Safety fallback
        setTimeout(() => {
          isNavigating = false;
          window.removeEventListener('scroll', onNavScroll);
          handleScroll();
        }, 1600);
      });
    });

    // Card & Button Click -> Pre-fill form & navigate to #sponsor-desk
    const selectTierAndNavigate = (targetTier) => {
      const deskSection = document.getElementById('sponsor-desk');
      const tierSelect = document.getElementById('sp-tier');
      const notesField = document.getElementById('sp-notes');
      const brandField = document.getElementById('sp-brand');

      if (tierSelect && targetTier) {
        for (let i = 0; i < tierSelect.options.length; i++) {
          if (tierSelect.options[i].value === targetTier) {
            tierSelect.selectedIndex = i;
            break;
          }
        }
      }

      if (notesField && targetTier) {
        notesField.value = `Inquiring about ${targetTier} sponsorship package.`;
      }

      if (deskSection) {
        deskSection.scrollIntoView({ behavior: 'smooth' });
      }

      if (brandField) {
        setTimeout(() => {
          brandField.focus();
        }, 650);
      }
    };

    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const btn = e.target.closest('.runway-plan-btn, .tier-plan-btn');
        if (!btn && window.matchMedia('(max-width: 860px)').matches) return; // stacked list: only the button navigates
        const targetTier = (btn && btn.getAttribute('data-tier-select')) || card.getAttribute('data-tier') || '';
        selectTierAndNavigate(targetTier);
      });
    });

    // Initial render
    applyTransforms(0);
    handleScroll();
  }

  // ==========================================================================
  // SPONSORS: live motion for "The Idea" and "The RITHMOS Journey"
  // ==========================================================================
  function initDeckSections() {
    const sections = document.querySelectorAll('.deck-idea-section, .deck-journey-section');
    if (!sections.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targets = document.querySelectorAll('.deck-reveal');
    sections.forEach((s) => s.classList.add('deck-armed'));
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
      targets.forEach((t) => io.observe(t));
    }

    // cursor spotlight on the pillar cards
    document.querySelectorAll('.deck-pillar').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    // journey line follows the scroll and lights each step as it is reached
    const steps = document.getElementById('deck-steps');
    if (!steps) return;
    const stepEls = Array.from(steps.querySelectorAll('.deck-step'));
    const vertical = () => window.matchMedia('(max-width: 860px)').matches;
    const update = () => {
      const r = steps.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.78 - r.top) / (r.height + vh * 0.12)));
      steps.style.setProperty('--p', p.toFixed(3));
      stepEls.forEach((el, i) => {
        const sr = el.getBoundingClientRect();
        const reached = vertical() ? sr.top < vh * 0.72 : p >= (i / Math.max(1, stepEls.length - 1)) * 0.92 + 0.02;
        el.classList.toggle('is-lit', reduce || reached);
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  initDeckSections();
  initTiersScrollReveal();

});


