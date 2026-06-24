const state = {
  users: [],
  locations: [],
  animals: [],
  tasks: [],
  needs: [],
  reports: [],
  notifications: [],
  summary: null,
  currentUserId: Number(localStorage.getItem("patilink-user-id")) || 2,
  activeView: "dashboard"
};

const titles = {
  dashboard: "PatiLink Operasyon Paneli",
  animals: "Hayvan Portföyü",
  tasks: "Görev ve QR Takibi",
  needs: "İhtiyaç Yönetimi",
  admin: "Yönetim Paneli",
  contact: "Kampüs Bildirimi"
};

const viewIds = {
  dashboard: "dashboardView",
  animals: "animalsView",
  tasks: "tasksView",
  needs: "needsView",
  admin: "adminView",
  contact: "contactView"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", async () => {
  bindNavigation();
  bindForms();
  $("#refreshButton").addEventListener("click", load);
  $("#dialogClose").addEventListener("click", () => $("#animalDialog").close());
  await load();
});

async function load() {
  try {
    const [bootstrap, summary] = await Promise.all([
      api("/api/bootstrap"),
      api("/api/summary")
    ]);

    Object.assign(state, bootstrap, { summary });
    if (!state.users.some(user => user.id === state.currentUserId)) {
      state.currentUserId = state.users[0]?.id || 1;
    }

    fillSelects();
    render();
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "İşlem tamamlanamadı.");
  }

  return response.json();
}

function bindNavigation() {
  $$(".nav-item").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  $$("[data-jump]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.jump));
  });

  ["animalSearch", "facultyFilter", "urgencyFilter", "statusFilter"].forEach(id => {
    $(`#${id}`).addEventListener("input", renderAnimals);
  });

  $("#userSelect").addEventListener("change", event => {
    state.currentUserId = Number(event.target.value);
    localStorage.setItem("patilink-user-id", String(state.currentUserId));
    render();
  });
}

function bindForms() {
  $("#completeTaskForm").addEventListener("submit", async event => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    await submitAction(async () => {
      await api(`/api/tasks/${values.taskId}/complete`, {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser().id,
          qrCode: values.qrCode,
          note: values.note,
          photoUrl: ""
        })
      });
      event.currentTarget.reset();
      showAlert("Görev QR doğrulamasıyla tamamlandı.", "success");
    });
  });

  $("#needForm").addEventListener("submit", async event => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    await submitAction(async () => {
      await api("/api/needs", {
        method: "POST",
        body: JSON.stringify({
          animalId: Number(values.animalId),
          needType: values.needType,
          description: values.description,
          amount: values.amount,
          urgency: values.urgency
        })
      });
      event.currentTarget.reset();
      showAlert("İhtiyaç kaydı eklendi.", "success");
    });
  });

  $("#animalForm").addEventListener("submit", async event => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    await submitAction(async () => {
      await api("/api/animals", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          species: values.species,
          gender: values.gender,
          description: values.description,
          photoUrl: values.photoUrl,
          locationId: Number(values.locationId),
          careStatus: values.careStatus,
          urgency: values.urgency
        })
      });
      event.currentTarget.reset();
      showAlert("Hayvan portföyüne yeni kayıt eklendi.", "success");
    });
  });

  $("#taskForm").addEventListener("submit", async event => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    await submitAction(async () => {
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          animalId: Number(values.animalId),
          locationId: Number(values.locationId),
          taskType: values.taskType,
          assignedUserId: values.assignedUserId ? Number(values.assignedUserId) : null,
          dueAt: new Date(values.dueAt).toISOString(),
          note: values.note || ""
        })
      });
      event.currentTarget.reset();
      setDefaultDueDate();
      showAlert("Yeni görev oluşturuldu.", "success");
    });
  });

  $("#healthForm").addEventListener("submit", async event => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const veterinarian = state.users.find(user => user.role === "Veteriner") || currentUser();
    await submitAction(async () => {
      await api("/api/health-logs", {
        method: "POST",
        body: JSON.stringify({
          animalId: Number(values.animalId),
          veterinarianUserId: veterinarian.id,
          actionType: values.actionType,
          description: values.description,
          nextCheckDate: values.nextCheckDate ? new Date(values.nextCheckDate).toISOString() : null
        })
      });
      event.currentTarget.reset();
      showAlert("Sağlık kaydı eklendi.", "success");
    });
  });

  $("#reportForm").addEventListener("submit", async event => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    await submitAction(async () => {
      await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          reporterName: values.reporterName,
          email: values.email,
          subject: values.subject,
          message: values.message,
          locationId: values.locationId ? Number(values.locationId) : null
        })
      });
      event.currentTarget.reset();
      showAlert("Bildirim yönetici paneline iletildi.", "success");
    });
  });
}

