/* html-ppt :: i18n.js — optional multilingual layer for a deck. Zero dependencies.
 *
 * Design: the HTML itself IS the default language. Every translatable node carries
 * data-i18n="<key>"; its inline markup is snapshotted on load and used as the
 * default-language dictionary. Other languages live in JSON files fetched on demand.
 *
 * That ordering matters: a deck stays fully readable when opened straight off the
 * filesystem (file://), where fetch() is blocked by CORS. Only *switching away*
 * from the default language needs a server. Nothing degrades if the fetch fails.
 *
 * Usage:
 *   <body data-i18n-default="zh" data-i18n-src="i18n/{lang}.json">
 *   <h1 data-i18n="cover.h1">默认语言的内容</h1>
 *   <script src="../../assets/i18n.js"></script>
 *
 *   ?lang=vi in the URL selects a language at load.
 *   HPXI18n.setLang('en') switches at runtime; returns a Promise.
 *   Listen for the 'hpx:i18n' event on document to react (e.g. redraw a chart).
 *
 * Values are inserted as HTML, so a translation may carry <br>, <span>, <code>.
 * Only ever author these dictionaries yourself — they are not an untrusted input.
 */
(function () {
  'use strict';

  const DEFAULT_LANG = 'zh';

  const state = {
    lang: DEFAULT_LANG,
    defaultLang: DEFAULT_LANG,
    dict: Object.create(null),   // active language's key -> html
    ready: false
  };

  /* Snapshot of the inline markup = the default language dictionary. */
  const baseline = Object.create(null);
  /* Cache: lang -> dict, so flipping back and forth fetches each file once. */
  const cache = Object.create(null);

  function nodes() {
    return document.querySelectorAll('[data-i18n]');
  }

  function snapshot() {
    nodes().forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key && !(key in baseline)) baseline[key] = el.innerHTML;
    });
    cache[state.defaultLang] = baseline;
  }

  function apply(dict) {
    nodes().forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const val = dict[key];
      /* Fall back to the baseline for any key a translation hasn't covered yet,
       * so a partial dictionary shows source text rather than an empty slide. */
      const html = (typeof val === 'string') ? val : baseline[key];
      if (typeof html === 'string' && el.innerHTML !== html) el.innerHTML = html;
    });
  }

  function srcFor(lang) {
    const tpl = (document.body && document.body.getAttribute('data-i18n-src')) || 'i18n/{lang}.json';
    return tpl.replace('{lang}', lang);
  }

  function announce() {
    document.documentElement.setAttribute('lang', htmlLangFor(state.lang));
    document.documentElement.setAttribute('data-lang', state.lang);
    document.dispatchEvent(new CustomEvent('hpx:i18n', {
      detail: { lang: state.lang, dict: state.dict }
    }));
  }

  /* Map our short codes to real BCP-47 tags. `lang` drives font fallback and
   * line-breaking rules in the browser, so getting it right is not cosmetic:
   * CJK line-breaking differs from Latin, which is half of what this tool exists
   * to let you eyeball. */
  const BCP47 = { zh: 'zh-CN', en: 'en', vi: 'vi', ja: 'ja' };
  function htmlLangFor(lang) { return BCP47[lang] || lang; }

  function setLang(lang) {
    lang = String(lang || state.defaultLang).toLowerCase();

    if (cache[lang]) {
      state.lang = lang;
      state.dict = cache[lang];
      apply(state.dict);
      announce();
      return Promise.resolve(state.dict);
    }

    return fetch(srcFor(lang), { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + srcFor(lang));
        return r.json();
      })
      .then((dict) => {
        cache[lang] = dict;
        state.lang = lang;
        state.dict = dict;
        apply(dict);
        announce();
        return dict;
      })
      .catch((err) => {
        /* Loud in the console, invisible on the slide. A missing translation must
         * never blank out a deck someone is presenting from. */
        console.warn('[hpx-i18n] could not load "' + lang + '", staying on "' +
          state.lang + '":', err.message);
        return state.dict;
      });
  }

  function urlLang() {
    const m = /[?&]lang=([a-z-]+)/i.exec(location.search || '');
    return m ? m[1].toLowerCase() : null;
  }

  function boot() {
    state.defaultLang = (document.body && document.body.getAttribute('data-i18n-default')) || DEFAULT_LANG;
    state.lang = state.defaultLang;
    snapshot();
    state.dict = baseline;
    state.ready = true;

    const wanted = urlLang();
    if (wanted && wanted !== state.defaultLang) setLang(wanted);
    else announce();

    /* The preview site drives language from a parent window over the same
     * postMessage channel runtime.js already uses for theme/slide control.
     *
     * No e.origin check, deliberately: the only authority this grants a sender
     * is "pick one of the deck's own translation files", the deck is a static
     * page with no session or private data, and decks are opened from disk
     * (origin "null") as often as from a server, which an origin allowlist
     * would break. Do add one if you ever put privileged state behind this. */
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'preview-lang' && e.data.lang) setLang(e.data.lang);
    });
  }

  window.HPXI18n = {
    setLang: setLang,
    get lang() { return state.lang; },
    get dict() { return state.dict; },
    get ready() { return state.ready; },
    /* Look up a key in the active language, falling back to the default. */
    t: function (key) {
      const v = state.dict[key];
      return (typeof v === 'string') ? v : baseline[key];
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
