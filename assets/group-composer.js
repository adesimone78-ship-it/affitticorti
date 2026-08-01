/* ============================================================
   AffittiCorti.it — Compositore "Annuncio per il gruppo"
   Flusso conforme: l'host compone qui, il sistema verifica le
   REGOLE del gruppo, poi (solo se il post è valido) copia il
   testo e apre il gruppo Facebook. La pubblicazione avviene
   manualmente su Facebook (incolla + pubblica): la Groups API
   di Meta non consente più la pubblicazione automatica.
   ============================================================ */
(function(){
  'use strict';

  // === REGOLE DEL GRUPPO (modifica qui) ======================
  // Specchio delle regole di auto-moderazione impostate sul gruppo.
  // I controlli 1-4 sono automatici sul testo. I controlli "ricondivisione
  // esterna" e "foto profilo" non sono verificabili da un sito esterno e
  // sono richiesti come conferma esplicita (Facebook li applica nativamente).
  var GROUP_RULES = window.GROUP_RULES = Object.assign({
    minChars: 10,                       // 5) meno di 10 caratteri → rifiuta
    blockAnyLink: true,                 // 2) qualsiasi link → rifiuta
    blockedDomains: [                   // 3) link a siti specifici → rifiuta
      'airbnb', 'booking.com', 'vrbo', 'subito.it', 'idealista',
      'immobiliare.it', 'bit.ly', 't.me', 'wa.me', 'telegram'
    ],
    blockedKeywords: [                  // 1) parole chiave vietate → rifiuta
      'truffa', 'soldi facili', 'guadagno garantito', 'clicca qui',
      'bitcoin', 'crypto', 'investimento', 'prestito', 'casino',
      'scommesse', 'spam'
    ]
  }, window.GROUP_RULES || {});

  var root = document.getElementById('gc');
  if (!root) return;

  var groupUrl = (window.FB_CONFIG && window.FB_CONFIG.groupUrl)
    || 'https://www.facebook.com/groups/202432716476431/';

  // === Helpers ===============================================
  var $ = function(id){ return document.getElementById(id); };
  var LINK_RE = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|it|net|org|io|co|info|biz|eu|me|app|link|shop|site|online)\b/i;

  var TIPI = {
    monolocale:'Monolocale', bilocale:'Bilocale', trilocale:'Trilocale',
    quadri:'Appartamento 4+ locali', villa:'Villa / Casa indipendente',
    stanza:'Stanza privata'
  };

  // === Costruisce il testo del post ==========================
  function buildPost(){
    var nome   = ($('gc-nome').value || '').trim();
    var zona   = ($('gc-zona').value || '').trim();
    var tipo   = TIPI[$('gc-tipo').value] || 'Alloggio';
    var letti  = ($('gc-letti').value || '').trim();
    var periodo= ($('gc-periodo').value || '').trim();
    var prezzo = ($('gc-prezzo').value || '').trim();
    var desc   = ($('gc-desc').value || '').trim();
    var contatto = $('gc-contatto').value;

    var serv = Array.prototype.map.call(
      document.querySelectorAll('input[name="gc-serv"]:checked'),
      function(c){ return c.value; }
    );

    var lines = [];
    lines.push('🏠 ' + tipo + (zona ? ' a ' + zona : ''));
    lines.push('');
    if (periodo) lines.push('📅 Disponibilità: ' + periodo);
    if (letti)   lines.push('🛏️ Posti letto: ' + letti);
    if (serv.length) lines.push('✨ Servizi: ' + serv.join(' · '));
    if (prezzo)  lines.push('💶 ' + prezzo + ' €/notte');
    if (periodo || letti || serv.length || prezzo) lines.push('');
    if (desc) { lines.push(desc); lines.push(''); }

    var contattoTxt = {
      privato:  '👉 Scrivetemi in privato per info e disponibilità.',
      commenti: '👉 Info e domande nei commenti qui sotto.',
      messenger:'👉 Contattatemi via Messenger del gruppo.'
    }[contatto] || '';
    if (contattoTxt) lines.push(contattoTxt);

    var tags = ['#affitticorti', '#affittibrevi'];
    if (zona) tags.push('#' + zona.toLowerCase().replace(/[^a-z0-9]+/g,''));
    lines.push(tags.join(' '));

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // === Validazione contro le REGOLE ==========================
  function validate(text){
    var lower = text.toLowerCase();
    var checks = [];

    // 5) lunghezza minima (sul testo significativo: descrizione)
    var descLen = ($('gc-desc').value || '').trim().length;
    checks.push({
      key:'len',
      ok: descLen >= GROUP_RULES.minChars,
      label:'Almeno ' + GROUP_RULES.minChars + ' caratteri di descrizione',
      fail:'Scrivi una descrizione di almeno ' + GROUP_RULES.minChars + ' caratteri'
    });

    // 2) nessun link
    var hasLink = GROUP_RULES.blockAnyLink && LINK_RE.test(text);
    checks.push({
      key:'link',
      ok: !hasLink,
      label:'Nessun link (vietati dal gruppo)',
      fail:'Rimuovi i link: nel gruppo non sono ammessi'
    });

    // 3) nessun dominio/sito vietato
    var badDomain = GROUP_RULES.blockedDomains.filter(function(d){
      return lower.indexOf(d.toLowerCase()) !== -1;
    });
    checks.push({
      key:'domain',
      ok: badDomain.length === 0,
      label:'Nessun riferimento a siti esterni vietati',
      fail:'Riferimento non ammesso: ' + badDomain.join(', ')
    });

    // 1) nessuna parola chiave vietata
    var badKw = GROUP_RULES.blockedKeywords.filter(function(k){
      return lower.indexOf(k.toLowerCase()) !== -1;
    });
    checks.push({
      key:'kw',
      ok: badKw.length === 0,
      label:'Nessuna parola vietata',
      fail:'Parola non ammessa: ' + badKw.join(', ')
    });

    // 4 + 6) confermati manualmente (Facebook li applica nativamente)
    checks.push({
      key:'ack-reshare',
      ok: $('gc-ack-reshare').checked,
      label:'Non sto ricondividendo contenuti esterni al gruppo',
      fail:'Conferma di non ricondividere contenuti esterni'
    });
    checks.push({
      key:'ack-photo',
      ok: $('gc-ack-photo').checked,
      label:'Il mio profilo Facebook ha una foto',
      fail:'Facebook rifiuta i post di profili senza foto'
    });

    return checks;
  }

  // === Render ================================================
  var toastTimer;
  function showToast(msg, isErr){
    var t = $('gc-toast');
    t.textContent = msg;
    t.className = 'gc-toast show' + (isErr ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.className = 'gc-toast'; }, 4000);
  }

  function update(){
    var text = buildPost();

    // anteprima
    $('gc-prev-name').textContent = ($('gc-nome').value || '').trim() || 'Il tuo nome';
    $('gc-prev-text').textContent = text;

    // regole
    var checks = validate(text);
    var listEl = $('gc-rules');
    listEl.innerHTML = '';
    var allOk = true;
    checks.forEach(function(c){
      if (!c.ok) allOk = false;
      var li = document.createElement('li');
      li.className = c.ok ? 'ok' : 'no';
      li.innerHTML = '<span class="ic" aria-hidden="true">' + (c.ok ? '✓' : '✕') + '</span>' +
                     '<span>' + (c.ok ? c.label : c.fail) + '</span>';
      listEl.appendChild(li);
    });

    $('gc-copy-open').disabled = !allOk;
    $('gc-copy').disabled = !allOk;
    root.dataset.valid = allOk ? '1' : '0';
    return { text: text, valid: allOk };
  }

  // === Copia testo (con fallback) ============================
  function copyText(text){
    if (navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function(resolve, reject){
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch(e){ reject(e); }
    });
  }

  // === Eventi ================================================
  root.addEventListener('input', update);
  root.addEventListener('change', update);

  $('gc-copy').addEventListener('click', function(){
    var r = update();
    if (!r.valid) return;
    copyText(r.text).then(function(){
      showToast('✓ Testo copiato. Incollalo nel gruppo con Ctrl/Cmd+V.');
    }).catch(function(){ showToast('Copia non riuscita: seleziona e copia manualmente.', true); });
  });

  $('gc-copy-open').addEventListener('click', function(){
    var r = update();
    if (!r.valid) return;
    if (window.abTrack) window.abTrack('SubmitApplication', { content_name: 'annuncio_gruppo' });
    copyText(r.text).then(function(){
      showToast('✓ Testo copiato! Si apre il gruppo: incolla con Ctrl/Cmd+V e pubblica.');
      setTimeout(function(){ window.open(groupUrl, '_blank', 'noopener'); }, 700);
    }).catch(function(){
      showToast('Copia non riuscita: copia il testo manualmente, poi apri il gruppo.', true);
      window.open(groupUrl, '_blank', 'noopener');
    });
  });

  update();
})();
