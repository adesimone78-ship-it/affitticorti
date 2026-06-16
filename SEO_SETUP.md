# SEO & AdSense Setup — Checklist Operativa

Tutti i file SEO core sono pronti al root del sito. **Prima del deploy in produzione**, sostituisci i placeholder seguenti.

---

## 1. `sitemap.xml`
- ✅ Sostituisci `https://affittibrevi.it/` con il tuo dominio reale (se diverso)
- ✅ Aggiungi le URL dei nuovi articoli man mano che li pubblichi
- ✅ Aggiorna `<lastmod>` ad ogni modifica significativa di una pagina
- 📤 **Submit a Google Search Console**: Property → Sitemaps → incolla `sitemap.xml`
- 📤 **Submit a Bing Webmaster Tools**: stesso procedimento

## 2. `robots.txt`
- ✅ Sostituisci `affittibrevi.it` nell'URL della Sitemap finale
- ⚠️ Il file blocca per default i bot AI (GPTBot, ClaudeBot, ecc.). **Rimuovi** quelle righe se vuoi essere indicizzato in risposte AI (può portare traffico ma cede contenuto)
- ✅ Verifica online: https://www.google.com/webmasters/tools/robots-testing-tool

## 3. `ads.txt` ⚠️ CRITICO per AdSense
- ✅ Sostituisci `pub-0000000000000000` con il **tuo Publisher ID AdSense**
  - Lo trovi: AdSense → Account → Informazioni account → ID editore
  - Formato: `pub-1234567890123456` (16 cifre)
- ✅ Il file DEVE essere accessibile a `https://tuodominio.it/ads.txt` (root, no sottocartella)
- ✅ Verifica dopo 24-48h: AdSense → Annunci → Generale → "Idoneità ads.txt"
- ❌ **Senza ads.txt valido**, gli inserzionisti premium non comprano il tuo inventory → -30/-60% RPM

## 4. Token verifica nei meta `<head>`
Tutte e 4 le pagine HTML contengono già i meta tag — devi solo sostituire:

```html
<meta name="google-site-verification" content="REPLACE_WITH_GSC_TOKEN">
<meta name="msvalidate.01"            content="REPLACE_WITH_BING_TOKEN">
```

### Come ottenere i token

**Google Search Console**
1. https://search.google.com/search-console
2. Aggiungi proprietà → Prefisso URL → `https://tuodominio.it/`
3. Metodo "Tag HTML" → copia il valore `content="..."` → incolla nei 4 file
4. Click "Verifica"

**Bing Webmaster Tools**
1. https://www.bing.com/webmasters
2. Add a site → URL → Verify "HTML Meta Tag"
3. Copia il valore `content="..."` → incolla nei 4 file

**Yandex** (opzionale, mercato CIS — utile se hai turisti russofoni)
- Decommenta la riga `<meta name="yandex-verification">` in `index.html` e completala

---

## 5. AdSense — attivazione centralizzata (un solo punto)
La gestione AdSense è **centralizzata in `assets/site.js`**. Non devi più toccare ogni pagina:
gli slot pubblicitari (`<aside class="ads ...">`) vengono riempiti automaticamente in tutte
le pagine che caricano `site.js`.

1. Crea le unità pubblicitarie su **AdSense → Annunci → Per unità pubblicitaria** (una per tipo:
   *above-fold*, *in-article*, *sticky-footer*) e annota i relativi **slot ID**.
2. In cima a `assets/site.js` trova il blocco `window.ADS_CONFIG` e compila:
   ```js
   window.ADS_CONFIG = {
     client: 'ca-pub-XXXXXXXXXXXXXXXX',   // il tuo Publisher ID
     slots: {
       'ads-above-fold':    '0000000001',
       'ads-in-article':    '0000000002',
       'ads-sticky-footer': '0000000003'
     }
   };
   ```
3. Fatto. Il loader `adsbygoogle.js` viene iniettato una sola volta e ogni placeholder riceve
   il suo `<ins class="adsbygoogle">`. **Senza `client` impostato, i box restano inerti**
   (nessuna richiesta, nessun layout shift) — utile in sviluppo.

**Distribuzione attuale degli slot** (verificata):
| Pagina | above-fold | in-article | sticky | Totale |
|---|:--:|:--:|:--:|:--:|
| Home | 1 | – | 1 | 2 |
| Host / Guest / Blog | 1 | 1 | 1 | 3 |
| Articolo CIN (long-form) | 1 | 4 | 1 | 6 |
| Stub / legali / pack-host / 404 | – | – | – | 0 |

> Stub e pagine legali **non hanno annunci** per policy AdSense (contenuto sottile).
> La landing `fb/affitticorti/` ha 2 box ma **non carica `site.js`**: se vuoi attivarli, valuta
> prima che gli annunci su una landing di conversione possono abbassare il tasso di iscrizione.

---

## 6. Meta Pixel Facebook
Tutte le pagine hanno il blocco commentato:
```js
fbq('init', 'PIXEL_ID');
```
1. business.facebook.com → Events Manager → Crea Pixel
2. Sostituisci `PIXEL_ID` con il tuo (15 cifre)
3. Decommenta lo `<script>` Pixel
4. Aggiungi anche la Conversions API server-side per bypassare iOS/AdBlock (richiede endpoint backend)

---

## 7. File aggiuntivi consigliati (Fase successiva)
- `humans.txt` — credits team (SEO neutro, brand-friendly)
- `.well-known/security.txt` — contatto per vulnerability disclosure (RFC 9116)
- `manifest.json` — installabilità PWA + favicon set
- `favicon.ico` / `apple-touch-icon.png` — già richiamati implicitamente dal browser

---

## Validatori utili dopo il deploy
- **Sitemap**: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- **Robots**: https://technicalseo.com/tools/robots-txt/
- **ads.txt**: https://adstxt.guru/
- **Rich Results (JSON-LD)**: https://search.google.com/test/rich-results
- **Mobile-Friendly**: https://search.google.com/test/mobile-friendly
- **PageSpeed**: https://pagespeed.web.dev/
