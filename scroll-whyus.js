// scroll-whyus.js
// Scroll-driven scene for the "Why Us" section.
// Grey box: Frame 1 full -> Frame 2 medium -> Frame 3 smaller.
// Blue panels: Frame 1 -> Frame 2 -> Frame 3 positions.

(function () {
  const section    = document.querySelector('.why-us');
  const imageBox   = document.querySelector('.why-us-image');
  const topPanel   = document.querySelector('.panel-top');
  const leftPanel  = document.querySelector('.panel-left');
  const rightPanel = document.querySelector('.panel-right');

  if (!section || !imageBox || !topPanel || !leftPanel || !rightPanel) return;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp  = (a, b, t) => a + (b - a) * t;

  // Positions are in % of the stage (left/top).
  // Tune these to match your exact layout frames.

  // ---------- FRAME 1 ----------
  const F1 = {
    top:  { x: 50, y: 24 },  // top panel, centered upper
    left: { x: 40, y: 70 },  // bottom-left
    right:{ x: 60, y: 70 }   // bottom-right
  };

  // ---------- FRAME 2 ----------
  const F2 = {
    top:  { x: 50, y: 33 },
    left: { x: 46, y: 65 },
    right:{ x: 54, y: 65 }
  };

  // ---------- FRAME 3 ----------
  const F3 = {
    top:  { x: 50, y: 22 },  // above card
    left: { x: 15, y: 60 },  // left of card
    right:{ x: 85, y: 60 }   // right of card
  };

    // ---------- IMAGE FRAME POSITIONS ----------
  // we only move it vertically; F1/F2 centered, F3 slightly lower
  const IMG_F1 = { y: 0    };   // no shift
  const IMG_F2 = { y: 0    };   // still centered in mid state
  const IMG_F3 = { y: 60   };   // move whole card 80px down in final frame


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

    // 0 → 1 as we scroll through the Why Us section
    const sectionScroll = clamp(-rect.top, 0, totalScrollable);
    const t = sectionScroll / totalScrollable;

    // Split into two phases:
    //   0   → 0.5 : Frame 1 → Frame 2
    //   0.5 → 1   : Frame 2 → Frame 3
    const mid = 0.5;

    let t12 = 0; // F1->F2 progress
    let t23 = 0; // F2->F3 progress

    if (t <= mid) {
      t12 = t / mid;               // 0 → 1 over first half
      t23 = 0;
    } else {
      t12 = 1;
      t23 = (t - mid) / (1 - mid); // 0 → 1 over second half
    }

    // ---- PANELS: Frame interpolation ----
    let frameNow;
    if (t12 < 1) {
      frameNow = interpFrames(F1, F2, t12);
    } else {
      frameNow = interpFrames(F2, F3, t23);
    }

    setPanelPos(topPanel,  frameNow.top);
    setPanelPos(leftPanel, frameNow.left);
    setPanelPos(rightPanel,frameNow.right);

    // ---- GREY BOX: scale synced with the same phases ----
    //
    // We give each frame its own scale:
    //   Frame 1: scaleF1  (full-screen)
    //   Frame 2: scaleF2  (medium card)
    //   Frame 3: scaleF3  (smaller card)
    //
    // And interpolate:
    //   0   → 0.5 : F1 scale → F2 scale
    //   0.5 → 1   : F2 scale → F3 scale
    
    // ---- GREY BOX: scale + vertical position per frame ----
    const scaleF1 = 1.0;   // full frame
    const scaleF2 = 0.70;  // mid card
    const scaleF3 = 0.45;  // final card

    let imgScale;
    let imgY;              // vertical shift in px

    if (t <= mid) {
      const local = t / mid;               // 0 → 1 over first half
      imgScale = lerp(scaleF1, scaleF2, local);
      imgY      = lerp(IMG_F1.y, IMG_F2.y, local);
    } else {
      const local = (t - mid) / (1 - mid); // 0 → 1 over second half
      imgScale = lerp(scaleF2, scaleF3, local);
      imgY      = lerp(IMG_F2.y, IMG_F3.y, local);
    }

    // apply both scale + vertical offset to the whole image card
    imageBox.style.transform = `translateY(${imgY}px) scale(${imgScale})`;


        // ---- IMAGE CROPPING / ALIGNMENT (only changes in F3 phase) ----
        let imgOffsetPx = 0; // 0 = centered

        if (t <= mid) {
          // Frame 1 → Frame 2: keep image perfectly centered
          imgOffsetPx = 0;
        } else {
          // Frame 2 → Frame 3: gradually move image down by up to 200px
          const local = (t - mid) / (1 - mid); // 0 → 1 over second half
          imgOffsetPx = lerp(0, 200, local);   // 0px → 200px
        }
    
        if (imageEl) {
          // center horizontally, nudge vertically in pixels
          imageEl.style.objectPosition = `center calc(50% + ${imgOffsetPx}px)`;
        }
    

    // Optional: radius also synced across both phases
    const radiusF1 = 0;    // sharp corners when fullscreen
    const radiusF2 = 16;   // medium rounding
    const radiusF3 = 24;   // final rounding

    let radius;
    if (t <= mid) {
      const local = t / mid;
      radius = lerp(radiusF1, radiusF2, local);
    } else {
      const local = (t - mid) / (1 - mid);
      radius = lerp(radiusF2, radiusF3, local);
    }

    imageBox.style.borderRadius = radius + 'px';
  }

  window.addEventListener('scroll', updateOnScroll, { passive: true });
  window.addEventListener('resize', updateOnScroll);
  updateOnScroll();
})();
