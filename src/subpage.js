/**
 * RITHMOS Subpages Client Script
 * Handles navigation, registration modal triggers, and form interactions for /about, /competition, /contact
 */

document.addEventListener('DOMContentLoaded', () => {
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
        language: document.getElementById('b-lang')?.value || 'Telugu (Mandatory)',
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
        budget: document.getElementById('sp-budget')?.value || '',
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

  // Direct PDF Deck Download Trigger (on /sponsors)
  const downloadBtns = document.querySelectorAll('#quick-download-deck-btn, #direct-pdf-btn');
  downloadBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>Downloading Prospectus PDF...</span>';
      setTimeout(() => {
        // Trigger simulated PDF download prompt
        const link = document.createElement('a');
        link.href = '/assets/logo.png';
        link.download = 'RITHMOS-2026-Sponsorship-Prospectus.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        btn.innerHTML = '<span>✓ Prospectus Downloaded</span>';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 3000);
      }, 600);
    });
  });

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
  // SPONSORS DECK // 5 FESTIVAL BRAND ENVIRONMENTS SWITCHER
  // ==========================================================================
  const envSlides = document.querySelectorAll('.right-backdrop-slide');
  const envPills = document.querySelectorAll('.env-pill-btn');
  const envDescItems = document.querySelectorAll('.env-desc-item');

  if (envSlides.length > 0 && envPills.length > 0) {
    let currentEnv = 1;
    const totalEnvs = 5;
    let autoRotateTimer = null;
    let isUserInteracting = false;

    function setEnvironment(num) {
      let n = parseInt(num, 10);
      if (isNaN(n) || n < 1) n = 1;
      if (n > totalEnvs) n = totalEnvs;
      currentEnv = n;
      const nStr = String(n);

      envSlides.forEach((slide) => {
        slide.classList.toggle('active', slide.dataset.scenario === nStr);
      });
      envPills.forEach((pill) => {
        pill.classList.toggle('active', pill.dataset.scenario === nStr);
      });
      envDescItems.forEach((desc) => {
        desc.classList.toggle('active', desc.dataset.scenario === nStr);
      });
    }

    envPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        isUserInteracting = true;
        setEnvironment(pill.dataset.scenario);
      });

      pill.addEventListener('mouseenter', () => {
        setEnvironment(pill.dataset.scenario);
      });
    });

    // Auto-advance every 6 seconds unless user interacted
    autoRotateTimer = setInterval(() => {
      if (!isUserInteracting) {
        const next = currentEnv === totalEnvs ? 1 : currentEnv + 1;
        setEnvironment(next);
      }
    }, 6000);
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
        language: document.getElementById('comp-b-lang')?.value || 'Telugu (Mandatory)',
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

  // Cable progress track scroll update on /competition
  const compCableGlowSub = document.getElementById('comp-cable-glow');
  const compStepCards = document.querySelectorAll('.steps-flow-grid .step-card');
  const compIndicators = document.querySelectorAll('.cable-nodes-indicator-row .timeline-indicator-node');
  if (compCableGlowSub && compStepCards.length > 0) {
    const onScrollCompTrack = () => {
      const trackEl = document.getElementById('comp-journey-track') || document.querySelector('.steps-flow-grid');
      if (!trackEl) return;
      const rect = trackEl.getBoundingClientRect();
      const winH = window.innerHeight;
      const start = winH * 0.90;
      const end = -rect.height * 0.25;
      const total = start - end;
      if (total <= 0) return;
      const p = Math.max(0, Math.min(1.0, (start - rect.top) / total));
      const offset = 1000 * (1.0 - p);
      compCableGlowSub.style.strokeDashoffset = `${offset}`;

      compStepCards.forEach((card, idx) => {
        if (p >= 0.08 + idx * 0.15) {
          card.classList.add('is-energized');
          if (compIndicators[idx]) compIndicators[idx].classList.add('is-energized');
        }
      });
    };
    window.addEventListener('scroll', onScrollCompTrack, { passive: true });
    onScrollCompTrack();
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
});


