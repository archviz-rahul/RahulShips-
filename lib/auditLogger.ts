import fs from "fs";
import path from "path";

export interface AuditLog {
  timestamp: string;
  model: string;
  task: string;
  status: "SUCCESS" | "FAILED" | "FALLBACK";
  details?: string;
}

const AUDIT_LOG_PATH = path.join(process.cwd(), "lib", "audit_logs.json");

export async function logAIRouting(log: AuditLog) {
  try {
    let existingLogs: AuditLog[] = [];
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      const data = await fs.promises.readFile(AUDIT_LOG_PATH, "utf-8");
      try {
        existingLogs = JSON.parse(data);
      } catch (e) {
        existingLogs = [];
      }
    }
    
    existingLogs.unshift(log);
    
    // Maintain max 500 logs to preserve storage integrity
    if (existingLogs.length > 500) {
      existingLogs = existingLogs.slice(0, 500);
    }

    const dir = path.dirname(AUDIT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(AUDIT_LOG_PATH, JSON.stringify(existingLogs, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to append audit trace:", err);
  }
}
