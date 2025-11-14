import { parseHTML } from "./dom/html";
import { DOM } from "./dom";
import { Renderer } from "./renderer";

print("Enter URL to fetch HTML from:");
const url = read();

const [response, reason] = http.get(url);
if (!response) {
  error("Failed to fetch URL: " + url + " (" + reason + ")");
}

const html = response.readAll();

const root = parseHTML(html);
// print(
//   textutils.serialiseJSON(root)
// );

// const dom = new DOM(root);
// const divs = dom.getElementsByTagName("div");
// print(`Found ${divs.length} <div> elements.`);

const renderer = new Renderer(term);
renderer.render(root);