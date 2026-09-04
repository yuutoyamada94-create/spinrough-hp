// spin rough — 共通スクリプト
// 1) モバイルメニューの開閉
// 2) スクロールに応じた控えめなフェードイン(.reveal)

(function () {
  "use strict";

  // JSが動作している印。CSS側はhtml.jsが付いた時だけ要素を初期非表示にする
  // (JSが読めない環境では全コンテンツがそのまま表示される)
  document.documentElement.classList.add("js");

  // 最終保険:アニメーションが動かない環境(バックグラウンド描画停止等)でも
  // 4秒後には必ず全コンテンツを表示状態にする
  window.setTimeout(function () {
    document.documentElement.classList.add("motion-done");
  }, 4000);

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- スクロール進捗バー(run-tecトレース) ----
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  var progressTicking = false;
  var updateProgress = function () {
    progressTicking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progress.style.width = (ratio * 100).toFixed(2) + "%";
  };
  window.addEventListener("scroll", function () {
    if (!progressTicking) {
      progressTicking = true;
      window.requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();

  // ---- 初回訪問時スプラッシュ(計1.4s+フェード0.4s。2回目以降はスキップ) ----
  try {
    if (!reducedMotion && !window.sessionStorage.getItem("sr_splash")) {
      window.sessionStorage.setItem("sr_splash", "1");
      var splash = document.createElement("div");
      splash.className = "splash";
      splash.setAttribute("aria-hidden", "true");
      var splashLogo = document.createElement("span");
      splashLogo.className = "splash__logo";
      splashLogo.textContent = "spin rough";
      var splashLine = document.createElement("span");
      splashLine.className = "splash__line";
      splash.appendChild(splashLogo);
      splash.appendChild(splashLine);
      document.body.appendChild(splash);
      window.setTimeout(function () {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 2100);
    }
  } catch (e) {
    /* sessionStorage不可の環境ではスプラッシュを出さない */
  }

  // ---- モバイルメニュー ----
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("global-nav");

  if (toggle && nav) {
    var closeNav = function () {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    };

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        nav.classList.add("is-open");
        document.body.classList.add("nav-open");
      }
    });

    // メニュー内リンクを押したら閉じる(同一ページ内アンカー対策)
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeNav();
      }
    });

    // PC幅に切り替わったら状態をリセット
    window.matchMedia("(min-width: 900px)").addEventListener("change", closeNav);
  }

  // ---- ヒーロー背景動画(Before通勤→After夜明けのクロスフェードループ) ----
  // PC/SPでソースを出し分け、reduced-motion時は再生しない
  var heroVideos = Array.prototype.slice.call(
    document.querySelectorAll(".hero__bg video")
  );
  if (heroVideos.length > 0) {
    var isSp = window.matchMedia("(max-width: 767px)").matches;

    if (reducedMotion) {
      heroVideos.forEach(function (v) { v.removeAttribute("autoplay"); });
    } else {
      heroVideos.forEach(function (v) {
        var src = v.getAttribute(isSp ? "data-src-sp" : "data-src-pc");
        if (src) v.src = src;
      });

      var activeIndex = 0;
      var heroInView = true;
      var playVideo = function (v) {
        v.play().catch(function () {
          /* 自動再生がブロックされた場合はposter表示のまま */
        });
      };
      playVideo(heroVideos[0]);
      heroVideos[0].addEventListener("canplay", function () {
        playVideo(heroVideos[0]);
      }, { once: true });

      // 7秒ごとにクロスフェード切替(opacity 1.2sはCSS側)
      if (heroVideos.length > 1) {
        window.setInterval(function () {
          if (!heroInView) return;
          var prev = heroVideos[activeIndex];
          activeIndex = (activeIndex + 1) % heroVideos.length;
          var next = heroVideos[activeIndex];
          playVideo(next);
          next.classList.add("is-active");
          prev.classList.remove("is-active");
          // フェード完了後に旧動画を止めて負荷を下げる
          window.setTimeout(function () { prev.pause(); }, 1300);
        }, 7000);
      }

      // 画面外にスクロールしたら再生を止めてCPU/GPU負荷を下げる
      var videoTicking = false;
      window.addEventListener("scroll", function () {
        if (videoTicking) return;
        videoTicking = true;
        window.requestAnimationFrame(function () {
          videoTicking = false;
          var bg = heroVideos[0].parentNode;
          var rect = bg.getBoundingClientRect();
          heroInView = rect.bottom > 0 && rect.top < window.innerHeight;
          var active = heroVideos[activeIndex];
          if (heroInView && active.paused) {
            playVideo(active);
          } else if (!heroInView && !active.paused) {
            active.pause();
          }
        });
      }, { passive: true });
    }
  }

  // ---- スクロールフェードイン ----
  // .reveal = 単体 / .stagger = 子要素を時間差で /
  // .rise-group = ヒーローの順次フェード / .wipe = clip-pathワイプ
  // IntersectionObserverは環境により発火しないことがあるため、
  // スクロール座標ベースで判定する(発火は1回のみ)
  var revealTargets = Array.prototype.slice.call(
    document.querySelectorAll(".reveal, .stagger, .rise-group, .wipe")
  );

  if (revealTargets.length > 0) {
    var ticking = false;

    var checkReveal = function () {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      revealTargets = revealTargets.filter(function (el) {
        var rect = el.getBoundingClientRect();
        // run-tec実測に合わせ「要素の15%が見えたら」発火(threshold: 0.15相当)
        var lead = Math.min(rect.height, vh) * 0.15;
        if (rect.top + lead < vh && rect.bottom > 0) {
          el.classList.add("is-visible");
          return false; // 一度発火したら対象から外す
        }
        return true;
      });
      if (revealTargets.length === 0) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(checkReveal);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // 初期表示分(ファーストビュー内の要素)を即時発火
    checkReveal();
  }
})();
