import type { AppData } from "@/lib/types";
import { migrateAppData } from "@/lib/calc";
import { STORAGE_KEY } from "@/lib/seed";

export function backupFilename(): string {
  return `mtock-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

const LAST_BACKUP_KEY = "mtock-last-backup-at";

export function markBackupExported(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

export function getLastBackupLabel(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return null;
  }
}

export function exportAppData(data: AppData): string {
  return JSON.stringify(
    {
      format: "mtock-portfolio",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}

export function downloadAppDataBackup(data: AppData) {
  const blob = new Blob([exportAppData(data)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFilename();
  a.click();
  URL.revokeObjectURL(url);
}

export function parseAppDataBackup(raw: string): AppData {
  const parsed = JSON.parse(raw) as { format?: string; data?: unknown };
  if (parsed.format === "mtock-portfolio" && parsed.data) {
    return migrateAppData(parsed.data);
  }
  return migrateAppData(JSON.parse(raw));
}

export function importAppDataFromFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseAppDataBackup(String(reader.result ?? "")));
      } catch (e) {
        reject(e instanceof Error ? e : new Error("백업 파일 형식이 올바르지 않습니다."));
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsText(file, "UTF-8");
  });
}

export function hasExistingPortfolio(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data = migrateAppData(JSON.parse(raw));
    return data.stocks.length > 0;
  } catch {
    return false;
  }
}
