const toggleButton = document.querySelector(".nav-toggle");
const drawer = document.querySelector("[data-mobile-nav-drawer]");
const overlay = document.querySelector("[data-mobile-nav-overlay]");
const closeButton = document.querySelector("[data-mobile-nav-close]");

function setNavOpen(isOpen) {
  if (!toggleButton || !drawer || !overlay) {
    return;
  }

  toggleButton.setAttribute("aria-expanded", String(isOpen));
  drawer.setAttribute("aria-hidden", String(!isOpen));
  drawer.classList.toggle("is-open", isOpen);
  overlay.hidden = !isOpen;
  overlay.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("nav-open", isOpen);
}

function closeNav() {
  setNavOpen(false);
}

function initMobileNav() {
  if (!toggleButton || !drawer || !overlay) {
    return;
  }

  toggleButton.addEventListener("click", () => {
    const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
    setNavOpen(!isOpen);
  });

  overlay.addEventListener("click", closeNav);
  closeButton?.addEventListener("click", closeNav);

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });
}

function initFooterAccordions() {
  document.querySelectorAll(".footer-accordion-header").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("aria-controls");
      const list = targetId ? document.getElementById(targetId) : null;
      if (!list) {
        return;
      }

      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      list.hidden = isOpen;
    });
  });
}

initMobileNav();
initFooterAccordions();
