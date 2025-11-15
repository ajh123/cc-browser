const LOG_FILE = shell.resolve("cc-browser.log");

export function clearLog() {
  const [f] = fs.open(LOG_FILE, "w");
  if (f) f.close();
}

export function appendLog(...parts: any[]) {
  try {
    const msg = parts.map((p) => {
      if (typeof p === "object") {
        try {
          return textutils.serialiseJSON(p);
        } catch (e) {
          return String(p);
        }
      }
      return String(p);
    }).join(" ");

    const [f] = fs.open(LOG_FILE, "a");
    const prefix = "[" + os.time() + "] ";
    if (f) {
      f.writeLine(prefix + msg);
      f.close();
    }
  } catch (e) {
    // Fallback to print if file logging isn't available
    print("[LOG] " + parts.join(" "));
  }
}

export default { appendLog, clearLog };