async function submitAction(action) {
  try {
    await action();
    await load();
  } catch (error) {
    showAlert(error.message, "error");
  }
}

function fillSelects() {
  fillUserSelect();
  fillFacultySelect();
  fillAnimalSelects();
  fillLocationSelects();
  fillTaskSelect();
  setDefaultDueDate();
}

function fillUserSelect() {
  $("#userSelect").innerHTML = state.users
    .map(user => `<option value="${user.id}" ${user.id === state.currentUserId ? "selected" : ""}>${escapeHtml(user.fullName)} - ${escapeHtml(user.role)}</option>`)
    .join("");
}

function fillFacultySelect() {
  const faculties = ["Tümü", ...new Set(state.locations.map(location => location.faculty))];
  $("#facultyFilter").innerHTML = faculties.map(faculty => `<option>${escapeHtml(faculty)}</option>`).join("");
}

function fillAnimalSelects() {
  const options = state.animals
    .map(animal => `<option value="${animal.id}">${escapeHtml(animal.name)} - ${escapeHtml(animal.locationName)}</option>`)
    .join("");

  $$('select[name="animalId"]').forEach(select => {
    select.innerHTML = options;
  });
}

function fillLocationSelects() {
  const options = [
    '<option value="">Konumsuz</option>',
    ...state.locations.map(location => `<option value="${location.id}">${escapeHtml(location.name)}</option>`)
  ].join("");

  $$('select[name="locationId"]').forEach(select => {
    select.innerHTML = options;
  });
}

function fillTaskSelect() {
  const openTasks = state.tasks.filter(task => task.status !== "Tamamlandı");
  const options = openTasks
    .map(task => `<option value="${task.id}">${escapeHtml(task.taskType)} - ${escapeHtml(task.animalName)} (${escapeHtml(task.qrCode)})</option>`)
    .join("");

  $('#completeTaskForm select[name="taskId"]').innerHTML = options || '<option value="">Açık görev yok</option>';

  const assigneeOptions = [
    '<option value="">Atanmamış</option>',
    ...state.users.map(user => `<option value="${user.id}">${escapeHtml(user.fullName)} - ${escapeHtml(user.role)}</option>`)
  ].join("");
  $('#taskForm select[name="assignedUserId"]').innerHTML = assigneeOptions;
}

function setDefaultDueDate() {
  const input = $('#taskForm input[name="dueAt"]');
  if (!input.value) {
    const due = new Date(Date.now() + 2 * 60 * 60 * 1000);
    input.value = toLocalDateTimeInput(due);
  }
}

function render() {
  $("#viewTitle").textContent = titles[state.activeView];
  renderDashboard();
  renderAnimals();
  renderTasks();
  renderNeeds();
  renderReports();
}

function setView(view) {
  state.activeView = view;
  $$(".nav-item").forEach(button => button.classList.toggle("is-active", button.dataset.view === view));
  Object.entries(viewIds).forEach(([key, id]) => {
    $(`#${id}`).classList.toggle("is-active", key === view);
  });
  $("#viewTitle").textContent = titles[view];
}

