const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import routes
const customerRoutes = require("./routes/customers");
const billRoutes = require("./routes/bills");
const healthRoutes = require("./routes/health");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins for development
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/health", healthRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "AKR Workshop API Server",
    version: "1.0.0",
    status: "running",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Accepting connections from any IP`);
});
