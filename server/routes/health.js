const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// Get Firestore instance
const db = admin.firestore();

// GET /api/health - Health check endpoint
router.get("/", async (req, res) => {
  try {
    // Test Firebase connection by attempting to fetch a document
    await db.collection("health_check").limit(1).get();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "firebase_connected",
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      error: "Firebase connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
