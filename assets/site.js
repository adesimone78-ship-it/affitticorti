/* ============================================================
   AffittiBrevi.it — Shared site script
   FB welcome banner, WhatsApp link, UTM auto-tagger,
   Pixel tracking helper, lead form handler, mobile nav drawer.
   Loaded with `defer` from every page.
   ============================================================ */
(function(){
  'use strict';

  // ---- Defaults (page can override by setting window.FB_CONFIG BEFORE this script runs) ----
  var cfg = window.FB_CONFIG = Object.assign({
    groupUrl: 'https://www.facebook.com/groups/202432716476431/',
    groupName: 'Affitti corti - Case vacanza',
    groupMembers: '+10.000',
    pageUrl: 'https://www.facebook.com/affitticorti/',
    pageHandle: 'affitticorti',
    messengerUrl: 'https://m.me/affitticorti',
    whatsapp: '393207637442',
    whatsappMsg: 'Ciao! Arrivo dal sito AffittiBrevi, vorrei info su...'
  }, window.FB_CONFIG || {});

  // ---- 1) WhatsApp link composer (FAB) ----
  var wa = document.getElementById('fabWA');
  if (wa) wa.href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(cfg.whatsappMsg);

  // ---- 2) Messenger link composer (FAB) ----
  var msg = document.getElementById('fabMsg');
  if (msg) msg.href = cfg.messengerUrl;

  // ---- 3) Detect Facebook referrer / utm / fbclid → show welcome banner ----
  var fromFB = /facebook\.com|fb\.com|l\.facebook|m\.facebook/i.test(document.referrer || '')
            || /(\?|&)utm_source=facebook/i.test(location.search)
            || /(\?|&)fbclid=/i.test(location.search);
  if (fromFB) {
    var banner = document.getElementById('fbWelcome');
    if (banner) banner.classList.add('show');
    try { sessionStorage.setItem('src','facebook'); } catch(e){}
  }

  // ---- 4) UTM auto-tagger su link interni (preserva attribuzione FB tra pagine) ----
  var utmSource = new URLSearchParams(location.search).get('utm_source');
  if (utmSource === 'facebook' || fromFB) {
    document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"], a[href*="' + location.host + '"]').forEach(function(a){
      try {
        var u = new URL(a.href, location.origin);
        if (u.origin !== location.origin) return;
        if (!u.searchParams.get('utm_source')) {
          u.searchParams.set('utm_source','facebook');
          u.searchParams.set('utm_medium','group');
          u.searchParams.set('utm_campaign','affitticorti');
          a.href = u.toString();
        }
      } catch(e){}
    });
  }

  // ---- 5) Pixel event helper (no-op se fbq non caricato) ----
  function track(ev, data){
    if (window.fbq) window.fbq('track', ev, data || {});
    if (window.dataLayer) window.dataLayer.push(Object.assign({event:'fb_' + ev}, data || {}));
  }
  window.abTrack = track;

  // ---- 6) Track outbound FB / WA / Messenger ----
  document.querySelectorAll('[data-fb-track]').forEach(function(el){
    el.addEventListener('click', function(){
      track('Contact', { method: el.getAttribute('data-fb-track') });
    });
  });

  // ---- 7) Track ViewContent per articoli blog (cards .post) ----
  document.querySelectorAll('.post').forEach(function(p){
    p.addEventListener('click', function(){
      var h = p.querySelector('h3');
      track('ViewContent', {
        content_name: h ? h.textContent.trim() : '',
        content_category: 'blog'
      });
    });
  });

  // ---- 8) Lead form: Pixel Lead event + UI success state ----
  document.querySelectorAll('form.lead-form').forEach(function(form){
    form.addEventListener('submit', function(e){
      var fd = new FormData(form);
      var profile = fd.get('profile') || 'unknown';
      track('Lead', {
        content_category: profile,
        content_name: form.dataset.leadName || 'consulenza',
        value: profile === 'host' ? 50 : 10,
        currency: 'EUR'
      });
      e.preventDefault();
      form.innerHTML =
        '<div style="text-align:center;padding:24px">' +
          '<div style="font-size:42px">✅</div>' +
          '<h3 style="margin-top:8px;font-size:20px">Richiesta inviata</h3>' +
          '<p style="color:#5a6573;margin-top:6px">Ti ricontattiamo entro 24h. Nel frattempo, ' +
          '<a href="' + cfg.groupUrl + '" target="_blank" rel="noopener" style="color:#1877f2;font-weight:600">unisciti al gruppo →</a></p>' +
        '</div>';
    });
  });

  // ---- 8b) Auto-mark active nav link (aria-current + .is-active) ----
  (function(){
    var here = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '/') || '/';
    document.querySelectorAll('.nav-links a, .nav-drawer a').forEach(function(a){
      var href = a.getAttribute('href') || '';
      // Salta link esterni, ancore e qualsiasi link che punta a una sezione (#):
      // i link con hash sono "salti di sezione", non pagine → mai aria-current.
      if (/^https?:|^mailto:|^tel:/.test(href)) return;
      if (href.indexOf('#') !== -1) return;
      try {
        var target = new URL(a.href, location.origin).pathname.replace(/index\.html$/, '').replace(/\/+$/, '/') || '/';
        // section match: current path starts with the link's section (but not the bare home matching everything)
        var isHome = target === '/';
        if ((isHome && here === '/') || (!isHome && here.indexOf(target) === 0)) {
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'page');
        }
      } catch(e){}
    });
  })();

  // ---- 9) Mobile nav drawer ----
  var burger = document.querySelector('.nav .burger');
  var drawer = document.getElementById('navDrawer');
  if (burger && drawer) {
    burger.addEventListener('click', function(){
      drawer.classList.toggle('open');
      burger.setAttribute('aria-expanded', drawer.classList.contains('open'));
    });
    // close drawer on link click
    drawer.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ drawer.classList.remove('open'); });
    });
  }

  // ---- 10) Sticky-ad close: rimuovi padding del body ----
  var stickyClose = document.querySelector('.ads-sticky-footer .ads-close');
  if (stickyClose) {
    stickyClose.addEventListener('click', function(){
      var ad = stickyClose.closest('.ads-sticky-footer');
      if (ad) ad.style.display = 'none';
      document.body.style.paddingBottom = '0';
    });
  }

  // ---- 11) FB welcome banner close ----
  var fbClose = document.querySelector('#fbWelcome .x');
  if (fbClose) {
    fbClose.addEventListener('click', function(){
      document.getElementById('fbWelcome').classList.remove('show');
    });
  }

  // ---- 12) AdSense — fill every .ads placeholder from a single config ----
  // To activate ads: set window.ADS_CONFIG.client (+ slot IDs) BEFORE this script,
  // or edit the defaults below once. Without a client, placeholders stay inert
  // styled boxes (no requests, no layout shift).
  var ADS = window.ADS_CONFIG = Object.assign({
    client: 'ca-pub-1145255592067202',                 // es. 'ca-pub-XXXXXXXXXXXXXXXX'
    slots: {                    // ID unità pubblicitarie create su AdSense
      'ads-above-fold':   '',
      'ads-in-article':   '',
      'ads-sticky-footer':''
    }
  }, window.ADS_CONFIG || {});

  (function initAds(){
    if (!ADS.client) return;    // non configurato → lascia i box inerti
    if (!document.querySelector('script[data-adsense]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ADS.client);
      s.crossOrigin = 'anonymous';
      s.setAttribute('data-adsense', '1');
      document.head.appendChild(s);
    }
    var types = ['ads-above-fold','ads-in-article','ads-sticky-footer'];
    document.querySelectorAll('.ads').forEach(function(box){
      if (box.querySelector('ins.adsbygoogle')) return;
      var type = types.filter(function(t){ return box.classList.contains(t); })[0] || 'ads-in-article';
      var slot = (ADS.slots && ADS.slots[type]) || '';
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', ADS.client);
      if (slot) ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      box.appendChild(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
    });
  })();
})();
