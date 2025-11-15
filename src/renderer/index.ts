import { ElementNode, Node, TextNode } from "../dom";
import { appendLog } from "../log";

const hiddenElements = new Set([
  "style",
  "meta",
  "link",
  "head",
  "title",
  "script",
]);

const DEBUG = false; // Set to true temporarily for on-screen debugging
export class Renderer {
  constructor(private term: ITerminal) {}

  render(node: Node) {
    appendLog("render", node.type, node.type === "element" ? (node as ElementNode).tagName : (node as TextNode).value.slice(0, 80));
    if (node.type === "text") {
      this.renderText(node);
    } else if (node.type === "element") {
      if (hiddenElements.has(node.tagName.toLowerCase())) {
        return; // skip hidden elements
      }
      this.renderElement(node);
    }
  }

  private renderText(node: TextNode) {
    appendLog("renderText (raw)", node.value);
    // Split by spaces manually without RegExp
    const words: string[] = [];
    let currentWord = "";
    for (let i = 0; i < node.value.length; i++) {
      const c = node.value[i];
      if (c === " " || c === "\t" || c === "\n") {
        if (currentWord !== "") {
          words.push(currentWord);
          currentWord = "";
        }
      } else {
        currentWord += c;
      }
    }
    if (currentWord !== "") words.push(currentWord);
    appendLog("renderText words", words.length, words.slice(0, 12));

    for (const word of words) {
      const [x, y] = this.term.getCursorPos();
      const [width] = this.term.getSize();

      // Wrap line if word would overflow
      if (x + word.length > width) {
        this.term.setCursorPos(1, y + 1);
      }

      appendLog("write", word, "pos", x, y, "width", width);
      this.term.write(word + " ");
      if (DEBUG) print(word + " ");
    }
  }

  private renderElement(node: ElementNode) {
    const isBlock = ["div", "p"].includes(node.tagName);
    appendLog("renderElement", node.tagName, "children", node.children.length);

    if (isBlock) this.newLine();

    for (const child of node.children) {
      this.render(child);
    }

    if (isBlock) this.newLine();
  }

  private newLine() {
    const [, y] = this.term.getCursorPos();
    appendLog("newLine", y);
    this.term.setCursorPos(1, y + 1);
  }
}