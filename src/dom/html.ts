import { ElementNode, TextNode } from ".";

// Token model used by the parser
export type Token =
  | { type: "text"; value: string }
  | { type: "comment"; value: string }
  | { type: "doctype"; value: string }
  | { type: "open-tag"; tagName: string; attributes: Record<string, string> }
  | { type: "close-tag"; tagName: string }
  | { type: "self-close-tag"; tagName: string; attributes: Record<string, string> };

function isSpace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f";
}

function trimManual(s: string): string {
  let a = 0;
  let b = s.length - 1;
  while (a <= b && isSpace(s[a])) a++;
  while (b >= a && isSpace(s[b])) b--;
  return s.slice(a, b + 1);
}

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// Elements with RAWTEXT and RCDATA parsing behaviors
const rawTextElements = new Set(["script", "style"]);
const rcdataElements = new Set(["title", "textarea"]);

export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < html.length) {
    if (html[i] !== "<") {
      // Emit text up to next '<'
      const next = html.indexOf("<", i);
      const end = next === -1 ? html.length : next;
      const value = html.slice(i, end);
      // Only emit if not all whitespace
      let hasVisible = false;
      for (let k = 0; k < value.length; k++) {
        if (!isSpace(value[k])) { hasVisible = true; break; }
      }
      if (hasVisible) tokens.push({ type: "text", value });
      i = end;
      continue;
    }

    // Now html[i] === '<'
    // Comment
    if (html.startsWith("<!--", i)) {
      const endIdx = html.indexOf("-->", i + 4);
      if (endIdx === -1) {
        // Treat remainder as comment
        const value = html.slice(i + 4);
        tokens.push({ type: "comment", value });
        break;
      }
      const value = html.slice(i + 4, endIdx);
      tokens.push({ type: "comment", value });
      i = endIdx + 3;
      continue;
    }

    // Doctype or declaration
    if (html.startsWith("<!", i)) {
      const end = html.indexOf(">", i + 2);
      if (end === -1) {
        // Malformed, treat as text
        tokens.push({ type: "text", value: html.slice(i) });
        break;
      }
      const raw = html.slice(i + 2, end);
      tokens.push({ type: "doctype", value: trimManual(raw) });
      i = end + 1;
      continue;
    }

    // End tag
    if (html.startsWith("</", i)) {
      const end = html.indexOf(">", i + 2);
      if (end === -1) {
        tokens.push({ type: "text", value: html.slice(i) });
        break;
      }
      const nameRaw = trimManual(html.slice(i + 2, end)).toLowerCase();
      tokens.push({ type: "close-tag", tagName: nameRaw });
      i = end + 1;
      continue;
    }

    // Start tag
    const end = html.indexOf(">", i + 1);
    if (end === -1) {
      tokens.push({ type: "text", value: html.slice(i) });
      break;
    }
    let inside = trimManual(html.slice(i + 1, end));
    const isSelfCloseSyntax = inside.endsWith("/");
    if (isSelfCloseSyntax) inside = trimManual(inside.slice(0, inside.length - 1));

    // Parse tag name
    let p = 0;
    while (p < inside.length && !isSpace(inside[p])) p++;
    const tagName = inside.slice(0, p).toLowerCase();
    if (!tagName) {
      // malformed, treat as text
      tokens.push({ type: "text", value: html.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    // Parse attributes
    const attrs: Record<string, string> = {};
    while (p < inside.length) {
      // skip spaces
      while (p < inside.length && isSpace(inside[p])) p++;
      if (p >= inside.length) break;

      // name
      const nameStart = p;
      while (p < inside.length && !isSpace(inside[p]) && inside[p] !== "=") p++;
      const attrName = inside.slice(nameStart, p).toLowerCase();
      if (!attrName) break;

      // skip spaces
      while (p < inside.length && isSpace(inside[p])) p++;

      let attrValue = "";
      if (p < inside.length && inside[p] === "=") {
        p++; // skip '='
        while (p < inside.length && isSpace(inside[p])) p++;
        if (p < inside.length && (inside[p] === '"' || inside[p] === "'")) {
          const quote = inside[p];
          p++;
          const valueStart = p;
          while (p < inside.length && inside[p] !== quote) p++;
          attrValue = inside.slice(valueStart, p);
          if (p < inside.length) p++; // skip closing quote
        } else {
          const valueStart = p;
          while (p < inside.length && !isSpace(inside[p]) && inside[p] !== ">") p++;
          attrValue = inside.slice(valueStart, p);
        }
      }

      attrs[attrName] = attrValue;
    }

    const isVoid = voidElements.has(tagName);
    if (isSelfCloseSyntax || isVoid) {
      tokens.push({ type: "self-close-tag", tagName, attributes: attrs });
    } else {
      tokens.push({ type: "open-tag", tagName, attributes: attrs });
    }

    // RAWTEXT/RCDATA special handling: capture content until matching end tag
    if (rawTextElements.has(tagName) || rcdataElements.has(tagName)) {
      const closeSeq = `</${tagName}>`;
      const idx = html.toLowerCase().indexOf(closeSeq, end + 1);
      if (idx !== -1) {
        const content = html.slice(end + 1, idx);
        if (content.length > 0) tokens.push({ type: "text", value: content });
        tokens.push({ type: "close-tag", tagName });
        i = idx + closeSeq.length;
        continue;
      }
    }

    i = end + 1;
  }

  return tokens;
}

export function parse(tokens: Token[]): ElementNode {
  type Mode = "initial" | "before_html" | "before_head" | "in_head" | "after_head" | "in_body" | "after_body";

  const root: ElementNode = { type: "element", tagName: "root", attributes: {}, children: [] };
  const stack: ElementNode[] = [root];
  let mode: Mode = "initial";
  let htmlEl: ElementNode | null = null;
  let headEl: ElementNode | null = null;
  let bodyEl: ElementNode | null = null;

  function current(): ElementNode { return stack[stack.length - 1]; }
  function pushElement(tagName: string, attrs: Record<string, string>): ElementNode {
    const el: ElementNode = { type: "element", tagName, attributes: attrs, children: [] };
    current().children.push(el);
    if (!voidElements.has(tagName)) stack.push(el);
    return el;
  }
  function pushVoid(tagName: string, attrs: Record<string, string>): ElementNode {
    const el: ElementNode = { type: "element", tagName, attributes: attrs, children: [] };
    current().children.push(el);
    return el;
  }
  function pushText(text: string) {
    const parent = current();
    const last = parent.children[parent.children.length - 1];
    if (last && last.type === "text") (last as TextNode).value += text;
    else parent.children.push({ type: "text", value: text });
  }
  function popUntil(tagName: string) {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].tagName === tagName) {
        while (stack.length - 1 >= i) stack.pop();
        break;
      }
    }
  }
  function isWSOnly(s: string): boolean {
    for (let i = 0; i < s.length; i++) if (!isSpace(s[i])) return false;
    return true;
  }
  function reprocess(tok: Token, newMode: Mode) { mode = newMode; process(tok); }

  function process(tok: Token) {
    switch (mode) {
      case "initial": {
        if (tok.type === "doctype" || tok.type === "comment") return;
        if (tok.type === "text" && isWSOnly(tok.value)) return;
        reprocess(tok, "before_html");
        return;
      }
      case "before_html": {
        if (tok.type === "text" && isWSOnly(tok.value)) return;
        if (tok.type === "open-tag" && tok.tagName === "html") {
          htmlEl = pushElement("html", tok.attributes);
          mode = "before_head";
          return;
        }
        htmlEl = pushElement("html", {});
        reprocess(tok, "before_head");
        return;
      }
      case "before_head": {
        if (tok.type === "text" && isWSOnly(tok.value)) return;
        if (tok.type === "open-tag" && tok.tagName === "head") {
          headEl = pushElement("head", tok.attributes);
          mode = "in_head";
          return;
        }
        headEl = pushElement("head", {});
        reprocess(tok, "in_head");
        return;
      }
      case "in_head": {
        if (tok.type === "text" && isWSOnly(tok.value)) return;
        if (tok.type === "close-tag" && tok.tagName === "head") {
          popUntil("head");
          mode = "after_head";
          return;
        }
        if (tok.type === "open-tag") {
          const tn = tok.tagName;
          if (tn === "meta" || tn === "link" || tn === "base") { pushVoid(tn, tok.attributes); return; }
          if (tn === "title" || tn === "style" || tn === "script") { pushElement(tn, tok.attributes); return; }
          if (tn === "body" || tn === "html") { popUntil("head"); reprocess(tok, "after_head"); return; }
          popUntil("head");
          reprocess(tok, "after_head");
          return;
        }
        if (tok.type === "self-close-tag") { pushVoid(tok.tagName, tok.attributes); return; }
        if (tok.type === "text") { pushText(tok.value); return; }
        return;
      }
      case "after_head": {
        if (tok.type === "text" && isWSOnly(tok.value)) return;
        if (tok.type === "open-tag" && tok.tagName === "body") { bodyEl = pushElement("body", tok.attributes); mode = "in_body"; return; }
        if (tok.type === "open-tag" && tok.tagName === "html") return;
        if (!bodyEl) bodyEl = pushElement("body", {});
        reprocess(tok, "in_body");
        return;
      }
      case "in_body": {
        if (tok.type === "text") { pushText(tok.value); return; }
        if (tok.type === "open-tag") {
          if (voidElements.has(tok.tagName)) { pushVoid(tok.tagName, tok.attributes); return; }
          pushElement(tok.tagName, tok.attributes); return;
        }
        if (tok.type === "self-close-tag") { pushVoid(tok.tagName, tok.attributes); return; }
        if (tok.type === "close-tag") {
          if (tok.tagName === "body") { popUntil("body"); mode = "after_body"; return; }
          popUntil(tok.tagName); return;
        }
        return;
      }
      case "after_body": {
        if (tok.type === "text" && isWSOnly(tok.value)) return;
        reprocess(tok, "in_body");
        return;
      }
    }
  }

  for (const t of tokens) process(t);
  if (bodyEl) popUntil("html");
  return root;
}

export function parseHTML(html: string): ElementNode {
  const tokens = tokenize(html);
  return parse(tokens);
}
