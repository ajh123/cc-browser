import { parseHTML } from "./dom/html";
import { DOM } from "./dom";
import { Renderer } from "./renderer";
import { appendLog } from "./log";

print("Enter URL to fetch HTML from:");
const url = read();

const [response, reason] = http.get(url);
if (!response) {
  error("Failed to fetch URL: " + url + " (" + reason + ")");
}

const html = response.readAll();

const root = parseHTML(html);
appendLog(
  textutils.serialiseJSON(root)
);

const dom = new DOM(root);
const divs = dom.getElementsByTagName("div");
appendLog(`Found ${divs.length} <div> elements.`);

// Debug log: list top-level children for verification
appendLog("root children", root.children.length, root.children.map((c) => (c.type === "element") ? c.tagName : "#text"));

const renderer = new Renderer(term);
renderer.render(root);