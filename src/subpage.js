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
      if (bandSubmitBtn) {
        bandSubmitBtn.disabled = true;
        bandSubmitBtn.innerHTML = '<span>Transmitting Band Dossier...</span>';
      }

      setTimeout(() => {
        const randCode = 'RTH-2026-BND-' + Math.floor(1000 + Math.random() * 9000);
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
      if (sponsorSubmitBtn) {
        sponsorSubmitBtn.disabled = true;
        sponsorSubmitBtn.innerHTML = '<span>Transmitting Prospectus Request...</span>';
      }

      setTimeout(() => {
        const randCode = 'RTH-2026-SPN-' + Math.floor(1000 + Math.random() * 9000);
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
        link.download = 'RITHMOS-2026-Festival-Sponsorship-Prospectus.png';
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
  // SPONSORS DECK // INTERACTIVE BRAND MOCKUP SIMULATOR
  // ==========================================================================
  const brandPillars = document.querySelectorAll('.brand-pillar-card');
  const mockupScenes = document.querySelectorAll('.mockup-scene');
  const scenarioTag = document.getElementById('scenario-active-tag');
  const consoleContextText = document.getElementById('console-context-text');
  const mobilePills = document.querySelectorAll('.mobile-pillar-pill');

  const scenarioMeta = {
    '1': {
      tag: 'SCENARIO 01: MAIN STAGE TAKEOVER',
      context: 'MAIN STAGE 120FT LED WALL & TRUSS RIGGING TAKEOVER'
    },
    '2': {
      tag: 'SCENARIO 02: ARTIST & BAND ECOSYSTEM',
      context: 'VIP ARTIST ACCESS LANYARDS & INSTRUMENT GEAR LOCKUP'
    },
    '3': {
      tag: 'SCENARIO 03: LIVE STADIUM FAN ZONE',
      context: 'HOLOGRAPHIC RFID WRISTBANDS & FAN ACTIVATION BOOTH'
    },
    '4': {
      tag: 'SCENARIO 04: 4K LIVESTREAM BROADCAST',
      context: 'BROADCAST LOWER-THIRDS & DIGITAL STREAM SPONSOR BUG'
    },
    '5': {
      tag: 'SCENARIO 05: GLOBAL TELUGU DIASPORA',
      context: 'WORLDWIDE SATELLITE OTT BUG & GLOBAL FAN CHOICE'
    }
  };

  function activatePillar(pillarNum) {
    const numStr = String(pillarNum);

    // Update Pillar Cards
    brandPillars.forEach((card) => {
      if (card.dataset.pillar === numStr) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update Mobile Pills
    mobilePills.forEach((pill) => {
      if (pill.dataset.target === numStr) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update Mockup Scenes
    mockupScenes.forEach((scene) => {
      if (scene.dataset.scene === numStr) {
        scene.classList.add('active');
      } else {
        scene.classList.remove('active');
      }
    });

    // Update Meta text
    if (scenarioMeta[numStr]) {
      if (scenarioTag) scenarioTag.textContent = scenarioMeta[numStr].tag;
      if (consoleContextText) consoleContextText.textContent = scenarioMeta[numStr].context;
    }
  }

  // Desktop & Mobile card triggers: Mouseenter (hover), Click, and Keydown
  brandPillars.forEach((card) => {
    const pillarId = card.dataset.pillar;
    card.addEventListener('mouseenter', () => activatePillar(pillarId));
    card.addEventListener('click', () => activatePillar(pillarId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activatePillar(pillarId);
      }
    });
  });

  // Mobile quick switcher pills
  mobilePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      activatePillar(pill.dataset.target);
    });
  });

  // Scroll Observer (Switches preview on scroll for mobile and responsive views)
  if (brandPillars.length > 0 && 'IntersectionObserver' in window) {
    const pillarObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          activatePillar(entry.target.dataset.pillar);
        }
      });
    }, {
      threshold: [0.5, 0.75],
      rootMargin: '-10% 0px -10% 0px'
    });

    brandPillars.forEach((card) => pillarObserver.observe(card));
  }
});

