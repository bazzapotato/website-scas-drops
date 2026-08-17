document.addEventListener("DOMContentLoaded", async () => {
  const dropsGrid = document.getElementById("dropsGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("themeToggle");
  const countAll = document.getElementById("countAll");
  const modal = document.getElementById("dropModal");
  const modalBody = document.getElementById("modalBody");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const currentYearSpan = document.getElementById("currentYear");

  if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

  let dropsData = [];

  try {
    const res = await fetch("drops.json");
    if (!res.ok) throw new Error("Failed to load drops.json");
    dropsData = await res.json();
  } catch (err) {
    console.error("Error loading drops.json:", err);
  }

  let activeFilter = "all";
  let searchQuery = "";

  function renderDrops() {
    dropsGrid.innerHTML = "";

    const filtered = dropsData.filter((drop) => {
      const matchesFilter = activeFilter === "all" || drop.status.toLowerCase() === activeFilter.toLowerCase();
      const matchesSearch =
        drop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (drop.tagline && drop.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(drop.dropNumber).includes(searchQuery);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      dropsGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 40px; text-align: center; border: 2px dashed var(--border-color);">
          <p>NO DROPS FOUND MATCHING YOUR CRITERIA.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((drop) => {
      dropsGrid.appendChild(createDropCard(drop));
    });

    startCountdownTimers();
  }

  function createDropCard(drop) {
    const card = document.createElement("article");
    card.className = "drop-card";

    const badgeLabel = (drop.status || "").replace("_", " ");
    const repeatedTitle = `${drop.title.toUpperCase()} • `.repeat(8);

    card.innerHTML = `
      <div class="card-header">
        <span class="drop-number"># ${drop.dropNumber}</span>
        <span class="drop-badge badge-${drop.status.toLowerCase()}">${badgeLabel}</span>
      </div>
      <div class="card-media" onclick="openDropModal(${drop.id})">
        <img src="${drop.image}" alt="${drop.title}" class="card-image" loading="lazy">
      </div>
      <div class="card-ticker">
        <div class="ticker-track">${repeatedTitle}</div>
      </div>
      <div class="card-body">
        <div>
          <h2 class="drop-title">${drop.title}</h2>
          <p class="drop-tagline">${drop.tagline || ""}</p>
          ${
            drop.status.toLowerCase() === "upcoming" && drop.releaseDate && drop.releaseDate !== "TBA"
              ? `<div class="countdown-timer" data-release="${drop.releaseDate}">DROPPING IN: --:--:--</div>`
              : ""
          }
        </div>
        <div class="card-footer">
          <span class="drop-price">${drop.price || ""}</span>
          <a href="${drop.link || '#'}" target="_blank" rel="noopener" class="drop-action-btn">${drop.buttonText || 'View'}</a>
        </div>
      </div>
    `;
    return card;
  }

  function startCountdownTimers() {
    const timers = document.querySelectorAll(".countdown-timer");

    function update() {
      timers.forEach((timer) => {
        const releaseTime = new Date(timer.getAttribute("data-release")).getTime();
        const now = new Date().getTime();
        const diff = releaseTime - now;

        if (diff <= 0) {
          timer.textContent = "DROPPING NOW";
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);

          timer.textContent = `DROPPING IN: ${days > 0 ? days + "D " : ""}${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        }
      });
    }

    update();
    setInterval(update, 1000);
  }

  window.openDropModal = function(id) {
    const drop = dropsData.find((d) => d.id === id);
    if (!drop) return;

    modalBody.innerHTML = `
      <div style="margin-bottom: 14px; font-weight: bold; font-size: 1.1rem;"># ${drop.dropNumber} // ${drop.status.toUpperCase()}</div>
      <img src="${drop.image}" alt="${drop.title}" style="width: 100%; border: 2px solid var(--border-color); margin-bottom: 16px;">
      <h2 style="font-family: var(--font-display); font-size: 1.6rem; margin-bottom: 8px;">${drop.title}</h2>
      <p style="margin-bottom: 16px; line-height: 1.5; font-size: 0.95rem;">${drop.description || ""}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid var(--border-color); padding-top: 16px;">
        <span style="font-size: 1.2rem; font-weight: bold;">${drop.price || ""}</span>
        <a href="${drop.link || '#'}" target="_blank" rel="noopener" class="drop-action-btn">${drop.buttonText || 'View'}</a>
      </div>
    `;
    modal.classList.add("active");
  };

  modalCloseBtn.addEventListener("click", () => modal.classList.remove("active"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter");
      renderDrops();
    });
  });

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderDrops();
  });

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
  });

  if (countAll) countAll.textContent = dropsData.length;
  renderDrops();
});

});
