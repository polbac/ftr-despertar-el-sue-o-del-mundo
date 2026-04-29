(() => {
  const soundIndicator = document.querySelector("#sound-indicator");
  const page01Start = document.querySelector("#page01-start");
  const infoTrigger = document.querySelector("#info-trigger");
  const infoOverlay = document.querySelector("#info-overlay");
  const infoClose = document.querySelector("#info-close");
  let soundAudio = null;
  let isPlaying = false;

  const animateScrollTo = (targetY, { durationMs = 900 } = {}) => {
    const startY = window.scrollY || window.pageYOffset || 0;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) return;

    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const nextY = Math.round(startY + delta * easeInOutCubic(t));
      window.scrollTo(0, nextY);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const setSoundUi = (playing) => {
    isPlaying = playing;
    if (!soundIndicator) return;
    soundIndicator.classList.toggle("is-playing", playing);
    soundIndicator.setAttribute("aria-pressed", playing ? "true" : "false");
    soundIndicator.setAttribute("aria-label", playing ? "Sonido: reproduciéndose" : "Sonido: detenido");
  };

  const ensureAudio = () => {
    if (soundAudio) return soundAudio;
    // Nota: el archivo tiene espacios en el nombre; encodeURI los convierte a %20.
    soundAudio = new Audio(encodeURI("./audio muestra komic.mp3"));
    soundAudio.preload = "auto";
    return soundAudio;
  };

  const playAudio = async () => {
    const audio = ensureAudio();
    try {
      await audio.play();
      setSoundUi(true);
    } catch {
      // Si el navegador bloquea autoplay, mantenemos UI en "detenido".
      setSoundUi(false);
    }
  };

  const stopAudio = () => {
    if (!soundAudio) {
      setSoundUi(false);
      return;
    }
    soundAudio.pause();
    setSoundUi(false);
  };

  if (soundIndicator) {
    setSoundUi(false);
    soundIndicator.addEventListener("click", () => {
      if (isPlaying) stopAudio();
      else playAudio();
    });
  }

  if (page01Start) {
    page01Start.addEventListener("click", () => {
      const page01 = document.querySelector("#page-01");
      const page02 = document.querySelector("#page-02");
      const nextScene =
        page02 ||
        page01?.nextElementSibling?.closest?.(".scene") ||
        document.querySelector(".scene:not(#page-01)");

      if (nextScene) {
        const y = Math.max(0, nextScene.getBoundingClientRect().top + (window.scrollY || 0));
        animateScrollTo(y, { durationMs: 950 });
      }

      if (!isPlaying) playAudio();
    });
  }

  const setInfoUi = (open) => {
    if (!infoOverlay) return;
    infoOverlay.hidden = !open;
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.body.style.overflow = open ? "hidden" : "";
    if (infoTrigger) infoTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) infoClose?.focus?.();
    else infoTrigger?.focus?.();
  };

  if (infoTrigger && infoOverlay) {
    infoTrigger.addEventListener("click", () => setInfoUi(true));
    infoClose?.addEventListener("click", () => setInfoUi(false));

    infoOverlay.addEventListener("click", (e) => {
      if (e.target === infoOverlay) setInfoUi(false);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !infoOverlay.hidden) setInfoUi(false);
    });
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const typewriterTargets = Array.from(document.querySelectorAll("[data-typewriter]"));
  if (typewriterTargets.length) {
    const htmlToPlainTextWithNewlines = (html) => {
      const temp = document.createElement("div");
      temp.innerHTML = String(html).replace(/<br\s*\/?>/gi, "\n");
      return temp.textContent || "";
    };

    const buildCharSpans = (text) => {
      const frag = document.createDocumentFragment();
      [...text].forEach((ch) => {
        if (ch === "\n") {
          frag.appendChild(document.createElement("br"));
          return;
        }
        const span = document.createElement("span");
        span.className = "tw-char";
        span.style.opacity = "0";
        span.style.display = "inline-block";
        span.style.willChange = "opacity";
        span.textContent = ch === " " ? "\u00A0" : ch;
        frag.appendChild(span);
      });
      return frag;
    };

    typewriterTargets.forEach((el) => {
      if (!el.dataset.typewriterOriginalHtml) el.dataset.typewriterOriginalHtml = el.innerHTML;
      el.dataset.typewriterDone = "false";
      if (reducedMotion) {
        el.style.opacity = "1";
        el.style.transform = "";
        return;
      }
      const text = htmlToPlainTextWithNewlines(el.dataset.typewriterOriginalHtml)
        .replace(/\r\n?/g, "\n")
        .replace(/\u00A0/g, " ")
        .replace(/[^\S\n]+/g, " ")
        .split("\n")
        .map((line) => line.replace(/ +/g, " ").trim())
        .join("\n")
        .replace(/ +\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .trim();
      el.innerHTML = "";
      el.appendChild(buildCharSpans(text));
      el.style.opacity = "1";
      el.style.transform = "";
    });

    if (!reducedMotion && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.dataset.typewriterDone === "true") {
            obs.unobserve(el);
            return;
          }

          const chars = Array.from(el.querySelectorAll(".tw-char"));
          const stepMs = Number(el.dataset.typewriterStepMs || "26");
          const fadeMs = Number(el.dataset.typewriterFadeMs || "120");
          const maxTotalMs = Number(el.dataset.typewriterMaxMs || "2400");
          const effectiveStep = Math.max(8, Math.min(stepMs, Math.floor(maxTotalMs / Math.max(1, chars.length))));

          chars.forEach((span, idx) => {
            span.style.transition = `opacity ${fadeMs}ms ease`;
            span.style.transitionDelay = `${idx * effectiveStep}ms`;
          });

          requestAnimationFrame(() => {
            chars.forEach((span) => {
              span.style.opacity = "1";
            });
          });

          el.dataset.typewriterDone = "true";
          obs.unobserve(el);
        });
      }, { threshold: 0.35 });

      typewriterTargets.forEach((el) => io.observe(el));
    } else if (!reducedMotion) {
      // Fallback: sin IntersectionObserver, mostramos sin animación.
      typewriterTargets.forEach((el) => {
        const chars = Array.from(el.querySelectorAll(".tw-char"));
        chars.forEach((span) => {
          span.style.transition = "";
          span.style.transitionDelay = "";
          span.style.opacity = "1";
        });
        el.dataset.typewriterDone = "true";
      });
    }
  }

  if (reducedMotion) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const scenes = gsap.utils.toArray(".scene");
  scenes.forEach((scene) => {
    const isPage01 = scene.id === "page-01";
    const text = scene.querySelector(".layer--text");
    const textTarget = isPage01 ? text?.querySelector("img") || text : text;
    const shapes = scene.querySelectorAll(".layer--shape");

    if (textTarget) {
      gsap.set(textTarget, {
        autoAlpha: 0,
        y: isPage01 ? 0 : 36,
        x: isPage01 ? 90 : 0,
      });
    }
    if (shapes.length) {
      gsap.set(shapes, {
        autoAlpha: 0,
        y: isPage01 ? 0 : 30,
        x: isPage01 ? -90 : 0,
        scale: 0.95,
      });
    }

    const sceneTl = gsap.timeline({ paused: true });
    if (shapes.length) {
      sceneTl.to(shapes, {
        autoAlpha: 0.92,
        x: 0,
        y: 0,
        scale: 1,
        stagger: 0.15,
        duration: 1.5,
        ease: "power2.out",
      }, 0);
    }

    if (textTarget) {
      sceneTl.to(textTarget, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 1.1,
        ease: "power2.out",
      }, 0.08);
    }

    ScrollTrigger.create({
      trigger: scene,
      start: "top 80%",
      onEnter: () => sceneTl.restart(),
      onEnterBack: () => sceneTl.restart(),
    });
  });

  // Transicion de color global para reforzar la sensacion de viaje.
  gsap.to("body", {
    backgroundColor: "#090a0d",
    ease: "none",
    scrollTrigger: {
      trigger: "#comic-landing",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });

  const page03Cards = gsap.utils.toArray("#page-03 .page03-card");
  if (page03Cards.length) {
    const page03Tl = gsap.timeline({ paused: true });
    gsap.set(page03Cards, { autoAlpha: 0, y: 20 });
    page03Tl.to(page03Cards, {
      autoAlpha: 1,
      y: 0,
      stagger: 0.12,
      ease: "power2.out",
    });
    ScrollTrigger.create({
      trigger: "#page-03",
      start: "top 80%",
      onEnter: () => page03Tl.restart(),
      onEnterBack: () => page03Tl.restart(),
    });
  }

  const page05Cards = gsap.utils.toArray("#page-05 .page05-card");
  if (page05Cards.length) {
    const page05Tl = gsap.timeline({ paused: true });
    gsap.set(page05Cards, { autoAlpha: 0, y: 20 });
    page05Tl.to(page05Cards, {
      autoAlpha: 1,
      y: 0,
      stagger: 0.12,
      ease: "power2.out",
    });
    ScrollTrigger.create({
      trigger: "#page-05",
      start: "top 80%",
      onEnter: () => page05Tl.restart(),
      onEnterBack: () => page05Tl.restart(),
    });
  }

  // Efecto "ventana": shape mas grande que el contenedor y desplazamiento por scroll
  // (vertical por defecto; data-scroll-axis="x" en el contenedor = eje x).
  const frameWindows = gsap.utils.toArray("[data-scroll-window]");
  frameWindows.forEach((windowEl) => {
    const shape = windowEl.querySelector(".frame-window__shape");
    if (!shape) return;
    const axisX = (windowEl.dataset.scrollAxis || "").toLowerCase() === "x";

    if (axisX) {
      // Escala uniforme (no scaleX solo, que distorsiona el ancho de la imagen).
      gsap.set(shape, {
        scale: 1.2,
        transformOrigin: "center center",
      });
      gsap.fromTo(
        shape,
        { xPercent: -8, scale: 1.2 },
        {
          xPercent: 0,
          scale: 1.2,
          ease: "none",
          scrollTrigger: {
            trigger: windowEl,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    } else {
      gsap.set(shape, {
        scaleY: 1.2,
        transformOrigin: "center bottom",
      });
      gsap.fromTo(
        shape,
        { yPercent: 0, scaleY: 1.2 },
        {
          yPercent: 20,
          scaleY: 1.2,
          ease: "none",
          scrollTrigger: {
            trigger: windowEl,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }
  });

  // Página 8: slide-8-shape crece con el scroll (escala uniforme desde el centro).
  const page08 = document.querySelector("#page-08");
  const page08ShapeImg = page08?.querySelector(".page08-shape img");
  if (page08 && page08ShapeImg) {
    gsap.set(page08ShapeImg, {
      transformOrigin: "50% 50%",
      force3D: true,
    });
    gsap.fromTo(
      page08ShapeImg,
      { scale: 1 },
      {
        scale: 1.28,
        ease: "none",
        scrollTrigger: {
          trigger: page08,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }

  // Slide 2: parallax diferencial (shape mas rapido que texto).
  const page02 = document.querySelector("#page-02");
  if (page02 && page02.querySelector(".kicker")) {
    const page02Shape = page02.querySelector(".layer--shape");
    const page02Text = page02.querySelector(".layer--text");
    const page02Kicker = page02.querySelector(".kicker");

    if (page02Shape) {
      gsap.set(page02Shape, { xPercent: -100 });
      gsap.to(page02Shape, {
        xPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: page02,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    if (page02Text) {
      gsap.to(page02Text, {
        yPercent: 100,
        ease: "none",
        scrollTrigger: {
          trigger: page02,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    if (page02Kicker) {
      const fullText = page02Kicker.textContent.trim();
      const chars = [...fullText];
      let typingTween = null;

      const playTypewriter = () => {
        if (typingTween) typingTween.kill();
        page02Kicker.classList.add("is-typing");
        page02Kicker.textContent = "";

        typingTween = gsap.to({ count: 0 }, {
          count: chars.length,
          duration: 1.5,
          ease: "none",
          onUpdate() {
            const value = Math.floor(this.targets()[0].count);
            page02Kicker.textContent = chars.slice(0, value).join("");
          },
          onComplete() {
            page02Kicker.textContent = fullText;
            page02Kicker.classList.remove("is-typing");
          },
        });
      };

      ScrollTrigger.create({
        trigger: page02,
        start: "top 75%",
        onEnter: playTypewriter,
        onEnterBack: playTypewriter,
      });
    }
  }
})();
