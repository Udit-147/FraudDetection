# Sentinel — Fraud Detection UI

A polished Flask web app for your fraud detection model. It uses these model inputs in this exact order:

1. `amount`
2. `oldbalanceOrg`
3. `newbalanceOrig`
4. `oldbalanceDest`
5. `newbalanceDest`

The target is `isFraud`.

## Project layout

```text
sentinelai_fraud_detection/
├── app.py
├── Fraud_Detection_Model.pkl
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    └── js/app.js
```

## Run locally

1. Install Python 3.10 or newer.
2. Keep `Fraud_Detection_Model.pkl` in the same folder as `app.py`.
3. Open a terminal in this folder and run:

   ```bash
   python -m venv .venv
   ```

   Windows:
   ```bash
   .venv\Scripts\activate
   ```

   macOS/Linux:
   ```bash
   source .venv/bin/activate
   ```

4. Install dependencies and start the server:

   ```bash
   pip install -r requirements.txt
   python app.py
   ```

5. Open `http://127.0.0.1:5000`.

## Notes

- The `/api/predict` endpoint accepts JSON and returns the prediction.
- `/api/health` reports whether the model loaded successfully.
- Probability is displayed only if the model supports `predict_proba()`.
- The example values are placeholders for UI testing, not a verified real transaction.
- The app expects a scikit-learn-compatible model whose input feature order matches the five columns above. If you trained with a scaler or preprocessing pipeline, make sure that preprocessing is included in the saved model.
- Do not deploy a pickle file from an untrusted source. Pickle loading can execute code.
- For production deployment, turn off Flask debug mode, add authentication/rate limiting as appropriate, and do not treat model output as a final fraud determination.
