async function loadJSON(path, target) {
  try {
    const res = await fetch(path);
    const data = await res.json();
    document.getElementById(target).textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById(target).textContent = "No data available.";
  }
}

loadJSON("oracle_outputs/predictions.json", "pred");
loadJSON("oracle_outputs/golden_bets.json", "golden");
loadJSON("oracle_outputs/value_bets.json", "value");
