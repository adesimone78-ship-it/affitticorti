/* ==========================================================================
   AffittiCorti.it — Cookie Consent + Google Consent Mode v2
   GDPR / ePrivacy compliant. Vanilla JS, zero dependencies.
   Usage: <script src="/assets/cookie-consent.js" defer></script>
          (must load BEFORE any tag: AdSense, Pixel, GA4)
   ========================================================================== */

(function () {
  'use strict';

  // ===== CONFIG =====
  var CFG = {
    cookieName: 'ab_consent_v1',
    cookieDays: 180,
    policyUrl: '/cookie/',
    privacyUrl: '/privacy/',
    brand: 'AffittiCorti.it',
    // categorie disponibili
    categories: [
      { id: 'necessary', label: 'Strettamente necessari', desc: 'Cookie tecnici indispensabili al funzionamento del sito (login, sessione, preferenze base). Sempre attivi, non disattivabili.', required: true },
      { id: 'analytics', label: 'Statistiche & misurazione', desc: 'Ci aiutano a capire come usi il sito (Google Analytics 4). Dati aggregati e anonimi.', required: false, consentKeys: ['analytics_storage'] },
      { id: 'marketing', label: 'Pubblicità & profilazione', desc: 'Cookie di Google AdSense, Meta Pixel e partner pubblicitari. Permettono annunci personalizzati e misurazione campagne.', required: false, consentKeys: ['ad_storage', 'ad_user_data', 'ad_personalization'] },
      { id: 'personalization', label: 'Personalizzazione contenuti', desc: 'Salvano le tue preferenze (lingua, regione, articoli letti) per migliorare la tua esperienza.', required: false, consentKeys: ['personalization_storage', 'functionality_storage'] }
    ]
  };

  // ===== CONSENT MODE v2 — SET DEFAULT (deny tutto tranne security) =====
  // DEVE essere il primo gtag call prima di qualsiasi altro tag
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    'ad_storage':              'denied',
    'ad_user_data':            'denied',
    'ad_personalization':      'denied',
    'analytics_storage':       'denied',
    'functionality_storage':   'denied',
    'personalization_storage': 'denied',
    'security_storage':        'granted',
    'wait_for_update':         500,
    'region':                  ['IT','EU']
  });

  // ===== COOKIE HELPERS =====
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }
  function loadConsent() {
    try { return JSON.parse(getCookie(CFG.cookieName)); } catch (e) { return null; }
  }
  function saveConsent(obj) {
    obj.ts = Date.now();
    obj.v = 1;
    setCookie(CFG.cookieName, JSON.stringify(obj), CFG.cookieDays);
  }

  // ===== APPLICA CONSENSO → Consent Mode update + dataLayer event =====
  function applyConsent(consent) {
    var update = {};
    CFG.categories.forEach(function (c) {
      if (c.required || !c.consentKeys) return;
      var granted = !!consent[c.id];
      c.consentKeys.forEach(function (k) {
        update[k] = granted ? 'granted' : 'denied';
      });
    });
    gtag('consent', 'update', update);
    window.dataLayer.push({ event: 'consent_update', consent: consent });
    // Hook custom: chi vuole può ascoltare 'ab:consent' su window
    window.dispatchEvent(new CustomEvent('ab:consent', { detail: consent }));
  }

  // ===== UI =====
  function injectStyles() {
    if (document.getElementById('ab-cc-styles')) return;
    var css = `
      .ab-cc-overlay{position:fixed;inset:0;background:rgba(11,26,43,.5);z-index:9998;backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .25s ease}
      .ab-cc-overlay.show{opacity:1;pointer-events:auto}
      .ab-cc-banner{position:fixed;left:14px;right:14px;bottom:14px;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(11,26,43,.22),0 2px 6px rgba(11,26,43,.08);z-index:9999;padding:20px 22px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#0b1a2b;transform:translateY(120%);transition:transform .35s cubic-bezier(.22,1,.36,1);max-width:520px}
      @media(min-width:760px){.ab-cc-banner{left:auto;right:24px;bottom:24px;max-width:440px}}
      .ab-cc-banner.show{transform:translateY(0)}
      .ab-cc-banner h3{font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:1.3;margin-bottom:6px}
      .ab-cc-banner p{font-size:13.5px;line-height:1.5;color:#5a6573;margin-bottom:14px}
      .ab-cc-banner p a{color:#0b5fff;text-decoration:underline}
      .ab-cc-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .ab-cc-actions .full{grid-column:1/-1}
      .ab-cc-btn{padding:11px 14px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;border:0;font-family:inherit;text-align:center;transition:all .15s ease;line-height:1.2}
      .ab-cc-btn.primary{background:#0b5fff;color:#fff}
      .ab-cc-btn.primary:hover{background:#0846bf}
      .ab-cc-btn.secondary{background:#fff;color:#0b1a2b;border:1px solid #e6e9ee}
      .ab-cc-btn.secondary:hover{background:#fafbfc;border-color:#cbd6e8}
      .ab-cc-btn.text{background:transparent;color:#5a6573;text-decoration:underline;padding:8px}
      .ab-cc-btn.text:hover{color:#0b1a2b}

      .ab-cc-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-46%) scale(.96);background:#fff;border-radius:18px;box-shadow:0 24px 80px rgba(11,26,43,.3);z-index:9999;width:calc(100% - 28px);max-width:560px;max-height:85vh;overflow:auto;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#0b1a2b}
      .ab-cc-modal.show{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}
      .ab-cc-modal-head{position:sticky;top:0;background:#fff;padding:22px 24px 14px;border-bottom:1px solid #e6e9ee;z-index:2}
      .ab-cc-modal-head h2{font-size:20px;font-weight:800;letter-spacing:-.01em;margin-bottom:4px}
      .ab-cc-modal-head p{font-size:13.5px;color:#5a6573;line-height:1.5}
      .ab-cc-modal-head .close{position:absolute;right:18px;top:18px;width:32px;height:32px;border-radius:50%;background:#fafbfc;border:0;cursor:pointer;font-size:18px;color:#5a6573;display:grid;place-items:center}
      .ab-cc-modal-head .close:hover{background:#e6e9ee;color:#0b1a2b}
      .ab-cc-modal-body{padding:14px 24px}
      .ab-cc-cat{padding:14px 0;border-bottom:1px solid #e6e9ee}
      .ab-cc-cat:last-child{border-bottom:0}
      .ab-cc-cat-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
      .ab-cc-cat-head h4{font-size:15px;font-weight:700;color:#0b1a2b;line-height:1.3}
      .ab-cc-cat-desc{font-size:13px;color:#5a6573;margin-top:4px;line-height:1.5}
      .ab-cc-tog{position:relative;width:46px;height:26px;background:#cbd6e8;border-radius:999px;cursor:pointer;flex-shrink:0;transition:background .15s ease;margin-top:2px}
      .ab-cc-tog::after{content:"";position:absolute;left:2px;top:2px;width:22px;height:22px;background:#fff;border-radius:50%;transition:transform .15s ease;box-shadow:0 1px 3px rgba(0,0,0,.2)}
      .ab-cc-tog.on{background:#10b981}
      .ab-cc-tog.on::after{transform:translateX(20px)}
      .ab-cc-tog.disabled{background:#10b981;opacity:.6;cursor:not-allowed}
      .ab-cc-tog input{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;margin:0}
      .ab-cc-modal-foot{position:sticky;bottom:0;background:#fff;border-top:1px solid #e6e9ee;padding:14px 24px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
      @media(min-width:520px){.ab-cc-modal-foot{grid-template-columns:1fr 1fr 1fr}}

      .ab-cc-fab{position:fixed;left:14px;bottom:14px;width:42px;height:42px;border-radius:50%;background:#fff;border:1px solid #e6e9ee;box-shadow:0 4px 14px rgba(11,26,43,.12);cursor:pointer;z-index:55;display:grid;place-items:center;font-size:18px}
      .ab-cc-fab:hover{background:#fafbfc}
      .ab-cc-fab[hidden]{display:none}
    `;
    var s = document.createElement('style');
    s.id = 'ab-cc-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function renderBanner() {
    if (document.querySelector('.ab-cc-banner')) return;
    var b = document.createElement('div');
    b.className = 'ab-cc-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Consenso cookie');
    b.innerHTML = ''
      + '<h3>🍪 Cookie & privacy</h3>'
      + '<p>Usiamo cookie tecnici e, con il tuo consenso, cookie di profilazione (Google AdSense, Meta) per personalizzare gli annunci e misurare le prestazioni. Puoi accettare, rifiutare o personalizzare.</p>'
      + '<p style="font-size:12px;margin-bottom:14px"><a href="' + CFG.policyUrl + '">Cookie policy</a> · <a href="' + CFG.privacyUrl + '">Privacy</a></p>'
      + '<div class="ab-cc-actions">'
      +   '<button class="ab-cc-btn secondary" data-action="reject">Rifiuta tutti</button>'
      +   '<button class="ab-cc-btn primary" data-action="accept">Accetta tutti</button>'
      +   '<button class="ab-cc-btn text full" data-action="customize">Personalizza preferenze</button>'
      + '</div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('show'); });

    b.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-action');
      if (act === 'accept') chooseAll(true);
      else if (act === 'reject') chooseAll(false);
      else if (act === 'customize') openModal();
    });
  }

  function openModal() {
    if (document.querySelector('.ab-cc-modal')) return;
    var existing = loadConsent() || {};

    var overlay = document.createElement('div');
    overlay.className = 'ab-cc-overlay';
    document.body.appendChild(overlay);

    var m = document.createElement('div');
    m.className = 'ab-cc-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', 'Preferenze cookie');

    var cats = CFG.categories.map(function (c) {
      var on = c.required || !!existing[c.id];
      return ''
        + '<div class="ab-cc-cat">'
        +   '<div class="ab-cc-cat-head">'
        +     '<div>'
        +       '<h4>' + c.label + '</h4>'
        +       '<div class="ab-cc-cat-desc">' + c.desc + '</div>'
        +     '</div>'
        +     '<label class="ab-cc-tog ' + (on ? 'on' : '') + (c.required ? ' disabled' : '') + '" data-cat="' + c.id + '">'
        +       '<input type="checkbox" ' + (on ? 'checked' : '') + ' ' + (c.required ? 'disabled' : '') + '>'
        +     '</label>'
        +   '</div>'
        + '</div>';
    }).join('');

    m.innerHTML = ''
      + '<div class="ab-cc-modal-head">'
      +   '<h2>Preferenze cookie</h2>'
      +   '<p>Scegli quali categorie di cookie consentire. Puoi cambiare idea in qualsiasi momento dal pulsante in basso a sinistra.</p>'
      +   '<button class="close" aria-label="Chiudi">×</button>'
      + '</div>'
      + '<div class="ab-cc-modal-body">' + cats + '</div>'
      + '<div class="ab-cc-modal-foot">'
      +   '<button class="ab-cc-btn secondary" data-action="reject">Rifiuta tutti</button>'
      +   '<button class="ab-cc-btn secondary" data-action="save">Salva scelte</button>'
      +   '<button class="ab-cc-btn primary" data-action="accept">Accetta tutti</button>'
      + '</div>';
    document.body.appendChild(m);

    requestAnimationFrame(function () {
      overlay.classList.add('show');
      m.classList.add('show');
    });

    // Toggle handlers
    m.querySelectorAll('.ab-cc-tog').forEach(function (t) {
      var input = t.querySelector('input');
      if (input.disabled) return;
      t.addEventListener('click', function (e) {
        if (e.target !== input) {
          input.checked = !input.checked;
        }
        t.classList.toggle('on', input.checked);
      });
    });

    function closeModal() {
      overlay.classList.remove('show');
      m.classList.remove('show');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (m.parentNode) m.parentNode.removeChild(m);
      }, 300);
    }

    m.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-action');
      if (e.target.classList && e.target.classList.contains('close')) { closeModal(); return; }
      if (act === 'save') {
        var consent = { necessary: true };
        m.querySelectorAll('.ab-cc-tog').forEach(function (t) {
          var input = t.querySelector('input');
          consent[t.getAttribute('data-cat')] = !!input.checked;
        });
        saveConsent(consent);
        applyConsent(consent);
        closeModal();
        dismissBanner();
        showFab();
      } else if (act === 'accept') {
        chooseAll(true); closeModal();
      } else if (act === 'reject') {
        chooseAll(false); closeModal();
      }
    });
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', esc); } });
  }

  function chooseAll(grant) {
    var consent = { necessary: true };
    CFG.categories.forEach(function (c) { if (!c.required) consent[c.id] = !!grant; });
    saveConsent(consent);
    applyConsent(consent);
    dismissBanner();
    showFab();
  }

  function dismissBanner() {
    var b = document.querySelector('.ab-cc-banner');
    if (!b) return;
    b.classList.remove('show');
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 400);
  }

  function showFab() {
    if (document.querySelector('.ab-cc-fab')) return;
    var f = document.createElement('button');
    f.className = 'ab-cc-fab';
    f.setAttribute('aria-label', 'Preferenze cookie');
    f.title = 'Preferenze cookie';
    f.innerHTML = '🍪';
    f.addEventListener('click', openModal);
    document.body.appendChild(f);
  }

  // ===== API PUBBLICA =====
  window.openCookieSettings = openModal;
  window.getCookieConsent = loadConsent;

  // ===== INIT =====
  function init() {
    injectStyles();
    var existing = loadConsent();
    if (existing) {
      applyConsent(existing);
      showFab();
    } else {
      renderBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
