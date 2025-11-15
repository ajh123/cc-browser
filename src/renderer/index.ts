import { Style, StyleSheet, applyTextStyles, UnstyledStyle } from "./style";
import { ElementNode, Node, TextNode } from "@/dom";
import { BaseFrame } from "@/libs/basalt";

const hiddenElements = new Set([
  "style",
  "meta",
  "link",
  "head",
  "title",
  "script",
]);

export class Renderer {
  private currentY: number;
  private currentX: number;

  constructor(private frame: BaseFrame, private baseStyles: StyleSheet) {
    this.currentY = 1;
    this.currentX = 1;
  }

  render(node: Node, styles?: Style[]) {
    styles = styles || UnstyledStyle;

    if (node.type === "text") {
      this.renderText(node, styles);
    } else if (node.type === "element") {
      if (hiddenElements.has(node.tagName.toLowerCase())) {
        return; // skip hidden elements
      }
      this.renderElement(node, styles);
    }
  }

  private renderText(node: TextNode, styles: Style[]) {
    const label = applyTextStyles(this.frame, styles, node);
    label.setWidth("{parent.width - " + (this.currentX - 1) + "}");
    label.setX(this.currentX);
    label.setY(this.currentY);
    this.currentY += label.getHeight();
  }

  private renderElement(node: ElementNode, styles: Style[]) {
    for (const child of node.children) {
      if (child.type === "text") {
        const childStyles = this.baseStyles[node.tagName] || UnstyledStyle;
        this.renderText(child, childStyles);
      } else {
        this.render(child, styles);
      }
    }
  }
}