/* ==========================================================================
   Hero slider + header scroll behavior — Motor 47
   ========================================================================== */

(function () {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".hero-slide"));
  const dotsWrap = document.getElementById("hero-dots");
  const prev = slider.querySelector(".hero-arrow--prev");
  const next = slider.querySelector(".hero-arrow--next");

  let current = 0;
  let autoplayId = null;
  const AUTOPLAY_MS = 6000;

  // Build dots
  dotsWrap.innerHTML = slides
    .map((_, i) => `<button class="hero-dot${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`)
    .join("");

  const dots = Array.from(dotsWrap.querySelectorAll(".hero-dot"));

  function go(idx) {
    current = (idx + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
  }

  function nextSlide() { go(current + 1); }
  function prevSlide() { go(current - 1); }

  function startAutoplay() {
    stopAutoplay();
    autoplayId = setInterval(nextSlide, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayId) clearInterval(autoplayId);
    autoplayId = null;
  }

  next.addEventListener("click", () => { nextSlide(); startAutoplay(); });
  prev.addEventListener("click", () => { prevSlide(); startAutoplay(); });

  dots.forEach((d) =>
    d.addEventListener("click", () => {
      go(Number(d.dataset.i));
      startAutoplay();
    })
  );

  // Pause autoplay when tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // Keyboard nav
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { prevSlide(); startAutoplay(); }
    else if (e.key === "ArrowRight") { nextSlide(); startAutoplay(); }
  });

  // Touch swipe
  let touchX = null;
  slider.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  slider.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? nextSlide() : prevSlide();
      startAutoplay();
    }
    touchX = null;
  }, { passive: true });

  startAutoplay();

  // Header scroll effect
  const header = document.querySelector(".header--over");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
