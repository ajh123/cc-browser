import { ElementNode, Node, TextNode } from "../dom";

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

    for (const word of words) {
      const [x, y] = this.term.getCursorPos();
      const [width] = this.term.getSize();

      // Wrap line if word would overflow
      if (x + word.length > width) {
        this.term.setCursorPos(1, y + 1);
      }

      this.term.write(word + " ");
      if (DEBUG) print(word + " ");
    }
  }

  private renderElement(node: ElementNode) {
    const isBlock = ["div", "p"].includes(node.tagName);

    if (isBlock) this.newLine();

    for (const child of node.children) {
      this.render(child);
    }

    if (isBlock) this.newLine();
  }

  private newLine() {
    const [, y] = this.term.getCursorPos();
    this.term.setCursorPos(1, y + 1);
  }
}