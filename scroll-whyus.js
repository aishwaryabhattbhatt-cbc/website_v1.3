// scroll-whyus.js
// Scroll-driven scene for the "Why Us" section.
// Grey box: Frame 1 full -> Frame 3 smaller.
// Panels: Frame 1 -> Frame 3.

(function () {
  const section    = document.querySelector('.why-us');
  const imageBox   = document.querySelector('.why-us-image');
  const topPanel   = document.querySelector('.panel-top');
  const leftPanel  = document.querySelector('.panel-left');
  const rightPanel = document.querySelector('.panel-right');

  if (!section || !imageBox || !topPanel || !leftPanel || !rightPanel) return;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp  = (a, b, t) => a + (b - a) * t;

  // ---------- FRAME 1 ----------
  const F1 = {
    top:  { x: 50, y: 60 },  // top panel, centered upper
    left: { x: 40, y: 70 },  // bottom-left
    right:{ x: 60, y: 70 }   // bottom-right
  };

  // ---------- FRAME 3 ----------
  const F3 = {
    top:  { x: 50, y: 22 },  // above card
    left: { x: 15, y: 60 },  // left of card
    right:{ x: 85, y: 60 }   // right of card
  };

  // ---------- IMAGE FRAME POSITIONS ----------
  // Only vertical offset for the whole image card.
  const IMG_F1 = { y: 0   };  // no shift in Frame 1
  const IMG_F3 = { y: 60  };  // final shift down in Frame 3 (px)

  function setPanelPos(el, pos) {
    el.style.left = pos.x + '%';
    el.style.top  = pos.y + '%';
  }

  function interpFrames(fA, fB, t) {
    return {
      top: {
        x: lerp(fA.top.x,   fB.top.x,   t),
        y: lerp(fA.top.y,   fB.top.y,   t)
      },
      left: {
        x: lerp(fA.left.x,  fB.left.x,  t),
        y: lerp(fA.left.y,  fB.left.y,  t)
      },
      right: {
        x: lerp(fA.right.x, fB.right.x, t),
        y: lerp(fA.right.y, fB.right.y, t)
      }
    };
  }

  function updateOnScroll() {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const sectionHeight   = section.offsetHeight;
    const totalScrollable = sectionHeight - viewportHeight;
    if (totalScrollable <= 0) return;

    // 0 → 1 as we scroll through the Why Us section (raw)
    const sectionScroll = clamp(-rect.top, 0, totalScrollable);
    const raw = sectionScroll / totalScrollable;   // 0 → 1

    // We want:
    // - 0 → holdStart of scroll: play full F1 → F3 animation 0 → 1
    // - holdStart → 1: keep t fixed at 1 (hold final frame)
    const holdStart = 0.75;  // 80% scroll used for animation
    let t;
    if (raw < holdStart) {
      t = raw / holdStart;   // scales 0..holdStart → 0..1
    } else {
      t = 1;                 // last 20% of scroll → stay in F3
    }

    // ---- PANELS: direct F1 → F3 interpolation ----
    const frameNow = interpFrames(F1, F3, t);

    setPanelPos(topPanel,  frameNow.top);
    setPanelPos(leftPanel, frameNow.left);
    setPanelPos(rightPanel,frameNow.right);

    // ---- IMAGE BOX: scale + vertical position direct F1 → F3 ----
    const scaleF1 = 1.0;   // full frame
    const scaleF3 = 0.45;  // final card

    const imgScale = lerp(scaleF1, scaleF3, t);
    const imgY     = lerp(IMG_F1.y, IMG_F3.y, t);

    imageBox.style.transform = `translateY(${imgY}px) scale(${imgScale})`;

    // ---- CORNER RADIUS: F1 → F3 ----
    const radiusF1 = 0;    // sharp corners when fullscreen
    const radiusF3 = 24;   // final rounding

    const radius = lerp(radiusF1, radiusF3, t);
    imageBox.style.borderRadius = radius + 'px';
  }

  window.addEventListener('scroll', updateOnScroll, { passive: true });
  window.addEventListener('resize', updateOnScroll);
  updateOnScroll();
})();
