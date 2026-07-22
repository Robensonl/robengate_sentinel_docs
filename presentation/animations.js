/**
 * RobenGate Sentinel — Professional Presentation
 * Navigation & Animation Logic (Vanilla JS)
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     State
  ────────────────────────────────────────────── */
  const TOTAL_SLIDES = 12;
  let current = 1;
  let isAnimating = false;

  /* ──────────────────────────────────────────────
     DOM Helpers
  ────────────────────────────────────────────── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ──────────────────────────────────────────────
     Navigation
  ────────────────────────────────────────────── */
  function goToSlide(n) {
    if (isAnimating) return;
    if (n < 1 || n > TOTAL_SLIDES) return;
    if (n === current) return;

    isAnimating = true;

    const leaving = $(`#slide-${current}`);
    const entering = $(`#slide-${n}`);

    // Start fade-out
    leaving.classList.add('fade-out');

    setTimeout(() => {
      leaving.classList.remove('active', 'fade-out');
      entering.classList.add('active');

      // Trigger slide animations after a brief paint delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          animateSlide(n);
        });
      });

      current = n;
      updateUI();
      isAnimating = false;
    }, 600);
  }

  function nextSlide() { goToSlide(current + 1); }
  function prevSlide() { goToSlide(current - 1); }

  /* ──────────────────────────────────────────────
     UI Sync
  ────────────────────────────────────────────── */
  function updateUI() {
    // Progress indicator
    $('#progress-indicator').textContent = `${current} / ${TOTAL_SLIDES}`;

    // Buttons
    $('#btn-prev').disabled = current === 1;
    $('#btn-next').disabled = current === TOTAL_SLIDES;

    // Dots
    $$('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i + 1 === current);
    });
  }

  /* ──────────────────────────────────────────────
     Per-Slide Animations
  ────────────────────────────────────────────── */
  function animateSlide(n) {
    const slide = $(`#slide-${n}`);
    if (!slide) return;

    // Generic elements that all slides share
    animateElements(slide, '.slide-section-tag', 0);
    animateElements(slide, '.slide-title', 60);
    animateElements(slide, '.accent-line', 100);
    animateElements(slide, '.slide-subtitle', 140);

    switch (n) {
      case 1:  animateSlide1(slide); break;
      case 2:  animateSlide2(slide); break;
      case 3:  animateSlide3(slide); break;
      case 4:  animateSlide4(slide); break;
      case 5:  animateSlide5(slide); break;
      case 6:  animateSlide6(slide); break;
      case 7:  animateSlide7(slide); break;
      case 8:  animateSlide8(slide); break;
      case 9:  animateSlide9(slide); break;
      case 10: animateSlide10(slide); break;
      case 11: animateSlide11(slide); break;
      case 12: animateSlide12(slide); break;
    }
  }

  /* Helper: add class .anim after delay */
  function animateElements(parent, selector, baseDelay) {
    parent.querySelectorAll(selector).forEach((el, i) => {
      setTimeout(() => el.classList.add('anim'), baseDelay + i * 40);
    });
  }

  function delay(el, ms) {
    setTimeout(() => el.classList.add('anim'), ms);
  }

  /* Slide 1 — Cover */
  function animateSlide1(s) {
    delay(s.querySelector('.cover-logo'), 0);
    delay(s.querySelector('.cover-title'), 300);
    delay(s.querySelector('.cover-tagline'), 500);
    delay(s.querySelector('.cover-divider'), 650);
    s.querySelectorAll('.cover-info-item').forEach((el, i) => {
      setTimeout(() => el.style.cssText = 'opacity:1;transform:none;transition:opacity 0.5s ease,transform 0.5s ease', 750 + i * 100);
    });
  }

  /* Slide 2 — Index */
  function animateSlide2(s) {
    s.querySelectorAll('.index-item').forEach((el, i) => {
      setTimeout(() => el.classList.add('anim'), 200 + i * 80);
    });
  }

  /* Slide 3 — Who am I */
  function animateSlide3(s) {
    delay(s.querySelector('.profile-col'), 100);
    delay(s.querySelector('.profile-name'), 200);
    s.querySelectorAll('.profile-item').forEach((el, i) => {
      setTimeout(() => {
        el.style.cssText = 'opacity:1;transform:none;transition:opacity 0.5s ease,transform 0.5s ease';
      }, 300 + i * 100);
    });
  }

  /* Slide 4 — Problem */
  function animateSlide4(s) {
    s.querySelectorAll('.problem-card').forEach((el, i) => {
      setTimeout(() => el.classList.add('anim'), 200 + i * 150);
    });
    setTimeout(() => s.querySelector('.opportunity-banner')?.classList.add('anim'), 750);
  }

  /* Slide 5 — Solution */
  function animateSlide5(s) {
    delay(s.querySelector('.solution-logo-col'), 100);
    s.querySelectorAll('.feature-item').forEach((el, i) => {
      setTimeout(() => el.style.cssText = 'opacity:1;transform:none;transition:opacity 0.5s ease,transform 0.5s ease', 250 + i * 80);
    });
    s.querySelectorAll('.badge').forEach((el, i) => {
      setTimeout(() => el.style.cssText = 'opacity:1;transition:opacity 0.5s ease', 500 + i * 80);
    });
  }

  /* Slide 6 — Architecture */
  function animateSlide6(s) {
    const layers = s.querySelectorAll('.arch-layer');
    const arrows = s.querySelectorAll('.arch-arrow');
    layers.forEach((el, i) => {
      setTimeout(() => el.classList.add('anim'), 150 + i * 130);
    });
    arrows.forEach((el, i) => {
      setTimeout(() => el.classList.add('anim'), 230 + i * 130);
    });
  }

  /* Slide 7 — Modules */
  function animateSlide7(s) {
    s.querySelectorAll('.module-card').forEach((el, i) => {
      setTimeout(() => el.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity 0.5s ease,transform 0.5s ease,border-color 0.3s ease,box-shadow 0.3s ease', 150 + i * 90);
    });
  }

  /* Slide 8 — Zero-Trust */
  function animateSlide8(s) {
    s.querySelectorAll('.zt-info-card').forEach((el, i) => {
      setTimeout(() => el.classList.add('anim'), 150 + i * 150);
    });
    delay(s.querySelector('.owasp-badge'), 200);

    // Animate progress bars after they appear
    s.querySelectorAll('.progress-row').forEach((row, i) => {
      setTimeout(() => {
        row.classList.add('anim');
        const fill = row.querySelector('.progress-bar-fill');
        if (fill) {
          const target = fill.dataset.width || '80%';
          setTimeout(() => { fill.style.width = target; }, 150);
        }
      }, 350 + i * 120);
    });
  }

  /* Slide 9 — Results (count-up animation) */
  function animateSlide9(s) {
    s.querySelectorAll('.result-card').forEach((card, i) => {
      setTimeout(() => {
        card.classList.add('anim');
        const numEl = card.querySelector('.result-number');
        if (numEl) {
          const target = parseInt(numEl.dataset.target, 10);
          if (!isNaN(target)) countUp(numEl, target, 900);
        }
      }, 150 + i * 120);
    });
  }

  /* Slide 10 — Challenges */
  function animateSlide10(s) {
    s.querySelectorAll('.challenges-table tbody tr').forEach((row, i) => {
      const cells = row.querySelectorAll('td');
      setTimeout(() => {
        cells.forEach(td => {
          td.style.cssText = 'opacity:1;transform:none;transition:opacity 0.5s ease,transform 0.5s ease';
        });
      }, 200 + i * 150);
    });
  }

  /* Slide 11 — Learnings */
  function animateSlide11(s) {
    s.querySelectorAll('.learning-card').forEach((el, i) => {
      setTimeout(() => el.style.cssText = 'opacity:1;transform:none;transition:opacity 0.5s ease,transform 0.5s ease,border-color 0.3s ease,box-shadow 0.3s ease', 150 + i * 100);
    });
    delay(s.querySelector('.closing-quote'), 750);
    delay(s.querySelector('.next-step'), 900);
  }

  /* Slide 12 — Closing */
  function animateSlide12(s) {
    delay(s.querySelector('.closing-logo'), 0);
    delay(s.querySelector('.closing-thanks'), 200);
    delay(s.querySelector('.closing-sub'), 380);
    s.querySelectorAll('.closing-col').forEach((el, i) => {
      setTimeout(() => el.classList.add('anim'), 520 + i * 150);
    });
  }

  /* ──────────────────────────────────────────────
     Count-Up Utility
  ────────────────────────────────────────────── */
  function countUp(el, target, duration) {
    const start = performance.now();
    const suffix = el.dataset.suffix || '';
    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ──────────────────────────────────────────────
     Event Listeners
  ────────────────────────────────────────────── */
  function initEvents() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    });

    // Nav buttons
    $('#btn-prev').addEventListener('click', prevSlide);
    $('#btn-next').addEventListener('click', nextSlide);
    $('#btn-pdf').addEventListener('click', exportPDF);
    $('#btn-fullscreen').addEventListener('click', toggleFullscreen);

    // Dots
    $$('.dot').forEach((dot) => {
      dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.slide, 10)));
    });

    // Touch swipe
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) { dx < 0 ? nextSlide() : prevSlide(); }
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────
     Fullscreen
  ────────────────────────────────────────────── */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  /* ──────────────────────────────────────────────
     PDF Export
  ────────────────────────────────────────────── */
  function exportPDF() {
    // Reset all animated elements to visible before printing
    $$('.slide').forEach((slide) => {
      slide.querySelectorAll('[class]').forEach((el) => {
        el.classList.add('anim');
      });
      // Force progress bars
      slide.querySelectorAll('.progress-bar-fill').forEach((bar) => {
        bar.style.width = bar.dataset.width || '80%';
      });
      // Force result numbers
      slide.querySelectorAll('.result-number[data-target]').forEach((el) => {
        el.textContent = el.dataset.target + (el.dataset.suffix || '');
      });
    });
    window.print();
  }

  /* ──────────────────────────────────────────────
     Init
  ────────────────────────────────────────────── */
  function init() {
    // Activate first slide
    $(`#slide-1`).classList.add('active');
    updateUI();
    initEvents();

    // Run animations for first slide after fonts load
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animateSlide(1);
      });
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globally for inline onclick usage if needed
  window.goToSlide = goToSlide;
  window.nextSlide = nextSlide;
  window.prevSlide = prevSlide;
})();
