from flask import Flask, render_template, request, jsonify
from pathlib import Path
import pickle
import numpy as np

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "Fraud_Detection_Model.pkl"
FEATURES = ["amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]

def load_model():
    try:
        with MODEL_PATH.open("rb") as f:
            return pickle.load(f), None
    except Exception as exc:
        app.logger.error("Could not load model: %s", exc)
        return None, str(exc)

model, model_error = load_model()

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/health")
def health():
    return jsonify({
        "status": "ready" if model is not None else "model_missing",
        "model_loaded": model is not None
    }), 200 if model is not None else 503

@app.post("/api/predict")
def predict():
    if model is None:
        return jsonify({"success": False, "error":
            "Model file not loaded. Keep Fraud_Detection_Model.pkl beside app.py and restart Flask."}), 503

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Send the transaction fields as JSON."}), 400

    try:
        values = []
        for feature in FEATURES:
            raw = data.get(feature)
            if raw is None or str(raw).strip() == "":
                return jsonify({"success": False, "error": f"Please enter {feature}."}), 400
            value = float(raw)
            if not np.isfinite(value) or value < 0:
                return jsonify({"success": False, "error":
                    f"{feature} must be a valid non-negative number."}), 400
            values.append(value)

        row = np.array([values], dtype=float)
        prediction = int(np.asarray(model.predict(row)).reshape(-1)[0])

        risk_score = None
        if hasattr(model, "predict_proba"):
            try:
                probabilities = np.asarray(model.predict_proba(row))[0]
                classes = list(getattr(model, "classes_", range(len(probabilities))))
                fraud_index = classes.index(1) if 1 in classes else min(1, len(probabilities) - 1)
                risk_score = round(float(probabilities[fraud_index]) * 100, 2)
            except Exception:
                pass

        return jsonify({
            "success": True,
            "prediction": prediction,
            "label": "Potential fraud" if prediction == 1 else "Likely legitimate",
            "risk_score": risk_score,
            "message": ("The model flagged this transaction for review."
                        if prediction == 1 else
                        "The model did not flag this transaction as fraudulent.")
        })
    except (ValueError, TypeError) as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({"success": False, "error":
            "Prediction failed. Check that the model was trained with these five features in this exact order."}), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
