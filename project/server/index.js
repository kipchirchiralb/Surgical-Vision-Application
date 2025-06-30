import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./config/db.js";
import scanRoutes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflicts

// WebContainer-compatible middleware setup
app.use(
  cors({
    origin: true, // Allow all origins for WebContainer
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for file uploads (memory storage for WebContainer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files and DICOM files
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const isDicom = file.originalname.toLowerCase().endsWith(".dcm");

    if (allowedTypes.includes(file.mimetype) || isDicom) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Please upload JPEG, PNG, GIF, or DICOM files."
        ),
        false
      );
    }
  },
});

// Health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "surgical-vision-api",
    port: PORT,
  });
});

// API routes - pass upload middleware to routes
app.use("/api", scanRoutes(upload));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Handle client-side routing - serve index.html for all non-API routes
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "../public/index.html"), (err) => {
    if (err) {
      // If index.html doesn't exist, send a basic HTML response
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Surgical Vision</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
            <div id="root"></div>
            <script>
              console.log('Surgical Vision API Server Running');
              document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h1>Surgical Vision API</h1><p>Server is running on port ${PORT}</p><p><a href="/health">Health Check</a></p></div>';
            </script>
          </body>
        </html>
      `);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 50MB." });
    }
    return res.status(400).json({ error: "File upload error: " + err.message });
  }

  // Handle other errors
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log("🏥 Starting Surgical Vision API server...");
    console.log("📊 Initializing database...");

    await initializeDatabase();
    console.log("✅ Database initialized successfully");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Surgical Vision API server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API endpoints: http://localhost:${PORT}/api/scans`);
      console.log("✨ Ready to serve requests!");
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log(
          "💡 Try killing existing processes or use a different port"
        );
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("📴 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("📴 Received SIGINT, shutting down gracefully");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();

export default app;
