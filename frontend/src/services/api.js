// src/services/api.js

const API_BASE_URL = "http://127.0.0.1:5000/api/v1";

/**
 * 1. CHECKS IF PYTHON IS ALIVE
 */
export const checkBackendStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json(); // Returns { status: "online", gpu: true }
  } catch (error) {
    console.warn("Backend Offline", error);
    return null;
  }
};

/**
 * 2. SEND COORDINATES -> GET SCORES
 * This is the crucial function. It sends Lat/Lon to Python.
 * It waits for Python to run "Random Forest" and return the scores.
 */
export const runInference = async (lat, lon, datePre, datePost) => {
  const payload = {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    t1: datePre,
    t0: datePost
  };

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    // This JSON contains the "Expert" scores calculated by Python
    return await response.json(); 
    
  } catch (error) {
    console.error("Inference Failed:", error);
    throw error; // Pass error up to App.jsx to handle
  }
};