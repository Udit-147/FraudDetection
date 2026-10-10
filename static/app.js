const form = document.getElementById("fraud-form");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const formError = document.getElementById("form-error");
const emptyState = document.getElementById("empty-state");
const resultState = document.getElementById("result-state");
let checks = 0;

document.getElementById("current-date").textContent = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric"
}).format(new Date());

async function checkModel() {
  const status = document.getElementById("model-status");
  const tag = document.getElementById("engine-tag");
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    if (data.model_loaded) {
      status.textContent = "Model connected";
      tag.textContent = "READY";
      tag.style.background = "#e8f4eb";
      tag.style.color = "#4e8660";
    } else {
      status.textContent = "Model file not found";
      tag.textContent = "OFFLINE";
      tag.style.background = "#faeae7";
      tag.style.color = "#b74e40";
    }
  } catch (_) {
    status.textContent = "API unavailable";
    tag.textContent = "OFFLINE";
  }
}
checkModel();

document.getElementById("sample-btn").addEventListener("click", () => {
  const sample = {
    amount: 2500,
    oldbalanceOrg: 12000,
    newbalanceOrig: 9500,
    oldbalanceDest: 4000,
    newbalanceDest: 6500
  };
  Object.entries(sample).forEach(([key, value]) => {
    document.getElementById(key).value = value;
  });
  formError.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";
  const payload = {};
  for (const key of ["amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]) {
    const input = document.getElementById(key);
    const raw = input.value.trim();
    if (!raw) {
      formError.textContent = `Please enter ${input.labels[0].textContent.replace("*", "").trim().toLowerCase()}.`;
      input.focus();
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      formError.textContent = "Please enter valid, non-negative numbers in every field.";
      input.focus();
      return;
    }
    payload[key] = value;
  }

  submitBtn.disabled = true;
  submitLabel.textContent = "Assessing…";
  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Could not assess this transaction.");
    checks += 1;
    document.getElementById("check-count").textContent = checks;
    showResult(data);
  } catch (error) {
    formError.textContent = error.message || "Something went wrong. Please try again.";
    checkModel();
  } finally {
    submitBtn.disabled = false;
    submitLabel.textContent = "Assess transaction";
  }
});

function showResult(data) {
  emptyState.classList.add("hidden");
  resultState.classList.remove("hidden");
  const isFraud = Number(data.prediction) === 1;
  resultState.classList.toggle("is-fraud", isFraud);
  document.getElementById("result-icon").textContent = isFraud ? "!" : "✓";
  document.getElementById("result-overline").textContent = isFraud ? "REVIEW RECOMMENDED" : "MODEL ASSESSMENT";
  document.getElementById("result-title").textContent = isFraud ? "Flagged for review" : "No fraud flag raised";
  document.getElementById("result-message").textContent = data.message;
  document.getElementById("prediction-value").textContent = `${data.prediction} · ${data.label}`;
  const riskValue = document.getElementById("risk-value");
  const riskBar = document.getElementById("risk-bar");
  if (data.risk_score !== null && data.risk_score !== undefined && Number.isFinite(Number(data.risk_score))) {
    const score = Math.max(0, Math.min(100, Number(data.risk_score)));
    riskValue.textContent = `${score.toFixed(2)}%`;
    riskBar.style.width = `${score}%`;
    riskBar.classList.toggle("high", score >= 50);
    document.getElementById("risk-note").textContent = "Model probability for the fraud class; not a guarantee.";
  } else {
    riskValue.textContent = "Not available";
    riskBar.style.width = "0%";
    riskBar.classList.remove("high");
    document.getElementById("risk-note").textContent = "This model does not expose a probability score. The label above is its prediction.";
  }
  resultState.scrollIntoView({behavior: "smooth", block: "nearest"});
}

document.getElementById("reset-btn").addEventListener("click", () => {
  resultState.classList.add("hidden");
  emptyState.classList.remove("hidden");
  formError.textContent = "";
  form.reset();
});
