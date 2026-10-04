/*!
 * Maa Furniture - Luxury Minimalist White Splash Screen Engine
 * - Smooth, high-performance progress loader (0.8s - 1.1s)
 * - Seamless fade-out into light luxury homepage
 * - Zero link hijacking & resilient fail-safe fallbacks
 */
(function () {
  'use strict';

  var splash = document.getElementById('maa-splash-screen');
  var progressBar = document.getElementById('maa-progress-bar');
  var counterNum = document.getElementById('maa-counter-num');
  var statusText = document.getElementById('maa-status-text');

  if (!splash) return;

  var currentProgress = 0;
  var targetProgress = 0;
  var isExited = false;
  var animFrameId = null;

  /* ---- 1. Scroll Locking ---- */
  function lockScroll() {
    document.documentElement.classList.add('maa-loading-locked');
    if (document.body) document.body.classList.add('maa-loading-locked');
  }

  function unlockScroll() {
    document.documentElement.classList.remove('maa-loading-locked');
    if (document.body) document.body.classList.remove('maa-loading-locked');
  }

  /* ---- 2. Dynamic Status Text ---- */
  function updateStatus(val) {
    if (!statusText) return;
    if (val < 45) {
      statusText.textContent = 'Loading';
    } else if (val < 85) {
      statusText.textContent = 'Curating Spaces';
    } else {
      statusText.textContent = 'Welcome';
    }
  }

  /* ---- 3. Smooth Progression Loop ---- */
  function stepProgress() {
    if (isExited) return;

    if (currentProgress < targetProgress) {
      var diff = targetProgress - currentProgress;
      var step = Math.max(0.8, diff * 0.15);
      currentProgress = Math.min(targetProgress, currentProgress + step);

      if (progressBar) progressBar.style.width = currentProgress.toFixed(1) + '%';
      if (counterNum) counterNum.textContent = Math.round(currentProgress) + '%';
      updateStatus(currentProgress);
    }

    if (currentProgress >= 100) {
      finishSplash();
      return;
    }

    animFrameId = requestAnimationFrame(stepProgress);
  }

  /* ---- 4. Elegant Fade-Out Finish ---- */
  function finishSplash() {
    if (isExited) return;
    isExited = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    if (progressBar) progressBar.style.width = '100%';
    if (counterNum) counterNum.textContent = '100%';
    updateStatus(100);

    setTimeout(function () {
      splash.classList.add('maa-splash-exit');
      unlockScroll();

      setTimeout(function () {
        if (splash && splash.parentNode) {
          splash.style.display = 'none';
        }
      }, 500);
    }, 120);
  }

  /* ---- 5. Progression Stages & Events ---- */
  lockScroll();

  // Rapid natural progress stages
  targetProgress = 40;
  stepProgress();

  setTimeout(function () {
    if (!isExited && targetProgress < 75) targetProgress = 75;
  }, 250);

  setTimeout(function () {
    if (!isExited && targetProgress < 95) targetProgress = 95;
  }, 500);

  function onWindowReady() {
    setTimeout(function () {
      targetProgress = 100;
    }, 200);
  }

  if (document.readyState === 'complete') {
    onWindowReady();
  } else {
    window.addEventListener('load', onWindowReady);
  }

  // Guaranteed failsafe: Never keep the user waiting more than 1.5s
  setTimeout(function () {
    if (!isExited) {
      targetProgress = 100;
    }
  }, 1500);

})();
