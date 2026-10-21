// 日本語の改行位置は、公開用に書き出す時に tools/apply_wbr.py が <wbr> で書き込む(ブラウザでは組み替えない。2026-10-21)

// 開いた時・更新した時は、必ずページの一番上から表示する(#付きのリンクで来た時だけ、その位置へ)。
(() => {
  try { history.scrollRestoration = 'manual'; } catch (_) {}
  if (location.hash) return;
  // 本人がまだ触っていない間だけ、一番上に戻す。触った後は一切動かさない(読み込みの完了で読んでいる途中から引き戻さない)。
  let guard = true;
  const release = () => { guard = false; };
  ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown', 'mousedown'].forEach((ev) => window.addEventListener(ev, release, { once: true, passive: true, capture: true }));
  setTimeout(release, 3000);
  const toTop = () => { if (guard && window.scrollY > 0) window.scrollTo(0, 0); };
  toTop();
  window.addEventListener('load', toTop);
  window.addEventListener('pageshow', (e) => { if (e.persisted) toTop(); });
  window.addEventListener('scroll', toTop, { passive: true });
})();

// 共通メニューと検討表示。DOMは通常表示を初期値にする。
(() => {
  const query = new URLSearchParams(location.search);
  document.documentElement.classList.toggle('show-memo', query.has('memo'));
  document.documentElement.classList.toggle('is-reduced-motion', query.has('noanim') || matchMedia('(prefers-reduced-motion: reduce)').matches);
  const btn = document.querySelector('.gh-burger');
  const menu = document.getElementById('gh-menu');
  if (!btn || !menu) return;
  let open = false;
  let saved = [];
  const restore = () => { saved.forEach(([el, value]) => { el.inert = value; }); saved = []; };
  const set = (value, returnFocus = true) => {
    if (open === value) return;
    open = value;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    if (open) {
      const header = btn.closest('header');
      const background = [...document.body.children].filter((el) => el !== header && el !== menu && !['SCRIPT','STYLE'].includes(el.tagName));
      background.push(...[...header.children].filter((el) => el !== btn));
      saved = background.map((el) => [el, el.inert]);
      background.forEach((el) => { el.inert = true; });
      menu.querySelector('a')?.focus();
    } else {
      restore();
      if (returnFocus) btn.focus();
    }
  };
  btn.addEventListener('click', () => set(!open));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); set(false); }
    if (e.key === 'Tab') {
      const stops = [btn, ...menu.querySelectorAll('a[href],button:not([disabled])')];
      const index = stops.indexOf(document.activeElement);
      if (e.shiftKey && index <= 0) { e.preventDefault(); stops.at(-1).focus(); }
      else if (!e.shiftKey && index === stops.length - 1) { e.preventDefault(); btn.focus(); }
    }
  });
  const desktop = matchMedia('(min-width: 1024px)');
  desktop.addEventListener('change', () => {
    if (!desktop.matches) return;
    const wasInside = menu.contains(document.activeElement) || document.activeElement === btn;
    set(false, false);
    if (wasInside) document.querySelector('.gh-logo')?.focus();
  });
})();
