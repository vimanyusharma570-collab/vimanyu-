import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database Setup (Data Storage Layer)
  const db = new Database("nexus.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component TEXT,
      message TEXT,
      level TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ai_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT,
      response TEXT,
      tokens INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  app.use(express.json());

  // API Gateway Routes
  app.get("/api/status", (req, res) => {
    res.json({
      status: "operational",
      uptime: process.uptime(),
      components: {
        ui: "healthy",
        gateway: "healthy",
        ai_layer: "active",
        storage: "connected",
        mlops: "idle",
        devops: "deployed"
      }
    });
  });

  app.get("/api/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50").all();
    res.json(logs);
  });

  app.post("/api/logs", (req, res) => {
    const { component, message, level } = req.body;
    const info = db.prepare("INSERT INTO logs (component, message, level) VALUES (?, ?, ?)").run(component, message, level);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/ai/history", (req, res) => {
    const history = db.prepare("SELECT * FROM ai_interactions ORDER BY timestamp DESC LIMIT 10").all();
    res.json(history);
  });

  app.post("/api/ai/record", (req, res) => {
    const { prompt, response, tokens } = req.body;
    const info = db.prepare("INSERT INTO ai_interactions (prompt, response, tokens) VALUES (?, ?, ?)").run(prompt, response, tokens);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Server running on http://localhost:${PORT}`);
  });
}

startServer();
