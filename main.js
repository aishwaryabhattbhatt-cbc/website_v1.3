// main.js
import { scenes } from "./scene.js";

document.addEventListener("DOMContentLoaded", () => {
  // Find the hero visual container
  const container = document.querySelector("[data-hero-scene]");
  if (!container) {
    console.warn("No [data-hero-scene] container found");
    return; // stop if hero isn't on this page
  }

  const scene = scenes[0];
  buildScene(container, scene);
});

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

      // 3. ORBITS
      scene.orbits.forEach((orbit) => {
        const div = document.createElement("div");
        div.className = "orbit";
        div.style.width = orbit.radius * 2 + "px";
        div.style.height = orbit.radius * 2 + "px";

        // delay per orbit
        div.style.transitionDelay = orbit.delay + "s";

        // center + offset
        div.style.left = `calc(50% + ${offsetX}px)`;
        div.style.top = `calc(50% + ${offsetY}px)`;

        // start smaller, will scale up
        div.style.transform = "translate(-50%, -50%) scale(0.6)";

        container.appendChild(div);
      });

      // 4. ICONS
      iconData.forEach((ic) => {
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
        icon.style.top = `calc(50% + ${offsetY}px + ${y}px)`;

        // randomised orbit animation
        const randomDuration = (Math.random() * (5.5 - 3.5) + 3.5).toFixed(2);
        const randomDelay = (Math.random() * 4).toFixed(2);
        const randomDirection = Math.random() < 0.5 ? "normal" : "reverse";

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
    // Force a reflow before triggering the transition
    void o.offsetHeight;

    o.style.opacity = 1;
    o.style.transform = "translate(-50%, -50%) scale(1)";
  });
}

function setupTooltip(container) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  container.appendChild(tooltip);

  container.querySelectorAll(".hero-icon").forEach((icon) => {
    icon.addEventListener("mouseenter", () => {
      const angle = parseFloat(icon.dataset.angle || "0");
      let finalTransform = "";
      let startTransform = "";

      tooltip.innerText = icon.dataset.tooltip || "";
      tooltip.style.left = icon.style.left;
      tooltip.style.top = icon.style.top;

      // Right side: slide in from the right
      if (angle > 270) {
        finalTransform = "translate(40px, -50%)";
        startTransform = "translate(55px, -50%)";
        tooltip.style.textAlign = "left";
      } else {
        // Left side: slide in from the left
        finalTransform = "translate(calc(-100% - 40px), -50%)";
        startTransform = "translate(calc(-100% - 55px), -50%)";
        tooltip.style.textAlign = "right";
      }

      tooltip.style.transform = startTransform;
      tooltip.style.opacity = 0;

      setTimeout(() => {
        tooltip.style.opacity = 1;
        tooltip.style.transform = finalTransform;
      }, 0);
    });

    icon.addEventListener("mouseleave", () => {
      tooltip.style.opacity = 0;
      tooltip.style.transform = "translate(-50%, -50%)";
    });
  });
}
