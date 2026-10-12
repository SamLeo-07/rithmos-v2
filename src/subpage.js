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
  // ==========================================================================
  // SPONSORS DECK // SCROLLYTELLING BRAND SIMULATOR (SCROLL-DRIVEN SCENES)
  // ==========================================================================
  const scrollyTrack = document.getElementById('brand-pillars-showcase');
  const backdropSlides = document.querySelectorAll('.right-backdrop-slide');
  const spotlightPanels = document.querySelectorAll('.scrolly-pillar-panel');
  const stepRailBtns = document.querySelectorAll('.step-rail-btn');
  const telemetryDots = document.querySelectorAll('.t-dot-btn');
  const progressFill = document.getElementById('scrolly-progress-fill');
  const stepCounter = document.getElementById('scrolly-step-counter');

  const hudTag = document.getElementById('hud-scenario-tag');
  const hudHeadline = document.getElementById('hud-scenario-headline');
  const hudSub = document.getElementById('hud-scenario-sub');
  const hudChip1 = document.getElementById('hud-chip-1');
  const hudChip2 = document.getElementById('hud-chip-2');
  const hudChip3 = document.getElementById('hud-chip-3');

  const scenarioMeta = {
    '1': {
      tag: 'SCENARIO 01 // MAIN STAGE TAKEOVER',
      headline: '[ YOUR BRAND ] MAIN STAGE TAKEOVER',
      sub: 'Main proscenium LED screen, dual stadium side towers & overhead steel rigging across all headline sets.',
      chip1: '10,000+ ARENA ATTENDEES',
      chip2: 'CATEGORY EXCLUSIVE',
      chip3: '100% SIGHTLINE TAKEOVER'
    },
    '2': {
      tag: 'SCENARIO 02 // ARTIST & BAND ECOSYSTEM',
      headline: '[ YOUR BRAND ] BACKSTAGE & GEAR INTEGRATION',
      sub: 'VIP artist credentials, official kick drumhead decals, amplifier badges & backstage media wall presence.',
      chip1: 'IN EVERY BAND PHOTO & REEL',
      chip2: 'GEAR LOCKUP',
      chip3: 'DIRECT TALENT AFFILIATION'
    },
    '3': {
      tag: 'SCENARIO 03 // LIVE STADIUM FAN ZONE',
      headline: '[ YOUR BRAND ] FAN ZONE & RFID WRISTBANDS',
      sub: 'Smart glowing RFID wristbands on every attendee plus dedicated neon brand activation lounge in the stadium concourse.',
      chip1: '10,000+ FANS EQUIPPED',
      chip2: '7.2 HRS AVG DWELL TIME',
      chip3: 'HIGH ENGAGEMENT'
    },
    '4': {
      tag: 'SCENARIO 04 // 4K LIVESTREAM BROADCAST',
      headline: '[ YOUR BRAND ] 4K LIVESTREAM TAKEOVER',
      sub: 'Broadcast TV lower-third graphics, digital scorecard branding, YouTube stream watermarks & live chat sponsor banners.',
      chip1: '150K+ PEAK CONCURRENT',
      chip2: '1.8M+ IMPRESSIONS',
      chip3: 'GLOBAL LIVESTREAM BUG'
    },
    '5': {
      tag: 'SCENARIO 05 // GLOBAL TELUGU DIASPORA',
      headline: '[ YOUR BRAND ] WORLDWIDE TELUGU NETWORK',
      sub: 'Satellite OTT watermarks reaching USA, UK, UAE, Australia & Singapore diaspora, plus the Global Fan Choice Award sponsorship.',
      chip1: '5 CONTINENTS REACH',
      chip2: '1.8M+ TELUGU AUDIENCE',
      chip3: 'PREMIUM DEMOGRAPHIC'
    }
  };

  let currentScenario = 1;
  const totalScenarios = 5;

  function activateEnvironment(scenarioNum) {
    let num = parseInt(scenarioNum, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > totalScenarios) num = totalScenarios;
    currentScenario = num;
    const numStr = String(num);

    // 1. Crossfade Right-Side Background Slides
    backdropSlides.forEach((slide) => {
      if (slide.dataset.scenario === numStr) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // 2. Crossfade Left-Side Spotlight Panels (Single Active Card)
    spotlightPanels.forEach((panel) => {
      if (panel.dataset.scenario === numStr) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // 3. Update Step Rail Quick-Selector Buttons
    stepRailBtns.forEach((btn) => {
      if (btn.dataset.step === numStr) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 4. Update Telemetry Dots
    telemetryDots.forEach((dot) => {
      if (dot.dataset.target === numStr) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // 5. Update Step Counter Text
    if (stepCounter) {
      stepCounter.textContent = `DIMENSION 0${numStr} / 05`;
    }

    // 6. Update Telemetry Floating Badge Details
    const data = scenarioMeta[numStr];
    if (data) {
      if (hudTag) hudTag.textContent = data.tag;
      if (hudHeadline) hudHeadline.textContent = data.headline;
      if (hudSub) hudSub.textContent = data.sub;
      if (hudChip1) hudChip1.textContent = data.chip1;
      if (hudChip2) hudChip2.textContent = data.chip2;
      if (hudChip3) hudChip3.textContent = data.chip3;
    }
  }

  // Scroll Position Controller (requestAnimationFrame throttled)
  let isTicking = false;

  function handleScrollyProgress() {
    if (!scrollyTrack) return;
    const rect = scrollyTrack.getBoundingClientRect();
    const trackHeight = scrollyTrack.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollDistance = trackHeight - viewportHeight;

    if (scrollDistance <= 0) return;

    // Progress from 0 (track top hits top of viewport) to 1 (track bottom hits bottom of viewport)
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));

    // Update progress fill bar
    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(5, Math.round(progress * 100)))}%`;
    }

    // Map progress to 5 discrete scenarios (1..5)
    let scenario = 1;
    if (progress < 0.20) {
      scenario = 1;
    } else if (progress < 0.40) {
      scenario = 2;
    } else if (progress < 0.60) {
      scenario = 3;
    } else if (progress < 0.80) {
      scenario = 4;
    } else {
      scenario = 5;
    }

    if (scenario !== currentScenario) {
      activateEnvironment(scenario);
    }
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        handleScrollyProgress();
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });

  // Smooth click-to-scroll navigation
  function scrollToScenario(num) {
    if (!scrollyTrack) return;
    const rect = scrollyTrack.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const scrollDistance = scrollyTrack.offsetHeight - window.innerHeight;
    if (scrollDistance <= 0) return;

    const targetProgress = ((num - 1) * 0.20) + 0.08;
    const targetY = trackTop + (targetProgress * scrollDistance);

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }

  stepRailBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step, 10);
      scrollToScenario(step);
    });
  });

  telemetryDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const step = parseInt(dot.dataset.target, 10);
      scrollToScenario(step);
    });
  });

  // Keyboard navigation when near or inside section
  document.addEventListener('keydown', (e) => {
    if (!scrollyTrack) return;
    const rect = scrollyTrack.getBoundingClientRect();
    const isVisible = rect.top <= window.innerHeight && rect.bottom >= 0;
    if (!isVisible) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      if (currentScenario < totalScenarios) {
        e.preventDefault();
        scrollToScenario(currentScenario + 1);
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      if (currentScenario > 1) {
        e.preventDefault();
        scrollToScenario(currentScenario - 1);
      }
    }
  });

  // Initial check on load
  handleScrollyProgress();
});

