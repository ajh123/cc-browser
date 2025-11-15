import { parseHTML } from "@/dom/html";
import { DefaultStyleSheet } from "@/renderer/style";
import { Renderer } from "@/renderer";
import { console } from "@/console";
import { run, getMainFrame } from "@/libs/basalt";

print("Enter URL to fetch HTML from:");
const url = read();

const [response, reason] = http.get(url);
if (!response) {
  error("Failed to fetch URL: " + url + " (" + reason + ")");
}

const html = response.readAll();

const root = parseHTML(html);
console.debug("Page tree:", textutils.serialiseJSON(root));

// const dom = new DOM(root);
// const divs = dom.getElementsByTagName("div");
// console.debug(`Found ${divs.length} <div> elements.`);

// // Debug log: list top-level children for verification
// console.debug("root children", root.children.length, root.children.map((c) => (c.type === "element") ? c.tagName : "#text"));

const main = getMainFrame();

const tabs = main.addTabControl({
  activeTabBackground: colors.lightGray,
  scrollableTab: true,
})
tabs.setX(1)
tabs.setY(1)
tabs.setWidth("{parent.width}")
tabs.setHeight("{parent.height}")


const documentFrame = tabs.newTab(url);
documentFrame.setWidth("{parent.width}")
documentFrame.setHeight("{parent.height - 1}")
documentFrame.setBackground(colors.white);
documentFrame.setForeground(colors.black);

const renderer = new Renderer(documentFrame, DefaultStyleSheet);
renderer.render(root);

run();