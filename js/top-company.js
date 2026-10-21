// 会社トップ(ラフ):扉が開く → 文字が浮かぶ / 事業の区間で背景を黒へ反転
(() => {
  // 反転:.js-invert が画面中央40%に重なっている間(スクロール座標で同期判定・80ms間引き)
  const targets = Array.from(document.querySelectorAll(".js-invert"));
  const header = document.querySelector(".site-header");
  let last = 0;
  const check = () => {
    const vh = window.innerHeight, top = vh * 0.3, bottom = vh * 0.7;
    const on = targets.some((t) => { const r = t.getBoundingClientRect(); return r.top < bottom && r.bottom > top; });
    document.body.classList.toggle("is-inverted", on);
    header?.classList.toggle("is-on-dark", on);
  };
  let tail = 0;
  window.addEventListener("scroll", () => { clearTimeout(tail); tail = setTimeout(check, 100); const n = Date.now(); if (n - last < 80) return; last = n; check(); }, { passive: true });
  window.addEventListener("resize", check);
  check();
})();
