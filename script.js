const filterButtons = document.querySelectorAll(".filter-button");
const lectureCards = document.querySelectorAll(".lecture-card");
const navLinks = document.querySelectorAll(".site-nav a");
const sections = [...document.querySelectorAll("main section[id]")];
const lectureModal = document.querySelector("#lecture-modal");
const modalPanel = document.querySelector(".modal-panel");
const modalContent = document.querySelector("#lecture-modal-content");
const fluidCanvas = document.querySelector("#fluid-canvas");
const themeToggle = document.querySelector("#theme-toggle");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointer = {
  x: 0.5,
  y: 0.32,
  targetX: 0.5,
  targetY: 0.32,
};
let lastFocusedElement = null;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const applyTheme = (theme) => {
  const normalizedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = normalizedTheme;

  if (themeToggle) {
    themeToggle.checked = normalizedTheme === "light";
    themeToggle.setAttribute(
      "aria-label",
      normalizedTheme === "light" ? "Switch to dark mode" : "Switch to light mode"
    );
  }
};

applyTheme(document.documentElement.dataset.theme);

themeToggle?.addEventListener("change", () => {
  const nextTheme = themeToggle.checked ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem("portfolio-theme", nextTheme);
  } catch (error) {
    // Theme still changes for the current session if storage is unavailable.
  }
});

const hideLoader = () => {
  document.body.classList.remove("is-loading");
};

const revealLoader = () => {
  window.requestAnimationFrame(hideLoader);
};

window.addEventListener("load", revealLoader);
window.addEventListener("pageshow", revealLoader);

if (document.readyState === "complete") {
  revealLoader();
}

const updatePointer = (event) => {
  pointer.targetX = event.clientX / window.innerWidth;
  pointer.targetY = event.clientY / window.innerHeight;
};

window.addEventListener("pointermove", updatePointer, { passive: true });

if (fluidCanvas && !prefersReducedMotion.matches) {
  const context = fluidCanvas.getContext("2d");
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  const resizeFluidCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    fluidCanvas.width = Math.floor(width * ratio);
    fluidCanvas.height = Math.floor(height * ratio);
    fluidCanvas.style.width = `${width}px`;
    fluidCanvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const drawFluid = (time = 0) => {
    pointer.x += (pointer.targetX - pointer.x) * 0.055;
    pointer.y += (pointer.targetY - pointer.y) * 0.055;

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.lineCap = "round";

    const lines = Math.max(18, Math.floor(height / 42));
    const pointerX = pointer.x * width;
    const pointerY = pointer.y * height;

    for (let index = 0; index < lines; index += 1) {
      const baseY = (height / (lines + 1)) * (index + 1);
      const alpha = 0.018 + (index % 4) * 0.007;
      context.beginPath();

      for (let x = -80; x <= width + 80; x += 26) {
        const distance = Math.hypot((pointerX - x) / width, (pointerY - baseY) / height);
        const influence = Math.max(0, 1 - distance * 2.4);
        const wave =
          Math.sin(x * 0.009 + time * 0.00055 + index * 0.62) * 15 +
          Math.cos(x * 0.004 - time * 0.00042 + index) * 10;
        const pull = influence * Math.sin(time * 0.001 + index * 0.7) * 36;
        const y = baseY + wave + pull;

        if (x === -80) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.strokeStyle =
        index % 3 === 0
          ? `rgba(143, 210, 200, ${alpha + 0.03})`
          : index % 3 === 1
            ? `rgba(196, 161, 95, ${alpha})`
            : `rgba(154, 111, 130, ${alpha})`;
      context.stroke();
    }

    animationFrame = requestAnimationFrame(drawFluid);
  };

  resizeFluidCanvas();
  drawFluid();
  window.addEventListener("resize", resizeFluidCanvas, { passive: true });

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", () => {
      cancelAnimationFrame(animationFrame);
      context.clearRect(0, 0, width, height);
    });
  }
}

const revealTargets = document.querySelectorAll(
  ".section-heading, .cv-block, .filter-bar, .lecture-card, .project-panel, .project-stat, .final-reflection > p, .contact-card"
);

revealTargets.forEach((item, index) => {
  item.classList.add("reveal-item");
  item.style.transitionDelay = `${Math.min(index * 28, 180)}ms`;
});

if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  revealTargets.forEach((item) => revealObserver.observe(item));
} else {
  revealTargets.forEach((item) => item.classList.add("is-visible"));
}

if (!prefersReducedMotion.matches) {
  document.querySelectorAll(".cv-block, .lecture-card, .project-panel, .project-stat, .contact-card").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

      item.style.setProperty("--spot-x", `${(x * 100).toFixed(2)}%`);
      item.style.setProperty("--spot-y", `${(y * 100).toFixed(2)}%`);
      item.style.setProperty("--tilt-x", `${((0.5 - y) * 4).toFixed(2)}deg`);
      item.style.setProperty("--tilt-y", `${((x - 0.5) * 5).toFixed(2)}deg`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--spot-x", "50%");
      item.style.setProperty("--spot-y", "0%");
      item.style.setProperty("--tilt-x", "0deg");
      item.style.setProperty("--tilt-y", "0deg");
    });
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    lectureCards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      const shouldShow = filter === "all" || categories.includes(filter);
      card.hidden = !shouldShow;
    });
  });
});

const closeLectureModal = () => {
  if (!lectureModal || !modalContent) {
    return;
  }

  lectureModal.hidden = true;
  document.body.classList.remove("modal-open");
  modalContent.innerHTML = "";

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
};

const openLectureModal = (card) => {
  if (!lectureModal || !modalPanel || !modalContent) {
    return;
  }

  lastFocusedElement = document.activeElement;
  const content = card.cloneNode(true);
  content.removeAttribute("role");
  content.removeAttribute("tabindex");
  content.removeAttribute("aria-haspopup");
  content.removeAttribute("aria-label");

  const heading = content.querySelector("h3");
  if (heading) {
    heading.id = "lecture-modal-title";
  }

  modalContent.innerHTML = "";
  [...content.children].forEach((child) => {
    modalContent.appendChild(child);
  });

  lectureModal.hidden = false;
  document.body.classList.add("modal-open");
  modalPanel.focus();
};

lectureCards.forEach((card) => {
  const title = card.querySelector("h3")?.textContent || "lecture details";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-haspopup", "dialog");
  card.setAttribute("aria-label", `Open ${title}`);

  card.addEventListener("click", () => openLectureModal(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLectureModal(card);
    }
  });
});

document.querySelectorAll("[data-modal-close]").forEach((item) => {
  item.addEventListener("click", closeLectureModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lectureModal && !lectureModal.hidden) {
    closeLectureModal();
  }
});

const setActiveNavLink = (sectionId) => {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${sectionId}`);
  });
};

const activateNavLink = () => {
  const offset = window.innerHeight * 0.32;
  const pageBottom = window.scrollY + window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const isAtBottom = pageBottom >= documentHeight - 4;
  const activeSection = isAtBottom
    ? sections.at(-1)
    : sections.filter((section) => section.getBoundingClientRect().top <= offset).at(-1);

  if (activeSection) {
    setActiveNavLink(activeSection.id);
  }
};

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.getAttribute("href")?.slice(1);

    if (targetId) {
      setActiveNavLink(targetId);
    }
  });
});

const updateScrollProgress = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
};

const updatePageState = () => {
  activateNavLink();
  updateScrollProgress();
};

updatePageState();
window.addEventListener("scroll", updatePageState, { passive: true });
window.addEventListener("resize", updatePageState, { passive: true });
