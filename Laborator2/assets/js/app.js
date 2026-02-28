const state = {
  data: null,
  query: "",
  type: "all",
  tag: "all",
  favOnly: false,
  fav: new Set(JSON.parse(localStorage.getItem("cih-fav") || "[]"))
};

const $ = (sel) => document.querySelector(sel);

function setActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[data-page]").forEach(a => {
    if (a.dataset.page === path) a.classList.add("active");
    else a.classList.remove("active");
  });
}

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove("show"), 2200);
}

function normalize(s) {
  return (s || "").toString().toLowerCase().trim();
}
function saveFav() {
  localStorage.setItem("cih-fav", JSON.stringify([...state.fav]));
}
function isFav(id) {
  return state.fav.has(id);
}
function toggleFav(id) {
  if (state.fav.has(id)) state.fav.delete(id);
  else state.fav.add(id);
  saveFav();
}
function matches(resource) {
  const q = normalize(state.query);
  const t = state.type;
  const tg = state.tag;

  const hay = [
    resource.name, resource.type, resource.location,
    ...(resource.tags || [])
  ].map(normalize).join(" ");

  const okQuery = !q || hay.includes(q);
  const okType = (t === "all") || normalize(resource.type) === normalize(t);
  const okTag = (tg === "all") || (resource.tags || []).map(normalize).includes(normalize(tg));
  const okFav = !state.favOnly || isFav(resource.id);

  return okQuery && okType && okTag && okFav;
}

function renderTags(resources) {
  const allTags = new Map();
  resources.forEach(r => (r.tags || []).forEach(tag => {
    const key = normalize(tag);
    allTags.set(key, (allTags.get(key) || 0) + 1);
  }));

  const container = $("#tags");
  if (!container) return;

  const tagsSorted = [...allTags.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18);

  container.innerHTML = "";

  const makeTag = (label, count, active = false) => {
    const b = document.createElement("button");
    b.className = "tag" + (active ? " active" : "");
    b.type = "button";
    b.textContent = `${label} · ${count}`;
    b.addEventListener("click", () => {
      state.tag = (normalize(state.tag) === normalize(label) ? "all" : label);
      renderAll();
      toast(state.tag === "all" ? "Filtru tag resetat" : `Filtrare după tag: ${label}`);
      $("#tagsSection")?.scrollIntoView({ behavior: "smooth" });
    });
    return b;
  };

  tagsSorted.forEach(([tag, count]) => {
    container.appendChild(makeTag(tag, count, normalize(state.tag) === tag));
  });
}
function closeModal() {
  const modal = $("#modal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openModal(resource) {
  const modal = $("#modal");
  if (!modal) return;

  $("#modalType").textContent = resource.type;
  $("#modalTitle").textContent = resource.name;

  $("#modalMeta").innerHTML = `
    <span class="badge">📍 ${resource.location}</span>
    <span class="badge">id: ${resource.id}</span>
  `;

  $("#modalDesc").textContent = resource.details?.description || "—";

  const sched = resource.program || {};
  $("#modalSchedule").innerHTML = Object.entries(sched).map(([k, v]) =>
    `<span class="pill">${k}: ${v}</span>`
  ).join("");
  $("#modalTags").innerHTML = (resource.tags || [])
    .map(t => `<span class="pill clickable" data-modal-tag="${t}">#${t}</span>`)
    .join("");

  const links = resource.details?.links || [];
  $("#modalLinks").innerHTML = links.length
    ? `<h3 style="margin:14px 0 8px;">Link-uri</h3>` + links.map(l =>
      `<a class="anchor" href="${l.url}" target="_blank" rel="noreferrer">${l.label} ↗</a>`
    ).join("<br/>")
    : "";
  const pageMap = {
    "Biblioteca": "pages/library.html",
    "Cantină": "pages/cafeteria.html",
    "Cafenea": "pages/cafeteria.html",
    "Eveniment": "pages/events.html",
    "Spațiu de studiu": "pages/library.html"
  };
  $("#modalGo").href = pageMap[resource.type] || "index.html";

  const favBtn = $("#modalFav");
  favBtn.textContent = isFav(resource.id) ? "⭐ Scoate din favorite" : "⭐ Adaugă la favorite";
  favBtn.onclick = () => {
    toggleFav(resource.id);
    favBtn.textContent = isFav(resource.id) ? "⭐ Scoate din favorite" : "⭐ Adaugă la favorite";
    toast(isFav(resource.id) ? "Adăugat la favorite" : "Scos din favorite");
    renderAll();
  };
  $("#modalTags").querySelectorAll("[data-modal-tag]").forEach(chip => {
    chip.addEventListener("click", () => {
      const t = chip.dataset.modalTag;
      state.tag = t;
      closeModal();
      renderAll();
      toast(`Filtrare: #${t}`);
      $("#tagsSection")?.scrollIntoView({ behavior: "smooth" });
    });
  });
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  $("#modalClose").onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  window.onkeydown = (e) => { if (e.key === "Escape") closeModal(); };
}
function card(resource) {
  const el = document.createElement("article");
  el.className = "card";
  el.setAttribute("role", "listitem");
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });

  const typeBadge = `<span class="badge"><strong>${resource.type}</strong></span>`;
  const locBadge = `<span class="badge">📍 ${resource.location}</span>`;

  const pageMap = {
    "Biblioteca": "pages/library.html",
    "Cantină": "pages/cafeteria.html",
    "Cafenea": "pages/cafeteria.html",
    "Eveniment": "pages/events.html",
    "Spațiu de studiu": "pages/library.html"
  };

  const pageHref = pageMap[resource.type] || "index.html";
  const favActive = isFav(resource.id) ? "active" : "";

  el.innerHTML = `
    <button class="fav ${favActive}" type="button" title="Adaugă la favorite" aria-label="Favorite">⭐</button>

    <div class="meta" style="justify-content:space-between; align-items:center;">
      ${typeBadge}
      <span class="pill">id: ${resource.id}</span>
    </div>

    <h3 style="margin-top:10px;">
      <a href="${pageHref}" data-open="modal" title="Vezi detalii">${resource.name}</a>
    </h3>

    <div class="meta">
      ${locBadge}
      <span class="badge">⏰ ${resource.program?.["Mon-Fri"] || "Vezi program"}</span>
    </div>

    <div class="details">${resource.details?.description || ""}</div>

    <div class="tags">
      ${(resource.tags || []).slice(0, 8).map(t => `<span class="pill clickable" data-tag="${t}">#${t}</span>`).join("")}
    </div>
  `;
  el.querySelector(".fav").addEventListener("click", (ev) => {
    ev.stopPropagation();
    toggleFav(resource.id);
    el.querySelector(".fav").classList.toggle("active", isFav(resource.id));
    toast(isFav(resource.id) ? "Adăugat la favorite" : "Scos din favorite");
    renderAll();
  });

  el.querySelectorAll("[data-tag]").forEach(chip => {
    chip.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const t = chip.dataset.tag;
      state.tag = (normalize(state.tag) === normalize(t)) ? "all" : t;
      renderAll();
      toast(state.tag === "all" ? "Filtru tag resetat" : `Filtrare: #${t}`);
      $("#tagsSection")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  el.querySelector('[data-open="modal"]').addEventListener("click", (ev) => {
    ev.preventDefault();
    openModal(resource);
  });

  return el;
}

