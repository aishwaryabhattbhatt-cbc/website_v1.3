import { scenes } from "./scene.js";

const container = document.querySelector("[data-hero-scene]");
const scene = scenes[0];

if (!container) {
  console.warn("No [data-hero-scene] container found");
  // stop running the rest of the script on pages without the hero
}


function buildScene(container, scene) {
  // 1. IMAGE
  const img = document.createElement("img");
  img.src = scene.image;
  img.className = "hero-img";
  container.appendChild(img);

  // 2. PARTICLES (dots)
  if (scene.particles) {
    const particles = document.createElement("img");
    particles.src = scene.particles;
    particles.className = "hero-particles";
    container.appendChild(particles);
  }

// Figure out when the last orbit finishes
const orbitAnimDuration = 0.5; // must match .orbit transition time in CSS
const maxOrbitDelay = scene.orbits.reduce(
  (max, o) => Math.max(max, o.delay),
  0
);
const iconsBaseDelayMs = (maxOrbitDelay + orbitAnimDuration) * 1000; 

fetch(scene.iconsJson)
  .then((response) => response.json())
  .then((data) => {
    // Get icons and center offset from new JSON structure
    const iconData = data.icons;
    const centerOffset = data.centerOffset || { x: 0, y: 0 };
    const offsetX = centerOffset.x || 0;
    const offsetY = centerOffset.y || 0;

    // 3. ORBITS (NEW LOCATION)
    scene.orbits.forEach((orbit) => {
      const div = document.createElement("div");
      div.className = "orbit";
      div.style.width = orbit.radius * 2 + "px";
      div.style.height = orbit.radius * 2 + "px";
      div.style.transitionDelay = orbit.delay + "s";
      
      // This line is key for staggering:
      div.style.transitionDelay = orbit.delay + "s";

      // APPLY THE OFFSET AND CENTERING
      div.style.left = `calc(50% + ${offsetX}px)`;
      div.style.top = `calc(50% + ${offsetY}px)`;
      
      // Combine the necessary translate(-50%, -50%) for centering 
      // with the starting animation scale(0.6)
      div.style.transform = `translate(-50%, -50%) scale(0.6)`; 

      container.appendChild(div);
    });

    // 4. ICONS
    iconData.forEach((ic, i) => {
      const icon = document.createElement("img");
      icon.src = ic.file;
      icon.className = "hero-icon";
      icon.dataset.tooltip = ic.tooltip;
      icon.dataset.angle = ic.angle;

      const orbitCfg = scene.orbits[ic.orbit] || scene.orbits[0];
      const radius = orbitCfg.radius;

      const angleRad = (ic.angle * Math.PI) / 180;
      const x = Math.cos(angleRad) * radius;
      const y = Math.sin(angleRad) * radius;

      // Position icon using calculated x/y and center offset
      icon.style.left = `calc(50% + ${offsetX}px + ${x}px)`;
      icon.style.top  = `calc(50% + ${offsetY}px + ${y}px)`;

      // NEW RANDOMIZATION LOGIC
        // 1. Random Duration (3.5s to 5.5s)
        const randomDuration = (Math.random() * (5.5 - 3.5) + 3.5).toFixed(2);
        // 2. Random Start Offset (0s to 4s, negative to start mid-cycle)
        const randomDelay = (Math.random() * 4).toFixed(2); 
        // 3. Random Direction (normal or reverse)
        const randomDirection = Math.random() < 0.5 ? 'normal' : 'reverse'; 

        icon.style.animationDuration = `${randomDuration}s`;
        icon.style.animationDelay = `-${randomDelay}s`; 
        icon.style.animationDirection = randomDirection;
      
      container.appendChild(icon);
    });

    setupTooltip(container);

    // reveal icons strictly after orbits complete, one after another
    setTimeout(() => {
      const icons = container.querySelectorAll(".hero-icon");

      icons.forEach((ic, i) => {
        setTimeout(() => {
          ic.style.opacity = 1;
        }, i * 150); // 150ms stagger between icons
      });
    }, iconsBaseDelayMs);

    requestAnimationFrame(() => startAnimation(container));
  })
  .catch((err) => {
    console.error("Error loading icon JSON:", err);
    // Ensure animation still runs if JSON load fails
    requestAnimationFrame(() => startAnimation(container)); 
  });
}

function startAnimation(container) {
    const img = container.querySelector(".hero-img");
    if (img) {
      img.style.opacity = 1;
      img.style.transform = "translateY(0)";
    }
  
    const particles = container.querySelector(".hero-particles");
    if (particles) {
      particles.style.opacity = 1;
    }
  
    container.querySelectorAll(".orbit").forEach((o) => {
      // FIX: Force a reflow/recalculation before triggering the transition.
      // This ensures the browser respects the transitionDelay set in the JS.
      void o.offsetHeight; 
      
      o.style.opacity = 1;
      o.style.transform = "translate(-50%, -50%) scale(1)"; 
    });
  }
  
// 

function setupTooltip(container) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    container.appendChild(tooltip);
  
    container.querySelectorAll(".hero-icon").forEach(icon => {
      icon.addEventListener("mouseenter", () => {
        const angle = parseFloat(icon.dataset.angle || "0");
        let finalTransform = "";
        let startTransform = "";
  
        tooltip.innerText = icon.dataset.tooltip || "";
        tooltip.style.left = icon.style.left;
        tooltip.style.top  = icon.style.top;
        
        // --- INWARD SLIDE LOGIC (Moving TOWARD the icon) ---
        
        // Right side (angle > 270): Slides R → L (Inward)
        if (angle > 270) {
          // Final Position: 35px right of icon center (Closer)
          finalTransform = "translate(40px, -50%)";
          // Start Position: 55px right (Farther)
          startTransform = "translate(55px, -50%)"; 
          tooltip.style.textAlign = "left";
        } else {
          // Left side (angle <= 270): Slides L → R (Inward)
          // Final Position: 35px left gap (Closer)
          finalTransform = "translate(calc(-100% - 40px), -50%)";
          // Start Position: 55px left gap (Farther)
          startTransform = "translate(calc(-100% - 55px), -50%)";
          tooltip.style.textAlign = "right";
        }

        // 1. Set the initial, distant position and keep it hidden
        tooltip.style.transform = startTransform;
        tooltip.style.opacity = 0;

        // 2. Use setTimeout(0) to trigger the final state in the next frame, 
        // forcing the browser to execute the transition (the slide animation).
        setTimeout(() => {
            tooltip.style.opacity = 1;
            tooltip.style.transform = finalTransform;
        }, 0); 
      });
  
      icon.addEventListener("mouseleave", () => {
        tooltip.style.opacity = 0;
        // Reset transform to the neutral position for the next hover animation
        tooltip.style.transform = "translate(-50%, -50%)"; 
      });
    });
  }

// Kick off the scene build
buildScene(container, scene);


