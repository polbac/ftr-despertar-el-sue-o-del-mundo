(() => {
  const customCursor = document.querySelector("#custom-cursor");
  const enableCustomCursor =
    customCursor &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches;

  if (enableCustomCursor) {
    customCursor.hidden = false;
    document.documentElement.classList.add("has-custom-cursor");

    const TRAIL_MIN_MS = 38;
    const TRAIL_MIN_DIST = 9;
    const TRAIL_MAX_ACTIVE = 72;
    let lastTrailX = null;
    let lastTrailY = null;
    let lastTrailT = 0;
    let trailActive = 0;

    const spawnTrail = (x, y) => {
      if (trailActive >= TRAIL_MAX_ACTIVE) return;
      trailActive += 1;
      const el = document.createElement("div");
      el.className = "custom-cursor-trail";
      el.setAttribute("aria-hidden", "true");
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      document.body.appendChild(el);
      el.addEventListener(
        "animationend",
        () => {
          el.remove();
          trailActive -= 1;
        },
        { once: true }
      );
    };

    const onMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      customCursor.style.left = `${x}px`;
      customCursor.style.top = `${y}px`;
      customCursor.classList.add("is-active");

      const now = performance.now();
      if (lastTrailX === null || lastTrailY === null) {
        lastTrailX = x;
        lastTrailY = y;
        lastTrailT = now;
      } else {
        const dt = now - lastTrailT;
        const dist = Math.hypot(x - lastTrailX, y - lastTrailY);
        if (dt >= TRAIL_MIN_MS && dist >= TRAIL_MIN_DIST) {
          spawnTrail(x, y);
          lastTrailX = x;
          lastTrailY = y;
          lastTrailT = now;
        }
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });

    document.addEventListener(
      "pointerdown",
      () => {
        customCursor.classList.add("is-pressed");
      },
      { passive: true }
    );
    document.addEventListener(
      "pointerup",
      () => {
        customCursor.classList.remove("is-pressed");
      },
      { passive: true }
    );
  }

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

  // Página 4: el shape se desplaza hacia la derecha con el scroll.
  // (La nube queda estática y pegada abajo a la derecha desde CSS.)
  const page04 = document.querySelector("#page-04");
  const page04Window = page04?.querySelector(".frame-window");
  const page04Shape = page04Window?.querySelector(".frame-window__shape");
  if (page04 && page04Window && page04Shape) {
    gsap.set(page04Shape, { x: 0, force3D: true });
    const maxShift = () => Math.min(280, page04Window.getBoundingClientRect().width * 0.28);

    gsap.to(page04Shape, {
      x: () => maxShift(),
      ease: "none",
      scrollTrigger: {
        trigger: page04,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }

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
        scale: 5,
        ease: "none",
        scrollTrigger: {
          trigger: page08,
          start: "top 50%",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }

  // Página 23: la luna aparece arriba y baja un poco con scroll.
  const page23 = document.querySelector("#page-23");
  const page23Luna = page23?.querySelector(".page23-luna");
  if (page23 && page23Luna) {
    gsap.set(page23Luna, { x: 0, y: 0, force3D: true });
    gsap.to(page23Luna, {
      x: 0,
      y: 70,
      ease: "none",
      scrollTrigger: {
        trigger: page23,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
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
