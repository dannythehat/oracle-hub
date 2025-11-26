const base = "https://dannythehat.github.io/oracle-hub/metrics";

async function fetchJSON(name) {
  const url = base + "/" + name + ".json?cacheBust=" + Date.now();
  console.log("Fetching:", url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to load " + name + ", status:", res.status);
    throw new Error("Failed to load " + name);
  }
  const data = await res.json();
  console.log("Loaded " + name + ":", data);
  return data;
}

function ensureLayout() {
  console.log("ensureLayout called");
  let root = document.getElementById("oracle-root");
  if (root) {
    console.log("oracle-root already exists, clearing it");
    root.innerHTML = "";
  } else {
    console.log("Creating oracle-root");
    root = document.createElement("div");
    root.id = "oracle-root";
    root.className = "oracle-root";
    document.body.appendChild(root);
  }

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
  html += "<p id='last-training-date'>Loading...</p>";
  html += "<p id='last-training-dataset'>Loading...</p>";
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
  console.log("Layout created and inserted into DOM");
  return root;
}

function renderStatus(data) {
  console.log("renderStatus called with:", data);
  if (!data) {
    console.error("No status data");
    return;
  }
  
  let statusText = document.getElementById("status-text");
  let notesList = document.getElementById("status-notes");
  
  if (!statusText) {
    console.error("status-text element not found!");
    return;
  }
  if (!notesList) {
    console.error("status-notes element not found!");
    return;
  }
  
  statusText.textContent = data.overall_status.toUpperCase() + " - last training " + data.last_training;
  notesList.innerHTML = "";
  (data.notes || []).forEach(function(n) {
    let li = document.createElement("li");
    li.textContent = n;
    notesList.appendChild(li);
  });
  console.log("Status rendered successfully");
}

function renderLastTraining(data) {
  console.log("renderLastTraining called with:", data);
  if (!data) {
    console.error("No training data");
    return;
  }
  
  let dateEl = document.getElementById("last-training-date");
  let datasetEl = document.getElementById("last-training-dataset");
  let listEl = document.getElementById("last-training-models");
  
  if (!dateEl || !datasetEl || !listEl) {
    console.error("Training elements not found!", {dateEl: !!dateEl, datasetEl: !!datasetEl, listEl: !!listEl});
    return;
  }
  
  dateEl.textContent = "Date: " + data.date;
  let ds = data.dataset;
  datasetEl.textContent = "Dataset: " + ds.path + " (" + ds.rows + " rows, " + ds.features + " features)";
  
  listEl.innerHTML = "";
  data.models.forEach(function(m) {
    let li = document.createElement("li");
    li.textContent = m.name + " - acc " + (m.accuracy * 100).toFixed(1) + "% - AUC " + m.auc.toFixed(3);
    listEl.appendChild(li);
  });
  console.log("Training data rendered successfully");
}

function renderModelsDeployed(data) {
  console.log("renderModelsDeployed called with:", data);
  if (!data || !data.models) {
    console.error("No models data");
    return;
  }
  
  let tbody = document.querySelector("#models-table tbody");
  if (!tbody) {
    console.error("models-table tbody not found!");
    return;
  }
  
  tbody.innerHTML = "";
  data.models.forEach(function(m) {
    let tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + m.market + "</td><td>" + m.version + "</td><td>" + m.file + "</td>" +
      "<td>" + (m.accuracy * 100).toFixed(1) + "%</td><td>" + m.auc.toFixed(3) + "</td>";
    tbody.appendChild(tr);
  });
  console.log("Models rendered successfully");
}

function renderAccuracy(data) {
  console.log("renderAccuracy called with:", data);
  if (!data || !data.points) {
    console.error("No accuracy data");
    return;
  }
  
  let tbody = document.querySelector("#accuracy-table tbody");
  if (!tbody) {
    console.error("accuracy-table tbody not found!");
    return;
  }
  
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
  console.log("Accuracy rendered successfully");
}

async function initHub() {
  console.log("initHub starting...");
  try {
    console.log("Creating layout...");
    ensureLayout();
    
    console.log("Waiting for DOM to be ready...");
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("Fetching all data...");
    const status = await fetchJSON("status");
    const last = await fetchJSON("last_training");
    const models = await fetchJSON("models_deployed");
    const acc = await fetchJSON("accuracy_30d");
    
    console.log("All data fetched, rendering...");
    renderStatus(status);
    renderLastTraining(last);
    renderModelsDeployed(models);
    renderAccuracy(acc);
    
    console.log("Hub initialized successfully!");
  } catch (e) {
    console.error("Hub Error:", e);
    console.error("Stack:", e.stack);
    alert("Hub Error: " + e.message + " - Check console for details");
  }
}

console.log("Script loaded, waiting for DOMContentLoaded...");
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded fired!");
    initHub();
  });
} else {
  console.log("DOM already loaded, initializing immediately");
  initHub();
}
