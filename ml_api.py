import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from predict_category import AdClassifier
import os

app = FastAPI(title="Ad Category Predictor")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize classifier
# Check if model exists, otherwise we might need to train it or handle the error
MODEL_PATH = "./ad_classifier"
classifier = None

try:
    if os.path.exists(MODEL_PATH):
        classifier = AdClassifier(model_path=MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
    else:
        print(f"Warning: Model not found at {MODEL_PATH}. Prediction endpoint will fail.")
except Exception as e:
    print(f"Error loading model: {e}")

class AdInput(BaseModel):
    title: str
    description: str

@app.get("/")
def read_root():
    return {"status": "online", "model_loaded": classifier is not None}

@app.post("/predict-category")
def predict_category(ad: AdInput):
    if classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train the model first.")
    
    try:
        result = classifier.predict(ad.title, ad.description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("ml_api:app", host="0.0.0.0", port=8000, reload=True)
