const LOG_FILE = shell.resolve("cc-browser.log");

let groupStack: string[] = [];
const timers: Record<string, number> = {};
const counters: Record<string, number> = {};

function serialisePart(p: any): string {
  if (typeof p === "object") {
    try {
      return textutils.serialiseJSON(p);
    } catch (_) {
      return String(p);
    }
  }
  return String(p);
}

function writeLine(level: string, parts: any[]) {
  const indent = groupStack.length > 0 ? "  ".repeat(groupStack.length) : "";
  const msg = parts.map(serialisePart).join(" ");
  const prefix = "[" + os.time() + "]" + (level ? "[" + level + "]" : "") + " ";
  try {
    const [f] = fs.open(LOG_FILE, "a");
    if (f) {
      f.writeLine(prefix + indent + msg);
      f.close();
    } else {
      print(prefix + indent + msg);
    }
  } catch (_) {
    print(prefix + indent + msg);
  }
}

export function clearLog() {
  const [f] = fs.open(LOG_FILE, "w");
  if (f) f.close();
}

export function log(...parts: any[]) { writeLine("", parts); }
export function info(...parts: any[]) { writeLine("INFO", parts); }
export function warn(...parts: any[]) { writeLine("WARN", parts); }
export function error(...parts: any[]) { writeLine("ERROR", parts); }
export function debug(...parts: any[]) { writeLine("DEBUG", parts); }

export function group(label: string = "") {
  groupStack.push(label);
  if (label) writeLine("GROUP", [label]);
}

export function groupCollapsed(label: string = "") { group(label); }

export function groupEnd() {
  if (groupStack.length > 0) groupStack.pop();
}

export function time(label: string = "default") {
  timers[label] = os.clock();
}

export function timeEnd(label: string = "default") {
  if (timers[label] !== undefined) {
    const duration = os.clock() - timers[label];
    delete timers[label];
    writeLine("TIME", [label + ": " + duration.toFixed(4) + "s"]);
  } else {
    writeLine("TIME", [label + " (no such timer)"]);
  }
}

export function count(label: string = "default") {
  counters[label] = (counters[label] || 0) + 1;
  writeLine("COUNT", [label + ": " + counters[label]]);
}

export function countReset(label: string = "default") {
  if (counters[label] !== undefined) counters[label] = 0;
}

export function assert(condition: any, ...parts: any[]) {
  if (!condition) {
    if (parts.length === 0) parts = ["Assertion failed"];
    writeLine("ASSERT", parts);
  }
}

export function table(data: any) {
  if (Array.isArray(data)) {
    const keys: Record<string, true> = {};
    data.forEach((row) => { if (row && typeof row === "object") for (const k in row) keys[k] = true; });
    const header = Object.keys(keys);
    writeLine("TABLE", [header.join(" | ")]);
    data.forEach((row) => {
      if (row && typeof row === "object") {
        const line = header.map((k) => serialisePart(row[k])).join(" | ");
        writeLine("TABLE", [line]);
      } else {
        writeLine("TABLE", [serialisePart(row)]);
      }
    });
  } else if (data && typeof data === "object") {
    for (const k in data) writeLine("TABLE", [k + " | " + serialisePart(data[k])]);
  } else {
    writeLine("TABLE", [serialisePart(data)]);
  }
}

export function dir(obj: any) {
  if (obj && typeof obj === "object") {
    for (const k in obj) writeLine("DIR", [k + ": " + typeof obj[k]]);
  } else {
    writeLine("DIR", [typeof obj + " (primitive)"]);
  }
}

export const console = {
  log, info, warn, error, debug,
  group, groupCollapsed, groupEnd,
  time, timeEnd,
  count, countReset,
  assert,
  clear: clearLog,
  table,
  dir,
};
