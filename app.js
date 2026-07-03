const revealTargets = document.querySelectorAll(
  ".section, .workflow-band, .final-cta, .stats-row article, .console-preview"
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealTargets.forEach((target) => {
  target.classList.add("reveal");
  observer.observe(target);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const filterButtons = document.querySelectorAll(".filter-button");
const abilityCards = document.querySelectorAll(".ability-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    abilityCards.forEach((card) => {
      const shouldShow = selected === "all" || card.dataset.group === selected;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});
