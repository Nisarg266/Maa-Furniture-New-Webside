/*!
 * Maa Furniture - static-site behavior fixes
 * - All forms (contact / estimate / appointment / login) -> WhatsApp enquiry
 * - Add-to-cart buttons -> WhatsApp product enquiry (button look unchanged)
 * - Shop sort/filter & dead AJAX endpoints silenced (no console errors)
 * No UI is changed by this file.
 */
(function () {
  'use strict';
  var WA_NUMBER = '919724086935';

  function waOpen(message) {
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
    var w = window.open(url, '_blank');
    if (!w) window.location.href = url; // popup blocked fallback
  }

  /* ---- silence dead PHP AJAX endpoints (admin-ajax / wc-ajax) ---- */
  function shimJqueryAjax() {
    if (!window.jQuery || window.jQuery.__maaShim) return;
    var orig = window.jQuery.ajax;
    window.jQuery.ajax = function (a, b) {
      var o = (typeof a === 'string') ? Object.assign({ url: a }, b || {}) : (a || {});
      var u = String(o.url || '');
      if (u.indexOf('admin-ajax') !== -1 || u.indexOf('wc-ajax') !== -1 || u.indexOf('wp-json') !== -1) {
        return window.jQuery.Deferred().resolve({}).promise();
      }
      return orig.apply(this, arguments);
    };
    window.jQuery.__maaShim = true;
  }
  shimJqueryAjax();

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      var u = (typeof input === 'string') ? input : (input && input.url) || '';
      if (u.indexOf('admin-ajax') !== -1 || u.indexOf('wc-ajax') !== -1) {
        return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return origFetch.apply(this, arguments);
    };
  }

  /* ---- helper: nice label for a field ---- */
  function fieldLabel(el) {
    if (el.placeholder) return el.placeholder;
    if (el.name) return el.name.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    return 'Field';
  }

  function collectFormMessage(form, header) {
    var parts = [header];
    var seen = {};
    var els = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var t = (el.type || '').toLowerCase();
      if (['submit', 'button', 'hidden', 'password', 'file', 'checkbox', 'radio'].indexOf(t) !== -1) continue;
      if (el.name && (el.name.indexOf('wpcf7') === 0 || el.name.indexOf('wpforms') === 0)) continue;
      if (!el.value || !el.value.trim) continue;
      var v = el.value.trim();
      if (v.length > 500) v = v.slice(0, 500) + '...';
      var key = fieldLabel(el) + '=' + v;
      if (seen[key]) continue;
      seen[key] = 1;
      parts.push(fieldLabel(el) + ': ' + v);
    }
    return parts.join('\n');
  }

  function bindWhatsappForm(form, header) {
    if (form.__maaBound) return;
    form.__maaBound = true;
    form.noValidate = true; // skip native validation that blocks dead forms
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      waOpen(collectFormMessage(form, header));
      return false;
    }, true); // capture phase: runs before plugin handlers
  }

  /* ---- add-to-cart -> WhatsApp product enquiry ---- */
  function productNameFromNode(node) {
    var el = null;
    // single product page: the product title is the H1
    var single = document.querySelector('h1.product_title, .single-product h1');
    if (single) el = single;
    if (!el) {
      var card = node.closest ? node.closest('.product, li.product, article') : null;
      if (card) el = card.querySelector('.woocommerce-loop-product__title, .product-title, h2, h3');
    }
    if (!el) el = document.querySelector('h1');
    var name = el ? el.textContent.trim() : '';
    if (name.length > 80) name = name.slice(0, 80); // avoid grabbing long marketing headings
    return name || 'your products';
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var btn = t.closest('a.ajax_add_to_cart, .single_add_to_cart_button, a.add_to_cart_button, button.add_to_cart_button');
    if (!btn) return;
    // let real <a href> fall through only if JS missing; here we intercept:
    e.preventDefault();
    e.stopImmediatePropagation();
    var qty = document.querySelector('input.qty');
    var name = productNameFromNode(btn);
    var msg = 'Hello Maa Furniture! I am interested in "' + name + '".';
    if (qty && parseInt(qty.value, 10) > 1) msg += ' (Quantity: ' + qty.value + ')';
    msg += ' Please share the price and details.';
    waOpen(msg);
  }, true);

  /* ---- shop ordering (sort) form: keep on page ---- */
  function bindOrderingForms() {
    var forms = document.querySelectorAll('form.woocommerce-ordering');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function (e) { e.preventDefault(); }, true);
      var sel = forms[i].querySelector('select');
      if (sel) {
        (function (s) {
          s.addEventListener('change', function (e) { e.preventDefault(); e.stopPropagation(); });
        })(sel);
      }
    }
  }

  /* ==========================================================================
     Maa Furniture - Smart Sticky Auto-Hide Header
     - Hides when scrolling down (clean reading experience)
     - Reveals smoothly when scrolling up (instant access to navigation)
     - Transparent when at top of page (preserves hero aesthetics)
     - Luxury glass backdrop when pinned
     ========================================================================== */
  function initSmartHeader() {
    var header = document.querySelector('#masthead .header-absolute') ||
                 document.querySelector('#masthead') ||
                 document.querySelector('header.site-header') ||
                 document.querySelector('header');

    if (!header || header.__maaSmartInit) return;
    header.__maaSmartInit = true;

    // Inject fallback stylesheet in case styles are not yet loaded
    if (!document.getElementById('maa-smart-header-css')) {
      var style = document.createElement('style');
      style.id = 'maa-smart-header-css';
      style.textContent = 
        '#masthead, #masthead .elementor-42, #masthead .header-absolute { overflow: visible !important; }' +
        '#masthead .header-absolute, #masthead.maa-smart-header {' +
        '  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1),' +
        '              background 0.32s ease,' +
        '              box-shadow 0.32s ease,' +
        '              border-color 0.32s ease,' +
        '              backdrop-filter 0.32s ease,' +
        '              -webkit-backdrop-filter 0.32s ease !important;' +
        '  will-change: transform;' +
        '}' +
        '#masthead .header-absolute.maa-header-top, #masthead.maa-header-top {' +
        '  position: absolute !important;' +
        '  top: 0; left: 0; right: 0; width: 100%;' +
        '  transform: translateY(0) !important;' +
        '  background-color: transparent !important;' +
        '  box-shadow: none !important;' +
        '  border-bottom: 1px solid transparent !important;' +
        '}' +
        '#masthead .header-absolute.maa-header-hidden, #masthead.maa-header-hidden {' +
        '  position: fixed !important;' +
        '  top: 0; left: 0; right: 0; width: 100%;' +
        '  z-index: 99999 !important;' +
        '  transform: translateY(-115%) !important;' +
        '  pointer-events: none !important;' +
        '  background: rgba(18, 16, 14, 0.94) !important;' +
        '  backdrop-filter: blur(16px) !important;' +
        '  -webkit-backdrop-filter: blur(16px) !important;' +
        '}' +
        '#masthead .header-absolute.maa-header-pinned, #masthead.maa-header-pinned {' +
        '  position: fixed !important;' +
        '  top: 0; left: 0; right: 0; width: 100%;' +
        '  z-index: 99999 !important;' +
        '  transform: translateY(0) !important;' +
        '  pointer-events: all !important;' +
        '  background: rgba(18, 16, 14, 0.94) !important;' +
        '  backdrop-filter: blur(16px) !important;' +
        '  -webkit-backdrop-filter: blur(16px) !important;' +
        '  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35) !important;' +
        '  border-bottom: 1px solid rgba(202, 160, 92, 0.25) !important;' +
        '}' +
        '.elementor-42 #masthead .header-absolute.maa-header-pinned,' +
        '#masthead .header-absolute.maa-header-pinned {' +
        '  padding-top: 10px !important;' +
        '  padding-bottom: 10px !important;' +
        '}' +
        '@media (max-width: 1024px) {' +
        '  .elementor-42 #masthead .header-absolute.maa-header-pinned,' +
        '  #masthead .header-absolute.maa-header-pinned {' +
        '    padding-top: 14px !important;' +
        '    padding-bottom: 14px !important;' +
        '  }' +
        '}' +
        '#masthead .elementor-element-3ae6e686 {' +
        '  display: flex !important;' +
        '  flex-direction: row !important;' +
        '  flex-wrap: nowrap !important;' +
        '  align-items: center !important;' +
        '  justify-content: space-between !important;' +
        '  width: 100% !important;' +
        '  max-width: 100% !important;' +
        '  box-sizing: border-box !important;' +
        '}' +
        '#masthead .elementor-element-2233113a {' +
        '  display: flex !important;' +
        '  flex-direction: row !important;' +
        '  flex-wrap: nowrap !important;' +
        '  align-items: center !important;' +
        '  width: auto !important;' +
        '  max-width: none !important;' +
        '  flex: 1 1 auto !important;' +
        '  min-width: 0 !important;' +
        '}' +
        '#masthead .elementor-element-3023e72a {' +
        '  display: flex !important;' +
        '  flex-direction: row !important;' +
        '  flex-wrap: nowrap !important;' +
        '  align-items: center !important;' +
        '  justify-content: flex-end !important;' +
        '  width: auto !important;' +
        '  max-width: none !important;' +
        '  flex: 0 0 auto !important;' +
        '  margin-left: 20px !important;' +
        '  gap: 16px !important;' +
        '}' +
        '#masthead .elementor-element-e722053 {' +
        '  flex: 1 1 auto !important;' +
        '  min-width: 0 !important;' +
        '  width: auto !important;' +
        '  max-width: none !important;' +
        '}' +
        '#masthead .elementor-element-e722053 .main-navigation ul.menu {' +
        '  display: flex !important;' +
        '  flex-direction: row !important;' +
        '  flex-wrap: nowrap !important;' +
        '  align-items: center !important;' +
        '  gap: clamp(8px, 1.2vw, 22px) !important;' +
        '  margin: 0 !important;' +
        '  padding: 0 !important;' +
        '}' +
        '#masthead .elementor-element-e722053 .main-navigation ul.menu > li.menu-item > a {' +
        '  white-space: nowrap !important;' +
        '  font-size: 14px !important;' +
        '  padding: 8px 4px !important;' +
        '  display: inline-flex !important;' +
        '  align-items: center !important;' +
        '}' +
        '@media (min-width: 1025px) {' +
        '  #masthead .elementor-element-65ff6f95.elementor-hidden-tablet_extra {' +
        '    display: inline-flex !important;' +
        '  }' +
        '}';
      document.head.appendChild(style);
    }

    header.classList.add('maa-smart-header');
    header.classList.add('maa-header-top');

    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var topThreshold = 80;
    var scrollDeltaThreshold = 6;
    var ticking = false;

    function onScrollUpdate() {
      var currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (currentScrollY < 0) currentScrollY = 0;

      // 1. When near the top of the page
      if (currentScrollY <= topThreshold) {
        header.classList.remove('maa-header-hidden');
        header.classList.remove('maa-header-pinned');
        header.classList.add('maa-header-top');
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      // 2. Ignore scroll if mobile menu is open
      var isMenuOpen = document.body.classList.contains('menu-mobile-active') ||
                       document.body.classList.contains('canvas-menu-open') ||
                       document.querySelector('.antra-canvas-menu.active') ||
                       document.querySelector('.elementor-canvas-menu-wrapper.active') ||
                       document.querySelector('.menu-mobile-nav-button.active');
      if (isMenuOpen) {
        ticking = false;
        return;
      }

      // 3. Direction check
      var diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) >= scrollDeltaThreshold) {
        if (diff > 0) {
          // Scrolling DOWN -> HIDE HEADER
          header.classList.remove('maa-header-top');
          header.classList.remove('maa-header-pinned');
          header.classList.add('maa-header-hidden');
        } else {
          // Scrolling UP -> REVEAL HEADER
          header.classList.remove('maa-header-top');
          header.classList.remove('maa-header-hidden');
          header.classList.add('maa-header-pinned');
        }
        lastScrollY = currentScrollY;
      }

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(onScrollUpdate);
        ticking = true;
      }
    }, { passive: true });

    onScrollUpdate();
  }

  /* ---- Ensure consistent full header across all pages ---- */
  function ensureCompleteHeader() {
    var desktopMenu = document.querySelector('#masthead #menu-1-e722053');
    var mobileMenu = document.querySelector('#menu-main-menu');
    
    var prefix = './';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('maa-fixes.js') !== -1) {
        prefix = src.replace('maa-fixes.js', '');
        break;
      }
    }

    if (desktopMenu && !document.getElementById('menu-item-projects')) {
      var dItems = 
        '<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children" id="menu-item-projects"><a href="' + prefix + 'projects-01/index.html"><span class="menu-title">Projects</span></a>' +
        '<ul class="sub-menu">' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'projects-01/index.html"><span class="menu-title">Projects 01</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'projects-02/index.html"><span class="menu-title">Projects 02</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'projects-03/index.html"><span class="menu-title">Projects 03</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'virtual-tours/index.html"><span class="menu-title">Virtual Tours</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'gallery-01/index.html"><span class="menu-title">Gallery 01</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'gallery-02/index.html"><span class="menu-title">Gallery 02</span></a></li>' +
        '</ul></li>' +
        '<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children" id="menu-item-about"><a href="' + prefix + 'about-us/index.html"><span class="menu-title">About Us</span></a>' +
        '<ul class="sub-menu">' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'about-us/index.html"><span class="menu-title">About Us</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'our-teams/index.html"><span class="menu-title">Our Teams</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'testimonial/index.html"><span class="menu-title">Testimonials</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'pricing-plan/index.html"><span class="menu-title">Pricing Plan</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'faqs/index.html"><span class="menu-title">FAQs</span></a></li>' +
        '</ul></li>' +
        '<li class="menu-item menu-item-type-post_type menu-item-object-page" id="menu-item-blog"><a href="' + prefix + 'blog/index.html"><span class="menu-title">Blog</span></a></li>' +
        '<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children" id="menu-item-contact"><a href="' + prefix + 'contact-us/index.html"><span class="menu-title">Contact</span></a>' +
        '<ul class="sub-menu">' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'contact-us/index.html"><span class="menu-title">Contact Us</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'appointment/index.html"><span class="menu-title">Book Appointment</span></a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'free-price-estimate-2/index.html"><span class="menu-title">Free Price Estimate</span></a></li>' +
        '</ul></li>';
      desktopMenu.insertAdjacentHTML('beforeend', dItems);
    }

    if (mobileMenu && !mobileMenu.querySelector('a[href*="projects-01"]')) {
      var mItems = 
        '<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children"><a href="' + prefix + 'projects-01/index.html">Projects</a>' +
        '<ul class="sub-menu">' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'projects-01/index.html">Projects 01</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'projects-02/index.html">Projects 02</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'projects-03/index.html">Projects 03</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'virtual-tours/index.html">Virtual Tours</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'gallery-01/index.html">Gallery 01</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'gallery-02/index.html">Gallery 02</a></li>' +
        '</ul></li>' +
        '<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children"><a href="' + prefix + 'about-us/index.html">About Us</a>' +
        '<ul class="sub-menu">' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'about-us/index.html">About Us</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'our-teams/index.html">Our Teams</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'testimonial/index.html">Testimonials</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'pricing-plan/index.html">Pricing Plan</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'faqs/index.html">FAQs</a></li>' +
        '</ul></li>' +
        '<li class="menu-item menu-item-type-post_type menu-item-object-page"><a href="' + prefix + 'blog/index.html">Blog</a></li>' +
        '<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children"><a href="' + prefix + 'contact-us/index.html">Contact</a>' +
        '<ul class="sub-menu">' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'contact-us/index.html">Contact Us</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'appointment/index.html">Book Appointment</a></li>' +
        '<li class="menu-item menu-item-type-custom menu-item-object-custom"><a href="' + prefix + 'free-price-estimate-2/index.html">Free Price Estimate</a></li>' +
        '</ul></li>';
      mobileMenu.insertAdjacentHTML('beforeend', mItems);
    }
  }

  function init() {
    shimJqueryAjax();
    initSmartHeader();
    ensureCompleteHeader();
    var i, forms;
    // Contact Form 7
    forms = document.querySelectorAll('form.wpcf7-form');
    for (i = 0; i < forms.length; i++) bindWhatsappForm(forms[i], 'New enquiry from Maa Furniture website:');
    // WPForms (price estimate / appointment)
    forms = document.querySelectorAll('form.wpforms-form');
    for (i = 0; i < forms.length; i++) bindWhatsappForm(forms[i], 'New price estimate request from Maa Furniture website:');
    // theme ajax login form (header/account)
    forms = document.querySelectorAll('form.antra-login-form-ajax');
    for (i = 0; i < forms.length; i++) bindWhatsappForm(forms[i], 'Hello Maa Furniture! I need help with:');
    // WooCommerce checkout place-order (static site cannot process payments)
    forms = document.querySelectorAll('form.checkout, form.woocommerce-checkout');
    for (i = 0; i < forms.length; i++) bindWhatsappForm(forms[i], 'New order enquiry from Maa Furniture website:');
    bindOrderingForms();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', shimJqueryAjax);
  /* ---- load Maa Furniture luxury page transitions on all pages ---- */
  function loadMaaLoader() {
    if (window.MaaLoader) return;
    var prefix = './';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('maa-fixes.js') !== -1) {
        prefix = src.replace('maa-fixes.js', '');
        break;
      }
    }
    if (!document.getElementById('maa-loader-css')) {
      var link = document.createElement('link');
      link.id = 'maa-loader-css';
      link.rel = 'stylesheet';
      link.href = prefix + 'maa-loader.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('maa-loader-js')) {
      var script = document.createElement('script');
      script.id = 'maa-loader-js';
      script.src = prefix + 'maa-loader.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  if (!document.getElementById('maa-splash-screen')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadMaaLoader);
    else loadMaaLoader();
  }

})();
