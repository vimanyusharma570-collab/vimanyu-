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
      version: "4.1.0-neural-core",
      uptime: process.uptime(),
      components: {
        ui: "healthy",
        gateway: "healthy",
        ai_layer: "active",
        storage: "connected",
        mlops: "running",
        devops: "deployed",
        aiops: "monitoring",
        gke: "scaled",
        vertex_ai: "active",
        neural_core: "synchronized"
      },
      metrics: {
        cpu_usage: "18%",
        memory_usage: "2.8GB",
        active_agents: 16,
        anomalies_detected: 0,
        model_latency: "38ms",
        neural_sync: "99.9%"
      }
    });
  });

  app.get("/api/architecture", (req, res) => {
    res.json({
      version: "4.0",
      design: {
        components: [
          { name: "Ingestion Layer", service: "Pub/Sub, Dataflow", description: "Real-time log and telemetry ingestion." },
          { name: "Processing Layer", service: "GKE, Cloud Functions", description: "Microservices for data transformation." },
          { name: "AI/ML Layer", service: "Vertex AI, Gemini", description: "Transformer models and Agentic AI core." },
          { name: "Storage Layer", service: "BigQuery, Cloud Storage", description: "Data lake and warehouse for MLOps." },
          { name: "AIOps Layer", service: "Cloud Monitoring, Error Reporting", description: "Self-healing and anomaly detection." }
        ],
        data_flow: "Telemetry -> Pub/Sub -> Dataflow -> BigQuery -> Vertex AI -> Agentic AI -> Actionable Insights",
        mlops_pipeline: [
          "Data Ingestion (BigQuery)",
          "Preprocessing (Vertex AI Pipelines)",
          "Model Training (Custom Training Jobs)",
          "Evaluation (Vertex AI Model Evaluation)",
          "Deployment (Vertex AI Endpoints)"
        ],
        devops_pipeline: [
          "Source (GitHub)",
          "Build (Cloud Build + Docker)",
          "Test (Automated Suites)",
          "Deploy (GKE + Helm)"
        ],
        ai_lifecycle: [
          "Data Collection & Labeling",
          "Feature Engineering (Vertex AI Feature Store)",
          "Hyperparameter Tuning (Vertex AI Vizier)",
          "Model Registry & Versioning",
          "Continuous Monitoring (Vertex AI Model Monitoring)"
        ],
        agentic_loop: [
          "Perception: Ingesting system state via Cloud Monitoring",
          "Reasoning: Gemini-based analysis of anomalies",
          "Planning: Generating remediation steps",
          "Execution: Triggering Cloud Functions/GKE APIs"
        ],
        folder_structure: [
          "/src/services/ai - Agentic AI logic",
          "/src/services/mlops - Pipeline automation",
          "/infra/terraform - GCP infrastructure as code",
          "/infra/k8s - Kubernetes manifests",
          "/scripts/ci-cd - DevOps automation scripts"
        ],
        future_v5: [
          "Multi-cloud federated learning",
          "Quantum-enhanced optimization agents",
          "Zero-trust autonomous security mesh"
        ]
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
