async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error("Failed to load", path, err);
    return null;
  }
}

function setSystemStatus(status) {
  const dot = document.getElementById("system-status-dot");
  const text = document.getElementById("system-status-text");
  const lastTraining = document.getElementById("last-training-time");
  const modelsDeployed = document.getElementById("models-deployed");
  const nextTraining = document.getElementById("next-training-time");

  if (!status) {
    dot.style.background = "#f97316";
    dot.style.boxShadow = "0 0 10px rgba(249, 115, 22, 0.8)";
    text.textContent = "No status data";
    return;
  }

  if (status.system_status === "online") {
    dot.style.background = "#22c55e";
    dot.style.boxShadow = "0 0 10px rgba(34, 197, 94, 0.9)";
    text.textContent = "Online · " + (status.environment || "prod");
  } else {
    dot.style.background = "#f97316";
    dot.style.boxShadow = "0 0 10px rgba(249, 115, 22, 0.9)";
    text.textContent = status.system_status || "Degraded";
  }

  lastTraining.textContent = status.last_training || "–";
  modelsDeployed.textContent = status.models_deployed ?? "–";
  if (status.next_training_utc) {
    nextTraining.textContent = status.next_training_utc + " UTC";
  }
}

function renderBabyCards(accuracyData, aucData) {
  const grid = document.getElementById("baby-grid");
  grid.innerHTML = "";

  const models = ["over25", "btts", "corners_over95", "cards_over35"];
  const names = {
    over25: "Over 2.5 Goals",
    btts: "BTTS",
    corners_over95: "Corners 9.5+",
    cards_over35: "Cards 3.5+"
  };

  models.forEach((m) => {
    const acc = accuracyData?.current?.[m];
    const auc = aucData?.current?.[m];

    const card = document.createElement("div");
    card.className = "oh-baby-card";

    card.innerHTML = `
      <div class="oh-baby-header">
        <div class="oh-baby-name">${names[m] || m}</div>
        <div class="oh-baby-tag">Production</div>
      </div>
      <div class="oh-baby-metrics">
        <div>
          <div class="oh-baby-metric-label">Accuracy</div>
          <div class="oh-baby-metric-value">${acc != null ? (acc * 100).toFixed(1) + "%" : "–"}</div>
        </div>
        <div>
          <div class="oh-baby-metric-label">AUC</div>
          <div class="oh-baby-metric-value">${auc != null ? auc.toFixed(3) : "–"}</div>
        </div>
      </div>
      <div class="oh-baby-chip-row">
        <div class="oh-baby-chip">ID: ${m}</div>
        <div class="oh-baby-chip">Role: Core LM Baby</div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function renderTimeline(history) {
  const root = document.getElementById("training-timeline");
  root.innerHTML = "";

  if (!history || !Array.isArray(history.days)) {
    root.textContent = "No training history yet.";
    return;
  }

  history.days.forEach((day) => {
    const dayBlock = document.createElement("div");
    dayBlock.className = "oh-timeline-day";

    const dateLabel = document.createElement("div");
    dateLabel.className = "oh-timeline-date";
    dateLabel.textContent = day.date || "Unknown date";

    const itemsWrap = document.createElement("div");
    itemsWrap.className = "oh-timeline-items";

    (day.events || []).forEach((ev) => {
      const item = document.createElement("div");
      const cls = ["oh-timeline-item"];
      if (ev.severity === "good") cls.push("oh-timeline-item--positive");
      if (ev.severity === "bad") cls.push("oh-timeline-item--negative");
      item.className = cls.join(" ");

      const badge = document.createElement("span");
      badge.className = "oh-timeline-badge";
      badge.textContent = (ev.type || "event").toUpperCase();

      const text = document.createElement("span");
      text.textContent = " " + (ev.message || "");

      item.appendChild(badge);
      item.appendChild(text);
      itemsWrap.appendChild(item);
    });

    dayBlock.appendChild(dateLabel);
    dayBlock.appendChild(itemsWrap);
    root.appendChild(dayBlock);
  });
}

function renderVersionHistory(versions) {
  const root = document.getElementById("version-history");
  root.innerHTML = "";

  if (!versions || !Array.isArray(versions.models)) {
    root.textContent = "No deployment history yet.";
    return;
  }

  versions.models.forEach((row) => {
    const item = document.createElement("div");
    item.className = "oh-version-item";

    const left = document.createElement("div");
    left.className = "oh-version-left";

    const label = document.createElement("div");
    label.className = "oh-version-label";
    label.textContent = row.model_name || row.id || "Unknown model";

    const ver = document.createElement("div");
    ver.textContent = "v" + (row.version || "0");

    left.appendChild(label);
    left.appendChild(ver);

    const tag = document.createElement("div");
    let cls = "oh-version-tag";
    if (row.status === "improved") cls += " oh-version-tag--improved";
    if (row.status === "fallback") cls += " oh-version-tag--fallback";
    tag.className = cls;
    tag.textContent = row.status || "stable";

    item.appendChild(left);
    item.appendChild(tag);
    root.appendChild(item);
  });
}

function buildLineDataset(label, color, data) {
  return {
    label,
    data,
    tension: 0.35,
    fill: false,
    borderColor: color,
    pointRadius: 0,
    borderWidth: 2
  };
}

function renderCharts(accuracyHistory, aucHistory) {
  const accCtx = document.getElementById("accuracyChart").getContext("2d");
  const aucCtx = document.getElementById("aucChart").getContext("2d");

  const labels = accuracyHistory?.dates || [];
  const accSeries = accuracyHistory?.series || {};
  const aucSeries = aucHistory?.series || {};

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#e5e7eb",
          font: { size: 10 }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af", maxRotation: 0, autoSkip: true },
        grid: { color: "rgba(55,65,81,0.4)" }
      },
      y: {
        ticks: { color: "#9ca3af", callback: (v) => v + "" },
        grid: { color: "rgba(55,65,81,0.4)" }
      }
    }
  };

  new Chart(accCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        buildLineDataset("Over 2.5", "#a855ff", accSeries.over25 || []),
        buildLineDataset("BTTS", "#22c55e", accSeries.btts || []),
        buildLineDataset("Corners 9.5+", "#38bdf8", accSeries.corners_over95 || []),
        buildLineDataset("Cards 3.5+", "#f97316", accSeries.cards_over35 || [])
      ]
    },
    options: chartOptions
  });

  new Chart(aucCtx, {
    type: "line",
    data: {
      labels: aucHistory?.dates || labels,
      datasets: [
        buildLineDataset("Over 2.5", "#a855ff", (aucSeries.over25 || []).map(x => x)),
        buildLineDataset("BTTS", "#22c55e", (aucSeries.btts || []).map(x => x)),
        buildLineDataset("Corners 9.5+", "#38bdf8", (aucSeries.corners_over95 || []).map(x => x)),
        buildLineDataset("Cards 3.5+", "#f97316", (aucSeries.cards_over35 || []).map(x => x))
      ]
    },
    options: chartOptions
  });
}

async function initOracleHub() {
  const base = "https://dannythehat.github.io/oracle-hub/metrics";

  const [status, acc, auc, history, versions] = await Promise.all([
    loadJSON(base + "/system_status.json"),
    loadJSON(base + "/accuracy.json"),
    loadJSON(base + "/auc.json"),
    loadJSON(base + "/training_history.json"),
    loadJSON(base + "/model_versions.json")
  ]);

  setSystemStatus(status);
  renderBabyCards(acc, auc);
  renderTimeline(history);
  renderVersionHistory(versions);
  renderCharts(acc?.history || null, auc?.history || null);
}

document.addEventListener("DOMContentLoaded", initOracleHub);