function renderDashboard() {
  const summary = state.summary;
  if (!summary) return;

  const metrics = [
    ["Hayvan", summary.animalCount],
    ["Açık görev", summary.openTaskCount],
    ["Kritik hayvan", summary.criticalAnimalCount],
    ["Bekleyen ihtiyaç", summary.waitingNeedCount],
    ["Kırmızı nokta", summary.hungryLocationCount]
  ];

  $("#metricGrid").innerHTML = metrics
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");

  $("#urgentTasks").innerHTML = summary.urgentTasks.length
    ? summary.urgentTasks.map(renderTaskCard).join("")
    : empty("Acil görev bulunmuyor.");

  $("#recentLogs").innerHTML = summary.recentLogs.length
    ? summary.recentLogs.map(log => `
      <article class="item-card">
        <div class="item-card-head">
          <div>
            <h3>${escapeHtml(log.task)}</h3>
            <p>${escapeHtml(log.volunteer)} - ${formatDate(log.completedAt)}</p>
          </div>
          ${badge(log.qrVerified ? "QR onaylı" : "QR yok", log.qrVerified ? "ok" : "high")}
        </div>
        <p>${escapeHtml(log.note || "Not girilmedi.")}</p>
      </article>
    `).join("")
    : empty("Henüz QR işlem kaydı yok.");
}

function renderAnimals() {
  const search = $("#animalSearch").value.trim().toLocaleLowerCase("tr-TR");
  const faculty = $("#facultyFilter").value || "Tümü";
  const urgency = $("#urgencyFilter").value || "Tümü";
  const status = $("#statusFilter").value || "Tümü";

  const filtered = state.animals.filter(animal => {
    const matchesSearch = !search ||
      [animal.name, animal.species, animal.description, animal.locationName]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(search);
    const matchesFaculty = faculty === "Tümü" || animal.faculty === faculty;
    const matchesUrgency = urgency === "Tümü" || animal.urgency === urgency;
    const matchesStatus = status === "Tümü" || animal.careStatus === status;
    return matchesSearch && matchesFaculty && matchesUrgency && matchesStatus;
  });

  $("#animalGrid").innerHTML = filtered.length
    ? filtered.map(animal => `
      <article class="animal-card">
        <img src="${escapeAttr(animal.photoUrl)}" alt="${escapeAttr(animal.name)}" loading="lazy" />
        <div class="animal-card-body">
          <div class="animal-card-title">
            <h3>${escapeHtml(animal.name)}</h3>
            ${badge(animal.urgency, badgeClass(animal.urgency))}
          </div>
          <p>${escapeHtml(animal.description)}</p>
          <div class="meta-row">
            ${badge(animal.species)}
            ${badge(animal.careStatus, animal.careStatus === "Aç" ? "hungry" : "ok")}
            ${badge(animal.faculty)}
          </div>
          <button class="secondary-button" data-animal-detail="${animal.id}">Detay</button>
        </div>
      </article>
    `).join("")
    : empty("Filtrelere uygun hayvan kaydı bulunamadı.");

  $$("[data-animal-detail]").forEach(button => {
    button.addEventListener("click", () => openAnimalDetail(Number(button.dataset.animalDetail)));
  });
}

function renderTasks() {
  $("#taskList").innerHTML = state.tasks.length
    ? state.tasks.map(renderTaskCard).join("")
    : empty("Görev kaydı bulunmuyor.");

  $$("[data-assign-task]").forEach(button => {
    button.addEventListener("click", async () => {
      await submitAction(async () => {
        await api(`/api/tasks/${button.dataset.assignTask}/assign`, {
          method: "PATCH",
          body: JSON.stringify({ userId: currentUser().id })
        });
        showAlert("Görev aktif kullanıcıya atandı.", "success");
      });
    });
  });
}

function renderTaskCard(task) {
  const statusClass = task.status === "Tamamlandı" ? "ok" : task.isOverdue ? "overdue" : "high";
  return `
    <article class="item-card">
      <div class="item-card-head">
        <div>
          <h3>${escapeHtml(task.taskType)} - ${escapeHtml(task.animalName)}</h3>
          <p>${escapeHtml(task.locationName)} | ${escapeHtml(task.assignedUserName)}</p>
        </div>
        ${badge(task.status, statusClass)}
      </div>
      <div class="meta-row">
        ${badge(formatDate(task.dueAt), task.isOverdue ? "overdue" : "")}
        ${badge(task.qrCode)}
        ${badge(task.faculty)}
      </div>
      <p>${escapeHtml(task.note || "Görev notu yok.")}</p>
      ${task.status !== "Tamamlandı" ? `<button class="secondary-button" data-assign-task="${task.id}">Üstlen</button>` : ""}
    </article>
  `;
}

