const base = "https://dannythehat.github.io/oracle-hub/metrics";

async function fetchJSON(name) {
  const url = base + "/" + name + ".json?t=" + Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load " + name);
  return res.json();
}

function buildHTML(status, training, models, accuracy) {
  let html = "";
  
  // Header
  html += "<header class='hub-header'>";
  html += "<h1>Footy Oracle - LM Training Hub</h1>";
  html += "<p class='subtitle'>Live v27 Anti Leak Models</p>";
  html += "</header>";
  
  html += "<main class='hub-main'>";
  
  // Status Card
  html += "<section class='card'>";
  html += "<h2>System Status</h2>";
  html += "<p><strong>" + status.overall_status.toUpperCase() + "</strong> - last training " + status.last_training + "</p>";
  html += "<ul>";
  status.notes.forEach(function(note) {
    html += "<li>" + note + "</li>";
  });
  html += "</ul>";
  html += "</section>";
  
  // Training Card
  html += "<section class='card'>";
  html += "<h2>Last Training Run</h2>";
  html += "<p><strong>Date:</strong> " + training.date + "</p>";
  html += "<p><strong>Dataset:</strong> " + training.dataset.path + " (" + training.dataset.rows + " rows, " + training.dataset.features + " features)</p>";
  html += "<ul>";
  training.models.forEach(function(m) {
    html += "<li>" + m.name + " - acc " + (m.accuracy * 100).toFixed(1) + "% - AUC " + m.auc.toFixed(3) + "</li>";
  });
  html += "</ul>";
  html += "</section>";
  
  // Models Card
  html += "<section class='card'>";
  html += "<h2>Models Deployed (v27)</h2>";
  html += "<table><thead><tr>";
  html += "<th>Market</th><th>Version</th><th>PKL</th><th>Accuracy</th><th>AUC</th>";
  html += "</tr></thead><tbody>";
  models.models.forEach(function(m) {
    html += "<tr>";
    html += "<td>" + m.market + "</td>";
    html += "<td>" + m.version + "</td>";
    html += "<td>" + m.file + "</td>";
    html += "<td>" + (m.accuracy * 100).toFixed(1) + "%</td>";
    html += "<td>" + m.auc.toFixed(3) + "</td>";
    html += "</tr>";
  });
  html += "</tbody></table>";
  html += "</section>";
  
  // Accuracy Card
  html += "<section class='card'>";
  html += "<h2>Last 30 Days - Accuracy</h2>";
  html += "<table><thead><tr>";
  html += "<th>Date</th><th>Over 2.5</th><th>BTTS</th><th>Corners 9.5</th><th>Cards 3.5</th>";
  html += "</tr></thead><tbody>";
  accuracy.points.forEach(function(p) {
    html += "<tr>";
    html += "<td>" + p.date + "</td>";
    html += "<td>" + (p.over25 * 100).toFixed(1) + "%</td>";
    html += "<td>" + (p.btts * 100).toFixed(1) + "%</td>";
    html += "<td>" + (p.corners_over95 * 100).toFixed(1) + "%</td>";
    html += "<td>" + (p.cards_over35 * 100).toFixed(1) + "%</td>";
    html += "</tr>";
  });
  html += "</tbody></table>";
  html += "</section>";
  
  html += "</main>";
  
  return html;
}

async function initHub() {
  try {
    // Show loading
    document.body.innerHTML = "<div style='text-align:center;padding:50px;color:#fff;'>Loading Oracle Hub...</div>";
    
    // Fetch all data
    const status = await fetchJSON("status");
    const training = await fetchJSON("last_training");
    const models = await fetchJSON("models_deployed");
    const accuracy = await fetchJSON("accuracy_30d");
    
    // Build complete HTML
    const html = buildHTML(status, training, models, accuracy);
    
    // Create root and insert
    const root = document.createElement("div");
    root.id = "oracle-root";
    root.className = "oracle-root";
    root.innerHTML = html;
    
    // Replace body content
    document.body.innerHTML = "";
    document.body.appendChild(root);
    
  } catch (e) {
    document.body.innerHTML = "<div style='text-align:center;padding:50px;color:#f44336;'>" +
      "<h1>Hub Error</h1>" +
      "<p>" + e.message + "</p>" +
      "<p>Check browser console for details</p>" +
      "</div>";
    console.error("Hub Error:", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHub);
} else {
  initHub();
}
