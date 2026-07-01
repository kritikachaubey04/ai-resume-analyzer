import os
import io
import re
import json
import time
import pdfplumber
from google import genai
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Initialize the 2026 GenAI Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

user_context = {"resume_text": ""}

# MAY 2026 MODEL LIST (Ordered by speed/availability)
MODELS_TO_TRY = [
    "gemini-3.1-flash-lite", # Newest, fastest 2026 model
    "gemini-3.1-flash",      # Standard 2026 model
    "gemini-2.5-flash"       # Reliable 2025/26 bridge model
]

@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    try:
        # Extract Text
        pdf_bytes = await file.read()
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            text = " ".join([page.extract_text() for page in pdf.pages if page.extract_text()])
        
        user_context["resume_text"] = text
        prompt = f"Analyze Resume: {text[:4000]} vs JD: {job_description[:2000]}. Return JSON: {{'score': 85, 'missing_keywords': [], 'tips': [], 'original_bullet': '', 'rewritten_bullet': ''}}"

        # SMART MODEL PICKER: Tries models until one works
        response = None
        last_error = ""
        
        for model_name in MODELS_TO_TRY:
            try:
                print(f"DEBUG: Trying {model_name}...")
                response = client.models.generate_content(model=model_name, contents=prompt)
                if response:
                    print(f"SUCCESS: Using {model_name}")
                    break
            except Exception as e:
                last_error = str(e)
                print(f"SKIP: {model_name} failed: {last_error}")
                continue
        
        if not response:
            raise ValueError(f"All models failed. Last error: {last_error}")

        # Robust JSON Parse
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        return json.loads(json_match.group())

    except Exception as e:
        print(f"FINAL TERMINAL ERROR: {e}")
        return {"score": 0, "tips": [f"System Error: {str(e)}"], "missing_keywords": ["Update Required"]}

@app.post("/chat")
async def chat(message: str = Form(...)):
    try:
        # Uses the top-tier 2026 model for chat
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=f"Context: {user_context.get('resume_text', 'None')}. User: {message}"
        )
        return {"reply": response.text}
    except Exception:
        return {"reply": "Coach is temporarily offline."}