function renderNeeds() {
  $("#needList").innerHTML = state.needs.length
    ? state.needs.map(need => `
      <article class="need-row">
        <div>
          <strong>${escapeHtml(need.needType)} - ${escapeHtml(need.animalName)}</strong>
          <p>${escapeHtml(need.description)}</p>
        </div>
        <span>${escapeHtml(need.amount)}</span>
        ${badge(need.urgency, badgeClass(need.urgency))}
        ${badge(need.status, need.status === "Karşılandı" ? "ok" : "high")}
        <button class="secondary-button" data-need-done="${need.id}">Karşılandı</button>
      </article>
    `).join("")
    : empty("İhtiyaç kaydı bulunmuyor.");

  $$("[data-need-done]").forEach(button => {
    button.addEventListener("click", async () => {
      await submitAction(async () => {
        await api(`/api/needs/${button.dataset.needDone}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "Karşılandı" })
        });
        showAlert("İhtiyaç karşılandı olarak güncellendi.", "success");
      });
    });
  });
}

function renderReports() {
  $("#reportList").innerHTML = state.reports.length
    ? state.reports.map(report => `
      <article class="item-card">
        <div class="item-card-head">
          <div>
            <h3>${escapeHtml(report.subject)}</h3>
            <p>${escapeHtml(report.reporterName)} - ${formatDate(report.createdAt)}</p>
          </div>
          ${badge(report.status, "high")}
        </div>
        <p>${escapeHtml(report.message)}</p>
      </article>
    `).join("")
    : empty("Bildirim bulunmuyor.");
}

async function openAnimalDetail(id) {
  try {
    const detail = await api(`/api/animals/${id}`);
    const { animal, tasks, needs, healthLogs } = detail;
    $("#dialogTitle").textContent = animal.name;
    $("#animalDetail").innerHTML = `
      <div class="detail-grid">
        <img src="${escapeAttr(animal.photoUrl)}" alt="${escapeAttr(animal.name)}" />
        <div>
          <div class="meta-row">
            ${badge(animal.species)}
            ${badge(animal.careStatus, animal.careStatus === "Aç" ? "hungry" : "ok")}
            ${badge(animal.urgency, badgeClass(animal.urgency))}
            ${badge(animal.faculty)}
          </div>
          <p>${escapeHtml(animal.description)}</p>
          <h3>Görevler</h3>
          <div class="list-stack">${tasks.length ? tasks.map(renderTaskCard).join("") : empty("Bu hayvan için görev yok.")}</div>
          <h3>İhtiyaçlar</h3>
          <div class="meta-row">${needs.length ? needs.map(need => badge(`${need.needType}: ${need.status}`, badgeClass(need.urgency))).join("") : badge("İhtiyaç yok", "ok")}</div>
          <h3>Sağlık Geçmişi</h3>
          <div class="list-stack">
            ${healthLogs.length ? healthLogs.map(log => `
              <article class="item-card">
                <strong>${escapeHtml(log.actionType)}</strong>
                <p>${escapeHtml(log.description)} - ${formatDate(log.actionDate)}</p>
              </article>
            `).join("") : empty("Sağlık kaydı yok.")}
          </div>
        </div>
      </div>
    `;
    $("#animalDialog").showModal();
  } catch (error) {
    showAlert(error.message, "error");
  }
}

function currentUser() {
  return state.users.find(user => user.id === state.currentUserId) || state.users[0] || { id: 1, fullName: "Demo Kullanıcı" };
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function showAlert(message, type = "success") {
  const host = $("#alertHost");
  host.innerHTML = `<div class="alert ${type}">${escapeHtml(message)}</div>`;
  window.setTimeout(() => {
    if (host.textContent === message) host.innerHTML = "";
  }, 4200);
}

function badge(text, className = "") {
  return `<span class="badge ${className}">${escapeHtml(String(text || "-"))}</span>`;
}

function badgeClass(value) {
  if (value === "Kritik") return "critical";
  if (value === "Yüksek") return "high";
  return "ok";
}

function empty(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function formatDate(value) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function toLocalDateTimeInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
