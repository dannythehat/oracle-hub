const base = "https://dannythehat.github.io/oracle-hub/metrics";

async function fetchJSON(name) {
  const url = base + "/" + name + ".json?cacheBust=" + Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load " + name);
  return res.json();
}

function ensureLayout() {
  let root = document.getElementById("oracle-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "oracle-root";
    root.className = "oracle-root";

    let html = "";
    html += "<header class='hub-header'>";
    html += "<h1>Footy Oracle - LM Training Hub</h1>";
    html += "<p class='subtitle'>Live v27 Anti Leak Models</p>";
    html += "</header>";

    html += "<main class='hub-main'>";

    html += "<section class='card' id='status-card'>";
    html += "<h2>System Status</h2>";
    html += "<p id='status-text'>Loading...</p>";
    html += "<ul id='status-notes'></ul>";
    html += "</section>";

    html += "<section class='card' id='training-card'>";
    html += "<h2>Last Training Run</h2>";
    html += "<p id='last-training-date'></p>";
    html += "<p id='last-training-dataset'></p>";
    html += "<ul id='last-training-models'></ul>";
    html += "</section>";

    html += "<section class='card' id='models-card'>";
    html += "<h2>Models Deployed (v27)</h2>";
    html += "<table id='models-table'><thead><tr>";
    html += "<th>Market</th><th>Version</th><th>PKL</th><th>Accuracy</th><th>AUC</th>";
    html += "</tr></thead><tbody></tbody></table>";
    html += "</section>";

    html += "<section class='card' id='accuracy-card'>";
    html += "<h2>Last 30 Days - Accuracy</h2>";
    html += "<table id='accuracy-table'><thead><tr>";
    html += "<th>Date</th><th>Over 2.5</th><th>BTTS</th><th>Corners 9.5</th><th>Cards 3.5</th>";
    html += "</tr></thead><tbody></tbody></table>";
    html += "</section>";

    html += "</main>";

    root.innerHTML = html;
    document.body.appendChild(root);
  }
  return root;
}

function renderStatus(data) {
  let statusText = document.getElementById("status-text");
  let notesList = document.getElementById("status-notes");
  if (!data) return;
  statusText.textContent = data.overall_status.toUpperCase() + " - last training " + data.last_training;
  notesList.innerHTML = "";
  (data.notes || []).forEach(function(n) {
    let li = document.createElement("li");
    li.textContent = n;
    notesList.appendChild(li);
  });
}

function renderLastTraining(data) {
  if (!data) return;
  document.getElementById("last-training-date").textContent = "Date: " + data.date;
  let ds = data.dataset;
  document.getElementById("last-training-dataset").textContent =
    "Dataset: " + ds.path + " (" + ds.rows + " rows, " + ds.features + " features)";
  let list = document.getElementById("last-training-models");
  list.innerHTML = "";
  data.models.forEach(function(m) {
    let li = document.createElement("li");
    li.textContent = m.name + " - acc " + (m.accuracy * 100).toFixed(1) + "% - AUC " + m.auc.toFixed(3);
    list.appendChild(li);
  });
}

function renderModelsDeployed(data) {
  let tbody = document.querySelector("#models-table tbody");
  tbody.innerHTML = "";
  data.models.forEach(function(m) {
    let tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + m.market + "</td><td>" + m.version + "</td><td>" + m.file + "</td>" +
      "<td>" + (m.accuracy * 100).toFixed(1) + "%</td><td>" + m.auc.toFixed(3) + "</td>";
    tbody.appendChild(tr);
  });
}

function renderAccuracy(data) {
  let tbody = document.querySelector("#accuracy-table tbody");
  tbody.innerHTML = "";
  data.points.forEach(function(p) {
    let tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + p.date + "</td>" +
      "<td>" + (p.over25 * 100).toFixed(1) + "%</td>" +
      "<td>" + (p.btts * 100).toFixed(1) + "%</td>" +
      "<td>" + (p.corners_over95 * 100).toFixed(1) + "%</td>" +
      "<td>" + (p.cards_over35 * 100).toFixed(1) + "%</td>";
    tbody.appendChild(tr);
  });
}

async function initHub() {
  ensureLayout();
  try {
    const status = await fetchJSON("status");
    const last = await fetchJSON("last_training");
    const models = await fetchJSON("models_deployed");
    const acc = await fetchJSON("accuracy_30d");
    renderStatus(status);
    renderLastTraining(last);
    renderModelsDeployed(models);
    renderAccuracy(acc);
  } catch (e) {
    console.error("Hub Error", e);
  }
}

document.addEventListener("DOMContentLoaded", initHub);
