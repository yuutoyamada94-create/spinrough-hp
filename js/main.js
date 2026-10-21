(() => {
  // ?noanim は確認用(動きを止めて見る)。公開前に外す
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]noanim/.test(location.search);
  const hasGsap = Boolean(window.gsap);
  const intro = document.querySelector(".intro");
  const introLogo = document.querySelector(".intro img");
  const header = document.querySelector(".site-header");
  const pvPlayer = document.querySelector("[data-pv-player]");
  const pvVideo = document.querySelector("[data-pv-video]");
  const pvProgress = document.querySelector(".pv-progress span");
  const pvToggleButton = document.querySelector("[data-pv-toggle]");
  const pvReplayButton = document.querySelector("[data-pv-replay]");
  const pvEnd = document.querySelector("[data-pv-end]");
  const pvEndReplayButton = document.querySelector("[data-pv-replay-end]");
  const caseIndexItems = Array.from(document.querySelectorAll("[data-case-index]"));
  const legacyDemoPlayer = document.querySelector("[data-demo-player]");
  const legacyDemoSteps = Array.from(document.querySelectorAll(".demo-step"));
  const legacyProgressItems = Array.from(document.querySelectorAll(".demo-progress span"));
  const legacyCaption = document.querySelector(".demo-caption");
  const legacyToggleButton = document.querySelector("[data-demo-toggle]");
  const legacyReplayButton = document.querySelector("[data-demo-replay]");
  const featureBlocks = Array.from(document.querySelectorAll("[data-feature]"));
  const featureLinks = Array.from(document.querySelectorAll("[data-feature-link]"));
  const voiceBars = Array.from(document.querySelectorAll(".voice-line i, .mini-wave i"));
  const contactForms = Array.from(document.querySelectorAll("[data-contact-form]"));
  const revealTargets = Array.from(document.querySelectorAll(".paper-still, .demo-window, .pv-window, .message-photo, .about-mark, .logo-band, .photo-window, .day-card figure"));
  const heroRotators = Array.from(document.querySelectorAll("[data-hero-rotator]"));
  const PV_HAS_SOUND = true;
  const PV_FALLBACK_DURATION = 42.4;
  const legacyCaptions = [
    "01 運行を話す/打つ",
    "02 入った項目を確かめる",
    "03 運搬伝票(納品書)ができる",
    "04 今月の運行台帳に貯まる",
    "05 元請ごとの請求書が並ぶ",
    "06 ボタン1つで一斉送信",
    "送信済み"
  ];

  let pvFrameId = 0;
  let pvHasStarted = false;
  let legacyStep = 0;
  let legacyTimerId = 0;
  let legacyIsPlaying = false;
  let legacyHasStarted = false;

  document.documentElement.classList.toggle("is-reduced-motion", reduceMotion);

  function finishIntro() {
    if (intro) intro.style.display = "none";
    header?.classList.add("is-ready");
  }

  function runIntro() {
    if (document.querySelector(".gate")) return;
    if (!intro || !introLogo || !hasGsap || reduceMotion) {
      finishIntro();
      return;
    }

    gsap.set(introLogo, { autoAlpha: 0, scale: 0.96 });
    gsap.set(header, { autoAlpha: 0 });
    gsap
      .timeline({ defaults: { ease: "power3.inOut" } })
      .to(introLogo, { autoAlpha: 1, scale: 1, duration: 2 })
      .to(introLogo, { autoAlpha: 0, scale: 1.02, duration: 2, delay: 0.45 })
      .to(intro, { autoAlpha: 0, duration: 1.3 }, "-=1.2")
      .to(header, { autoAlpha: 1, duration: 1.7 }, "-=0.8")
      .set(intro, { display: "none" })
      .add(() => header?.classList.add("is-ready"));
  }

  function setupHeaderTheme() {
    const darkSection = document.querySelector(".service-section");
    if (!header || !darkSection || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle("is-on-dark", entry.isIntersecting);
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 }
    );
    observer.observe(darkSection);
  }

  function setupReveals() {
    if (revealTargets.length === 0) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-revealed"));
      return;
    }

    document.body.classList.add("can-reveal");
    // 見えたかの通知(IntersectionObserver)は描画が抑えられた環境で止まることがあるため、
    // スクロール位置で同期的に判定する(80ms間引き)
    let last = 0;
    const check = () => {
      const vh = window.innerHeight;
      revealTargets.forEach((target) => {
        if (target.classList.contains("is-revealed")) return;
        const r = target.getBoundingClientRect();
        if (r.top < vh * 0.85 && r.bottom > 0) target.classList.add("is-revealed");
      });
    };
    const onScroll = () => {
      const now = Date.now();
      if (now - last < 80) return;
      last = now;
      check();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", check);
    check();
  }

  function setupServiceInvert() {
    const serviceSection = document.querySelector(".service-section");
    // SERVICEは常時黒背景にする。スクロール中の中間色でヘッダーが沈むのを避ける。
    if (!serviceSection) return;
  }

  function setupHeroRotators() {
    if (heroRotators.length === 0 || reduceMotion) return;

    heroRotators.forEach((rotator) => {
      const frames = Array.from(rotator.querySelectorAll("img"));
      if (frames.length < 2) return;
      const delay = Number(rotator.dataset.delay || 0);
      let index = 0;
      window.setTimeout(() => {
        window.setInterval(() => {
          frames[index].classList.remove("is-active");
          index = (index + 1) % frames.length;
          frames[index].classList.add("is-active");
        }, 4000);
      }, delay);
    });
  }

  function setupOneDay() {
    const section = document.querySelector(".one-day");
    const pin = document.querySelector("[data-one-day]");
    const track = document.querySelector(".one-day-track");
    const cards = Array.from(document.querySelectorAll(".day-card"));
    let focusFrame = 0;
    const setFocusedCard = () => {
      if (cards.length === 0) return;
      const baseRect = (window.matchMedia("(min-width: 921px)").matches ? pin : track).getBoundingClientRect();
      const center = baseRect.left + baseRect.width / 2;
      let current = cards[0];
      let closest = Infinity;
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const distanceToCenter = Math.abs(rect.left + rect.width / 2 - center);
        if (distanceToCenter < closest) {
          closest = distanceToCenter;
          current = card;
        }
      });
      cards.forEach((card) => card.classList.toggle("is-focused", card === current));
    };
    const requestFocusUpdate = () => {
      window.cancelAnimationFrame(focusFrame);
      focusFrame = window.requestAnimationFrame(setFocusedCard);
    };

    if (section && pin && track && cards.length > 0 && !reduceMotion) {
      section.classList.add("is-focus-ready");
      setFocusedCard();
      track.addEventListener("scroll", requestFocusUpdate, { passive: true });
      window.addEventListener("resize", requestFocusUpdate);
    }

    if (!section || !pin || !track || reduceMotion || !hasGsap || !window.ScrollTrigger) return;
    if (!window.matchMedia("(min-width: 921px)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const distance = () => {
      const pagePad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--page-pad")) || 0;
      return Math.max(0, track.scrollWidth - pin.clientWidth + pagePad);
    };
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        pin: true,
        scrub: 0.7,
        start: "top top",
        end: () => `+=${distance() + window.innerHeight * 0.45}`,
        invalidateOnRefresh: true,
        onUpdate: requestFocusUpdate,
        onRefresh: requestFocusUpdate
      }
    });
  }

  function setCaseIndex(activeStep) {
    caseIndexItems.forEach((item) => {
      item.classList.toggle("is-active", item.dataset.caseIndex === String(activeStep));
    });
  }

  // PV v8(2026-10-09)の幕に合わせる:話すだけ〜実演(7.1〜19.4秒)/一発で・整う(19.4〜26.5秒)/月末の夜〜届く。(26.5〜33.5秒)
  function getPvActiveStep(time) {
    if (time >= 7.1 && time < 19.4) return 1;
    if (time >= 19.4 && time < 26.5) return 2;
    if (time >= 26.5 && time < 33.5) return 3;
    return 0;
  }

  function updatePvProgress() {
    if (!pvVideo) return;
    const duration = Number.isFinite(pvVideo.duration) && pvVideo.duration > 0 ? pvVideo.duration : PV_FALLBACK_DURATION;
    const progress = Math.max(0, Math.min(1, pvVideo.currentTime / duration));
    if (pvProgress) pvProgress.style.transform = `scaleX(${progress})`;
    setCaseIndex(getPvActiveStep(pvVideo.currentTime));
  }

  function renderPv() {
    updatePvProgress();
    if (pvVideo && !pvVideo.paused && !pvVideo.ended) {
      pvFrameId = window.requestAnimationFrame(renderPv);
    }
  }

  function playPv() {
    if (!pvVideo || !pvVideo.paused) return;
    if (pvVideo.ended) pvVideo.currentTime = 0;
    if (pvToggleButton) pvToggleButton.textContent = "一時停止";
    window.cancelAnimationFrame(pvFrameId);
    pvVideo.play().then(() => {
      pvFrameId = window.requestAnimationFrame(renderPv);
    }).catch(() => {
      if (pvToggleButton) pvToggleButton.textContent = "再生";
      // 自動再生が止められた時(画面が裏にある等)は、次にスクロールや表示が戻った時にもう一度試す
      pvHasStarted = false;
    });
  }

  function pausePv() {
    if (!pvVideo) return;
    pvVideo.pause();
    window.cancelAnimationFrame(pvFrameId);
    if (pvToggleButton) pvToggleButton.textContent = "再生";
    updatePvProgress();
  }

  function replayPv() {
    if (!pvVideo) return;
    pvVideo.currentTime = 0;
    if (pvProgress) pvProgress.style.transform = "scaleX(0)";
    setCaseIndex(0);
    playPv();
  }

  function startPvOnce() {
    if (pvHasStarted) return;
    pvHasStarted = true;
    replayPv();
  }

  function setupPv() {
    if (!pvVideo) return;
    pvVideo.muted = true;
    if (pvToggleButton) pvToggleButton.textContent = "再生";
    updatePvProgress();

    pvToggleButton?.addEventListener("click", () => {
      if (!pvVideo.paused) {
        pausePv();
      } else {
        playPv();
      }
    });

    pvReplayButton?.addEventListener("click", replayPv);
    pvVideo.addEventListener("loadedmetadata", updatePvProgress);
    pvVideo.addEventListener("timeupdate", updatePvProgress);
    pvVideo.addEventListener("pause", () => {
      window.cancelAnimationFrame(pvFrameId);
      if (pvToggleButton) pvToggleButton.textContent = "再生";
      updatePvProgress();
    });
    pvVideo.addEventListener("ended", () => {
      window.cancelAnimationFrame(pvFrameId);
      if (pvToggleButton) pvToggleButton.textContent = "再生";
      updatePvProgress();
      // 見終わったら、そのまま実物のデモへ進めるようにする
      if (pvEnd) pvEnd.hidden = false;
    });
    pvVideo.addEventListener("play", () => {
      if (pvEnd) pvEnd.hidden = true;
    });
    pvEndReplayButton?.addEventListener("click", replayPv);

    if (PV_HAS_SOUND && pvToggleButton?.parentElement) {
      const soundButton = document.createElement("button");
      soundButton.type = "button";
      soundButton.textContent = "音を出す";
      soundButton.addEventListener("click", () => {
        pvVideo.muted = !pvVideo.muted;
        soundButton.textContent = pvVideo.muted ? "音を出す" : "音を消す";
      });
      pvToggleButton.parentElement.insertBefore(soundButton, pvReplayButton || null);
    }

    if (reduceMotion) {
      return;
    }

    const checkStart = () => {
      if (!pvPlayer || pvHasStarted) return;
      const rect = pvPlayer.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.16) startPvOnce();
    };

    window.addEventListener("scroll", checkStart, { passive: true });
    window.addEventListener("resize", checkStart);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkStart();
    });
    checkStart();
  }

  function showLegacyStep(index) {
    if (legacyDemoSteps.length === 0) return;
    legacyStep = (index + legacyDemoSteps.length) % legacyDemoSteps.length;
    legacyDemoSteps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === legacyStep);
    });
    legacyProgressItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex <= legacyStep);
    });
    if (legacyCaption) legacyCaption.textContent = legacyCaptions[legacyStep] || "";
  }

  function scheduleLegacyDemo() {
    window.clearTimeout(legacyTimerId);
    if (!legacyIsPlaying || reduceMotion || legacyDemoSteps.length === 0) return;
    legacyTimerId = window.setTimeout(() => {
      showLegacyStep(legacyStep + 1);
      scheduleLegacyDemo();
    }, 1800);
  }

  function playLegacyDemo() {
    if (reduceMotion || legacyDemoSteps.length === 0) return;
    legacyIsPlaying = true;
    if (legacyToggleButton) legacyToggleButton.textContent = "一時停止";
    scheduleLegacyDemo();
  }

  function pauseLegacyDemo() {
    legacyIsPlaying = false;
    window.clearTimeout(legacyTimerId);
    if (legacyToggleButton) legacyToggleButton.textContent = "再生";
  }

  function startLegacyDemoOnce() {
    if (legacyHasStarted) return;
    legacyHasStarted = true;
    showLegacyStep(0);
    playLegacyDemo();
  }

  function setupLegacyDemo() {
    if (legacyDemoSteps.length === 0) return;
    showLegacyStep(reduceMotion ? Math.min(2, legacyDemoSteps.length - 1) : 0);

    legacyToggleButton?.addEventListener("click", () => {
      if (legacyIsPlaying) {
        pauseLegacyDemo();
      } else {
        playLegacyDemo();
      }
    });

    legacyReplayButton?.addEventListener("click", () => {
      showLegacyStep(0);
      playLegacyDemo();
    });

    if (reduceMotion) return;

    const checkStart = () => {
      if (!legacyDemoPlayer || legacyHasStarted) return;
      const rect = legacyDemoPlayer.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.16) startLegacyDemoOnce();
    };
    window.addEventListener("scroll", checkStart, { passive: true });
    window.addEventListener("resize", checkStart);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkStart();
    });
    checkStart();
  }

  function setupFeatureIndex() {
    if (featureBlocks.length === 0 || featureLinks.length === 0 || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = visible.target.dataset.feature;
        featureLinks.forEach((link) => {
          link.classList.toggle("is-active", link.dataset.featureLink === index);
        });
      },
      { threshold: [0.35, 0.55, 0.75] }
    );

    featureBlocks.forEach((block) => observer.observe(block));
  }

  function setupMotion() {
    if (reduceMotion || !hasGsap || voiceBars.length === 0) return;
    gsap.to(voiceBars, {
      scaleY: () => gsap.utils.random(1.1, 3.4),
      duration: 0.72,
      repeat: -1,
      yoyo: true,
      stagger: 0.07,
      ease: "power3.inOut"
    });
  }

  function setupContactForms() {
    contactForms.forEach((form) => {
      const methods = Array.from(form.querySelectorAll("[data-contact-method]"));
      if (methods.length === 0) return;

      function validateContactMethod() {
        const hasContact = methods.some((input) => input.value.trim() !== "");
        methods.forEach((input) => {
          input.setCustomValidity(hasContact ? "" : "電話番号かメールアドレスのどちらかを入力してください。");
        });
      }

      methods.forEach((input) => input.addEventListener("input", validateContactMethod));
      form.addEventListener("submit", validateContactMethod);
      validateContactMethod();
    });
  }

  runIntro();
  setupHeroRotators();
  setupHeaderTheme();
  setupReveals();
  setupServiceInvert();
  setupOneDay();
  setupPv();
  setupLegacyDemo();
  setupFeatureIndex();
  setupMotion();
  setupContactForms();
})();
