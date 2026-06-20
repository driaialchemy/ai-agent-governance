import fs from "fs";
import path from "path";

const DATA_DIR = process.env.NODE_ENV === "test"
  ? path.join(__dirname, "../../.test-data")
  : path.join(__dirname, "../../data");

interface DatabaseStore {
  agent_activities: any[];
  risk_reports: any[];
  approval_requests: any[];
  audit_trail: any[];
}

let store: DatabaseStore | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDatabase(): DatabaseStore {
  if (!store) {
    store = initializeDatabase();
  }
  return store;
}

function initializeDatabase(): DatabaseStore {
  ensureDataDir();
  const dbPath = path.join(DATA_DIR, "governance.json");

  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(data) as DatabaseStore;
      store = parsed;
      return parsed;
    } catch (e) {
      // If file is corrupted, start fresh
    }
  }

  store = {
    agent_activities: [],
    risk_reports: [],
    approval_requests: [],
    audit_trail: []
  };

  persistDatabase();
  return store;
}

export function persistDatabase() {
  if (!store) return;

  ensureDataDir();
  const dbPath = path.join(DATA_DIR, "governance.json");
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2), "utf-8");
}

export function closeDatabase() {
  if (store) {
    persistDatabase();
    store = null;
  }
}

export function resetDatabase() {
  store = {
    agent_activities: [],
    risk_reports: [],
    approval_requests: [],
    audit_trail: []
  };
  persistDatabase();
}
