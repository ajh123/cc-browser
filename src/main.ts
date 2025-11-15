import { parseHTML } from "./dom/html";
import { DOM } from "./dom";
import { Renderer } from "./renderer";
import { console } from "./console";

print("Enter URL to fetch HTML from:");
const url = read();

const [response, reason] = http.get(url);
if (!response) {
  error("Failed to fetch URL: " + url + " (" + reason + ")");
}

const html = response.readAll();

const root = parseHTML(html);
console.debug(
  textutils.serialiseJSON(root)
);

const dom = new DOM(root);
const divs = dom.getElementsByTagName("div");
console.debug(`Found ${divs.length} <div> elements.`);

// Debug log: list top-level children for verification
console.debug("root children", root.children.length, root.children.map((c) => (c.type === "element") ? c.tagName : "#text"));

const renderer = new Renderer(term);
renderer.render(root);