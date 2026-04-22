(() => {
  const soundIndicator = document.querySelector("#sound-indicator");
  let soundAudio = null;
  let isPlaying = false;

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

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const typewriterTargets = Array.from(document.querySelectorAll("[data-typewriter]"));
  if (typewriterTargets.length) {
    typewriterTargets.forEach((el) => {
      if (!el.dataset.typewriterOriginal) el.dataset.typewriterOriginal = el.textContent;
      el.dataset.typewriterDone = "false";
      if (reducedMotion) return;
      el.textContent = "";
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

          const fullText = (el.dataset.typewriterOriginal || el.textContent || "").replace(/\s+/g, " ").trim();
          const chars = [...fullText];
          const cps = 18;
          const totalMs = Math.max(450, Math.min(2200, Math.round((chars.length / cps) * 1000)));
          const start = performance.now();

          const tick = (now) => {
            const progress = Math.min(1, (now - start) / totalMs);
            const count = Math.max(1, Math.floor(progress * chars.length));
            el.textContent = chars.slice(0, count).join("");
            if (progress < 1) requestAnimationFrame(tick);
            else {
              el.textContent = fullText;
              el.dataset.typewriterDone = "true";
              obs.unobserve(el);
            }
          };

          requestAnimationFrame(tick);
        });
      }, { threshold: 0.35 });

      typewriterTargets.forEach((el) => io.observe(el));
    } else if (!reducedMotion) {
      // Fallback: sin IntersectionObserver, mostramos el texto completo.
      typewriterTargets.forEach((el) => {
        el.textContent = (el.dataset.typewriterOriginal || el.textContent || "").replace(/\s+/g, " ").trim();
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

  // Efecto "ventana": shape mas grande que el contenedor y desplazamiento vertical por scroll.
  const frameWindows = gsap.utils.toArray("[data-scroll-window]");
  frameWindows.forEach((windowEl) => {
    const shape = windowEl.querySelector(".frame-window__shape");
    if (!shape) return;

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
  });

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
