const base = "https://dannythehat.github.io/oracle-hub/metrics";

async function fetchJSON(name) {
  const url = base + "/" + name + ".json?cacheBust=" + Date.now();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load " + name + " from " + url);
  }
  return res.json();
}

function ensureLayout() {
  let root = document.getElementById("oracle-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "oracle-root";
    root.className = "oracle-root";
    root.innerHTML = [
      '<header class="hub-header">',
      '<h1>Footy Oracle - LM Training Hub</h1>',
      '<p class="subtitle">Live v27 anti-leak LM models</p>',
      '</header>',
      '',
      '<main class="hub-main">',
      '',
      '<section class="card" id="status-card">',
      '<h2>System Status</h2>',
      '<p id="status-text">Loading...</p>',
      '<ul id="status-notes"></ul>',
      '</section>',
      '',
      '<section class="card" id="training-card">',
      '<h2>Last Training Run</h2>',
      '<p id="last-training-date"></p>',
      '<p id="last-training-dataset"></p>',
      '<ul id="last-training-models"></ul>',
      '</section>',
      '',
      '<section class="card" id="models-card">',
      '<h2>Models Deployed (v27)</h2>',
      '<table id="models-table">',
      '<thead>',
      '<tr>',
      '<th>Market</th>',
      '<th>Version</th>',
      '<th>PKL</th>',
      '<th>Accuracy</th>',
      '<th>AUC</th>',
      '</tr>',
      '</thead>',
      '<tbody></tbody>',
      '</table>',
      '</section>',
      '',
      '<section class="card" id="accuracy-card">',
      '<h2>Last 30 Days - Accuracy</h2>',
      '<table id="accuracy-table">',
      '<thead>',
      '<tr>',
      '<th>Date</th>',
      '<th>Over 2.5</th>',
      '<th>BTTS</th>',
      '<th>Corners 9.5</th>',
      '<th>Cards 3.5</th>',
      '</tr>',
      '</thead>',
      '<tbody></tbody>',
      '</table>',
      '</section>',
      '',
      '</main>'
    ].join("");
    document.body.appendChild(root);
  }
  return root;
}

function renderStatus(data) {
  const statusText = document.getElementById("status-text");
  const notesList = document.getElementById("status-notes");
  if (!data || !statusText || !notesList) return;

  const label = data.overall_status || "unknown";
  const last = data.last_training || "n/a";
  statusText.textContent = label.toUpperCase() + " - last training " + last;

  notesList.innerHTML = "";
  (data.notes || []).forEach(function(n) {
    const li = document.createElement("li");
    li.textContent = n;
    notesList.appendChild(li);
  });
}

function renderLastTraining(data) {
  const dateEl = document.getElementById("last-training-date");
  const dsEl = document.getElementById("last-training-dataset");
  const modelsList = document.getElementById("last-training-models");
  if (!data || !dateEl || !dsEl || !modelsList) return;

  dateEl.textContent = "Date: " + (data.date || "n/a");

  if (data.dataset) {
    const ds = data.dataset;
    dsEl.textContent =
      "Dataset: " + ds.path + " (" + ds.rows + " rows, " + ds.features + " features)";
  }

  modelsList.innerHTML = "";
  (data.models || []).forEach(function(m) {
    const li = document.createElement("li");
    const acc =
      m.accuracy != null ? (m.accuracy * 100).toFixed(1) + "%" : "n/a";
    const auc = m.auc != null ? m.auc.toFixed(3) : "n/a";
    li.textContent = m.name + " - acc " + acc + " - AUC " + auc;
    modelsList.appendChild(li);
  });
}

function renderModelsDeployed(data) {
  const tbody = document.querySelector("#models-table tbody");
  if (!data || !tbody) return;

  tbody.innerHTML = "";
  (data.models || []).forEach(function(m) {
    const acc =
      m.accuracy != null ? (m.accuracy * 100).toFixed(1) + "%" : "n/a";
    const auc = m.auc != null ? m.auc.toFixed(3) : "n/a";

    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + m.market + "</td>" +
      "<td>" + m.version + "</td>" +
      "<td>" + m.file + "</td>" +
      "<td>" + acc + "</td>" +
      "<td>" + auc + "</td>";
    tbody.appendChild(tr);
  });
}

function renderAccuracy(data) {
  const tbody = document.querySelector("#accuracy-table tbody");
  if (!data || !tbody) return;

  tbody.innerHTML = "";
  (data.points || []).forEach(function(p) {
    const tr = document.createElement("tr");
    const over25 =
      p.over25 != null ? (p.over25 * 100).toFixed(1) + "%" : "n/a";
    const btts =
      p.btts != null ? (p.btts * 100).toFixed(1) + "%" : "n/a";
    const corners =
      p.corners_over95 != null ? (p.corners_over95 * 100).toFixed(1) + "%" : "n/a";
    const cards =
      p.cards_over35 != null ? (p.cards_over35 * 100).toFixed(1) + "%" : "n/a";

    tr.innerHTML =
      "<td>" + p.date + "</td>" +
      "<td>" + over25 + "</td>" +
      "<td>" + btts + "</td>" +
      "<td>" + corners + "</td>" +
      "<td>" + cards + "</td>";
    tbody.appendChild(tr);
  });
}

async function initHub() {
  ensureLayout();
  try {
    const results = await Promise.all([
      fetchJSON("status"),
      fetchJSON("last_training"),
      fetchJSON("models_deployed"),
      fetchJSON("accuracy_30d")
    ]);

    renderStatus(results[0]);
    renderLastTraining(results[1]);
    renderModelsDeployed(results[2]);
    renderAccuracy(results[3]);
  } catch (err) {
    console.error("Oracle Hub load error:", err);
    const statusText = document.getElementById("status-text");
    if (statusText) {
      statusText.textContent = "Error loading metrics.";
    }
  }
}

document.addEventListener("DOMContentLoaded", initHub);
