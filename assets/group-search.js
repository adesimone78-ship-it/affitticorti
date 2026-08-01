/* ============================================================
   AffittiCorti.it — Ricerca casa nel gruppo Facebook (lato Guest)
   L'utente inserisce pochi parametri, il sistema compone una
   query di ricerca e apre la ricerca DENTRO il gruppo Facebook:
   https://www.facebook.com/groups/<id>/search/?q=<query>
   Facebook mostra i post del gruppo che corrispondono.
   (La ricerca avviene su Facebook: login + accesso al gruppo
   sono gestiti nativamente da Meta.)
   ============================================================ */
(function(){
  'use strict';

  var root = document.getElementById('gs');
  if (!root) return;

  var groupUrl = (window.FB_CONFIG && window.FB_CONFIG.groupUrl)
    || 'https://www.facebook.com/groups/202432716476431/';

  // Estrae l'ID gruppo (numerico o slug) dall'URL
  function groupId(){
    var m = groupUrl.match(/groups\/([^\/?#]+)/);
    return m ? m[1] : '';
  }

  var $ = function(id){ return document.getElementById(id); };

  var TIPI = {
    '':'',
    monolocale:'monolocale', bilocale:'bilocale', trilocale:'trilocale',
    villa:'villa', stanza:'stanza'
  };

  // Costruisce la stringa di ricerca dai campi
  function buildQuery(){
    var zona   = ($('gs-zona').value || '').trim();
    var tipo   = TIPI[$('gs-tipo').value] || '';
    var periodo= ($('gs-periodo').value || '').trim();
    var parole = ($('gs-parole').value || '').trim();

    var parts = [];
    if (zona)    parts.push(zona);
    if (tipo)    parts.push(tipo);
    if (periodo) parts.push(periodo);
    if (parole)  parts.push(parole);

    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function searchUrl(q){
    var id = groupId();
    if (!id) return groupUrl;
    return 'https://www.facebook.com/groups/' + id + '/search/?q=' + encodeURIComponent(q);
  }

  // Suggerimenti rapidi (chip) che riempiono "parole chiave".
  // Gestisce anche valori multi-parola (es. "vista mare").
  function hasToken(text, value){
    return (' ' + text.trim() + ' ').indexOf(' ' + value + ' ') !== -1;
  }
  function applyChip(value){
    var cur = ($('gs-parole').value || '').trim();
    if (hasToken(cur, value)){
      cur = (' ' + cur + ' ').replace(' ' + value + ' ', ' ').trim();
    } else {
      cur = (cur ? cur + ' ' : '') + value;
    }
    $('gs-parole').value = cur.replace(/\s+/g, ' ').trim();
    update();
  }

  function update(){
    var q = buildQuery();
    $('gs-preview').textContent = q || '— inserisci almeno una zona o una parola —';
    var has = q.length > 0;
    $('gs-go').disabled = !has;
    $('gs-go').setAttribute('aria-disabled', String(!has));
    // sync chip visivi (match a frase intera)
    var cur = ($('gs-parole').value || '');
    root.querySelectorAll('.gs-chip').forEach(function(c){
      c.classList.toggle('on', hasToken(cur, c.getAttribute('data-v')));
    });
    return { q: q, valid: has };
  }

  // Eventi
  root.addEventListener('input', update);
  root.addEventListener('change', update);

  root.querySelectorAll('.gs-chip').forEach(function(c){
    c.addEventListener('click', function(){ applyChip(c.getAttribute('data-v')); });
  });

  root.addEventListener('submit', function(e){
    e.preventDefault();
    var r = update();
    if (!r.valid) return;
    if (window.abTrack) window.abTrack('Search', { search_string: r.q });
    window.open(searchUrl(r.q), '_blank', 'noopener');
  });

  update();
})();