function renderList(resources) {
  const grid = $("#grid");
  const count = $("#count");
  if (!grid) return;

  grid.innerHTML = "";
  resources.forEach(r => grid.appendChild(card(r)));

  if (count) count.textContent = `${resources.length} rezultate`;
}

function renderStudyOnly(resources) {
  const out = $("#studyOnly");
  if (!out) return;

  const study = resources.filter(r =>
    (r.tags || []).map(normalize).includes("studiu") ||
    normalize(r.type).includes("bibli") ||
    normalize(r.type).includes("spațiu de studiu")
  );

  out.innerHTML = study.slice(0, 3).map(r => `
    <div class="pill">📚 ${r.name} — ${r.location}</div>
  `).join("");

  if (!study.length) out.innerHTML = `<div class="pill">Niciun rezultat de studiu.</div>`;
}

function renderAll() {
  const resources = state.data?.resources || [];
  const filtered = resources.filter(matches);

  renderTags(resources);
  renderList(filtered);
  renderStudyOnly(resources);

  const q = $("#q");
  const type = $("#type");
  if (q && q.value !== state.query) q.value = state.query;
  if (type && type.value !== state.type) type.value = state.type;

  const favBtn = $("#favOnly");
  if (favBtn) {
    favBtn.classList.toggle("active", state.favOnly);
    favBtn.setAttribute("aria-pressed", state.favOnly ? "true" : "false");
    favBtn.textContent = state.favOnly ? "⭐ Favorite (ON)" : "⭐ Favorite";
  }
}
function getJsonUrl() {
  return location.pathname.includes("/pages/") ? "../data/resources.json" : "data/resources.json";
}

function showSkeleton(show) {
  const sk = $("#skeleton");
  const grid = $("#grid");
  if (!sk || !grid) return;

  if (show) {
    sk.style.display = "";
    grid.style.display = "none";
    sk.innerHTML = Array.from({ length: 6 }).map(() => `<div class="card"></div>`).join("");
  } else {
    sk.style.display = "none";
    grid.style.display = "";
    sk.innerHTML = "";
  }
}

async function loadData() {
  const status = $("#status");
  try {
    showSkeleton(true);
    const res = await fetch(getJsonUrl());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.data = await res.json();

    if (status) status.textContent = `Actualizat: ${state.data.updatedAt}`;
    renderAll();
  } catch (e) {
    console.error(e);
    if (status) status.textContent = "Eroare la încărcarea datelor (pornește un server local).";
    toast("Nu pot încărca JSON. Rulează cu Live Server.");
  } finally {
    showSkeleton(false);
  }
}
function setupControls() {
  const q = $("#q");
  const type = $("#type");
  const clear = $("#clear");
  const jump = $("#jumpTags");
  const theme = $("#theme");
  const favOnly = $("#favOnly");

  if (q) {
    q.addEventListener("input", (e) => {
      state.query = e.target.value;
      renderAll();
    });

    window.addEventListener("keydown", (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        q.focus();
      }
    });
  }

  if (type) {
    type.addEventListener("change", (e) => {
      state.type = e.target.value;
      renderAll();
      toast(state.type === "all" ? "Tip: toate" : `Tip: ${state.type}`);
    });
  }

  if (favOnly) {
    favOnly.addEventListener("click", () => {
      state.favOnly = !state.favOnly;
      renderAll();
      toast(state.favOnly ? "Afișez doar favorite" : "Afișez toate resursele");
    });
  }

  if (clear) {
    clear.addEventListener("click", () => {
      state.query = "";
      state.type = "all";
      state.tag = "all";
      state.favOnly = false;
      renderAll();
      toast("Filtre resetate");
    });
  }

  if (jump) {
    jump.addEventListener("click", () => {
      $("#tagsSection")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (theme) {
    const saved = localStorage.getItem("cih-theme");
    if (saved === "light") document.body.classList.add("light");

    theme.addEventListener("click", () => {
      document.body.classList.toggle("light");
      const mode = document.body.classList.contains("light") ? "light" : "dark";
      localStorage.setItem("cih-theme", mode);
      toast(`Theme: ${mode}`);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
  setupControls();

  if ($("#grid")) loadData();
});