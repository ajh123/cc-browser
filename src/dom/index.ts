// A node in our simplified DOM
export type Node = ElementNode | TextNode;

export interface ElementNode {
  type: "element";
  tagName: string;
  attributes: Record<string, string>;
  children: Node[];
}

export interface TextNode {
  type: "text";
  value: string;
}
