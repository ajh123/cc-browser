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

export class DOM {
  constructor(public root: ElementNode) {}

  public getElementsByTagName(tagName: string): ElementNode[] {
    const results: ElementNode[] = [];
    function traverse(node: Node) {
      if (node.type === "element") {
        if (node.tagName === tagName) {
          results.push(node);
        }
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(this.root);
    return results;
  }

  public getElementById(id: string): ElementNode | null {
    let result: ElementNode | null = null;
    function traverse(node: Node) {
      if (node.type === "element") {
        if (node.attributes.id === id) {
          result = node;
          return;
        }
        for (const child of node.children) {
          traverse(child);
          if (result) return;
        }
      }
    }
    traverse(this.root);
    return result;
  }

  public getElementsByClassName(className: string): ElementNode[] {
    const results: ElementNode[] = [];
    function traverse(node: Node) {
      if (node.type === "element") {
        if (node.attributes.class === className) {
          results.push(node);
        }
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(this.root);
    return results;
  }

  public getElementsByName(name: string): ElementNode[] {
    const results: ElementNode[] = [];
    function traverse(node: Node) {
      if (node.type === "element") {
        if (node.attributes.name === name) {
          results.push(node);
        }
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(this.root);
    return results;
  }

  public getElementsByAttribute(attribute: string, value: string): ElementNode[] {
    const results: ElementNode[] = [];
    function traverse(node: Node) {
      if (node.type === "element") {
        if (node.attributes[attribute] === value) {
          results.push(node);
        }
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(this.root);
    return results;
  }
}