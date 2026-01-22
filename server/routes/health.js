const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();

// GET /api/health - Health check endpoint
router.get("/", async (req, res) => {
  try {
    // Test database connection
    await prisma.$connect();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      error: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
