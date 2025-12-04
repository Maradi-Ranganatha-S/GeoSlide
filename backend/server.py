"""
GeoSlide AI - API Gateway (v4.5)
================================
Entry point for the REST API. Handles request validation, 
CORS pre-flight, and dispatching tasks to the Inference Engine.
"""

import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from inference_engine import GeoSlideEngine

# --- CONFIGURATION ---
PORT = int(os.getenv("PORT", 5000))
DEBUG_MODE = False 

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("API_Gateway")

# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app) 

logger.info("Initializing GeoSlide Inference Subsystem...")
try:
    engine = GeoSlideEngine(config_path="config.yaml")
except Exception as e:
    logger.critical(f"Failed to load AI Engine: {str(e)}")
    sys.exit(1)

# --- ROUTES ---

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    status = engine.get_status()
    return jsonify(status), 200
@app.route('/api/v1/predict', methods=['POST'])
def predict_hazard():
    try:
        data = request.json
        lat = data.get('lat')
        lon = data.get('lon')
        t1 = data.get('t1')
        t0 = data.get('t0')
        
        if not lat or not lon:
            return jsonify({"error": "Missing coordinates"}), 400
            
        logger.info(f"Received Inference Request: ROI [{lat}, {lon}]")

        # 1. RUN ENGINE
        # The engine logic handles all the delays and logs now
        result = engine.run_inference_pipeline(lat, lon, t1, t0)

        # 2. RETURN SERVER-CALCULATED MATH
        return jsonify({
            "status": "success",
            "data": result # This contains the backend-decided confidence
        }), 200

    except Exception as e:
        logger.error(f"Inference Failure: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == "__main__":
    print("\n" + "="*60)
    print(f"   GEOSLIDE AI CORE | LISTENING ON PORT {PORT}")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG_MODE)