import { ElementNode } from ".";

export type Token =
  | { type: "text"; value: string }
  | { type: "open-tag"; tagName: string; attributes: Record<string, string> }
  | { type: "close-tag"; tagName: string }
  | { type: "self-close-tag"; tagName: string; attributes: Record<string, string> };

// comment and doctype tokens are useful for more robust parsing
export type TokenExtended =
  | Token
  | { type: "comment"; value: string }
  | { type: "doctype"; value: string };

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f";
}

function trimManual(s: string): string {
  let start = 0;
  let end = s.length - 1;
  while (start <= end && isWhitespace(s[start])) start++;
  while (end >= start && isWhitespace(s[end])) end--;
  return s.slice(start, end + 1);
}

const selfClosingElements = new Set([
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

export function tokenize(html: string): TokenExtended[] {
  const tokens: TokenExtended[] = [];
  let i = 0;

  while (i < html.length) {
    if (html[i] === "<") {
      // HTML comment (<!-- comment -->)
      if (html.startsWith("<!--", i)) {
        const closeIdx = html.indexOf("-->", i + 4);
        const end = closeIdx === -1 ? html.length - 1 : closeIdx + 2;
        const value = html.slice(i + 4, closeIdx === -1 ? html.length : closeIdx);
        tokens.push({ type: "comment", value });
        i = end + 1;
        continue;
      }

      // Doctype or other declarations (<!DOCTYPE ...>)
      if (html.startsWith("<!", i) && !html.startsWith("<!--", i)) {
        const end = html.indexOf(">", i);
        if (end === -1) {
          tokens.push({ type: "text", value: html.slice(i) });
          break;
        }
        const raw = html.slice(i + 2, end);
        tokens.push({ type: "doctype", value: raw.trim() });
        i = end + 1;
        continue;
      }
      // Closing tag
      if (html.startsWith("</", i)) {
        const end = html.indexOf(">", i);
        if (end === -1) {
          tokens.push({ type: "text", value: html.slice(i) });
          break;
        }
        const tagContent = html.slice(i + 2, end);
        const tagName = trimManual(tagContent).toLowerCase();
        tokens.push({ type: "close-tag", tagName });
        i = end + 1;
        continue;
      }

      // Opening or self-closing tag
      const end = html.indexOf(">", i);
      const raw = html.slice(i + 1, end);
      const trimmed = trimManual(raw);

      const selfClosing =
        trimmed.length > 0 && trimmed[trimmed.length - 1] === "/";

      // Remove trailing slash if self closing
      const inner = selfClosing
        ? trimManual(trimmed.slice(0, trimmed.length - 1))
        : trimmed;

      // Parse tagName and attributes manually
      let cursor = 0;

      // Parse tagName
      while (cursor < inner.length && !isWhitespace(inner[cursor])) {
        cursor++;
      }
      const tagName = inner.slice(0, cursor).toLowerCase();
      if (!tagName) {
        // malformed/empty tag name, treat as text
        const rawTag = html.slice(i, end + 1);
        tokens.push({ type: "text", value: rawTag });
        i = end + 1;
        continue;
      }

      const attributes: Record<string, string> = {};

      // Parse attributes
      while (cursor < inner.length) {
        // Skip whitespace
        while (cursor < inner.length && isWhitespace(inner[cursor])) {
          cursor++;
        }
        if (cursor >= inner.length) break;

        // Parse attribute name
        let nameStart = cursor;
        while (
          cursor < inner.length &&
          !isWhitespace(inner[cursor]) &&
          inner[cursor] !== "="
        ) {
          cursor++;
        }
        const attrName = inner.slice(nameStart, cursor).toLowerCase();
        if (!attrName) break;

        // Skip whitespace
        while (cursor < inner.length && isWhitespace(inner[cursor])) {
          cursor++;
        }

        let attrValue = "";

        if (cursor < inner.length && inner[cursor] === "=") {
          cursor++; // skip '='

          // Skip whitespace
          while (cursor < inner.length && isWhitespace(inner[cursor])) {
            cursor++;
          }

          // Quoted value?
          if (cursor < inner.length && (inner[cursor] === '"' || inner[cursor] === "'")) {
            const quote = inner[cursor];
            cursor++;
            let valueStart = cursor;

            while (cursor < inner.length && inner[cursor] !== quote) {
              cursor++;
            }
            attrValue = inner.slice(valueStart, cursor);
            cursor++; // skip closing quote
          } else {
            // Unquoted value
            const valueStart = cursor;
            while (
              cursor < inner.length &&
              !isWhitespace(inner[cursor]) &&
              inner[cursor] !== ">"
            ) {
              cursor++;
            }
            attrValue = inner.slice(valueStart, cursor);
          }
        }

        attributes[attrName] = attrValue;
      }

      const forceSelfClosing = selfClosingElements.has(tagName);
      if (selfClosing || forceSelfClosing) {
        tokens.push({ type: "self-close-tag", tagName, attributes });
      } else {
        tokens.push({ type: "open-tag", tagName, attributes });
      }

      // Raw text elements should be treated specially (script/style)
      if (tagName === "script" || tagName === "style") {
        const closing = `</${tagName}>`;
        const idx = html.toLowerCase().indexOf(closing, end + 1);
        if (idx !== -1) {
          const content = html.slice(end + 1, idx);
          tokens.push({ type: "text", value: content });
          tokens.push({ type: "close-tag", tagName });
          i = idx + closing.length;
          continue;
        }
      }

      i = end + 1;
    } else {
      // Text node
      const next = html.indexOf("<", i);
      const end = next !== -1 ? next : html.length;
      const value = html.slice(i, end);

      // Check non-whitespace without regex
      let hasVisible = false;
      for (let j = 0; j < value.length; j++) {
        if (!isWhitespace(value[j])) {
          hasVisible = true;
          break;
        }
      }

      if (hasVisible) {
        tokens.push({ type: "text", value });
      }

      i = end;
    }
  }

  return tokens;
}

export function parse(tokens: TokenExtended[]): ElementNode {
  // A synthetic root so we can return a single object
  const root: ElementNode = {
    type: "element",
    tagName: "root",
    attributes: {},
    children: []
  };

  const stack: ElementNode[] = [root];

  for (const token of tokens) {
    const parent = stack[stack.length - 1];

    switch (token.type) {
      case "text":
        parent.children.push({
          type: "text",
          value: token.value
        });
        break;

      case "open-tag": {
        const elem: ElementNode = {
          type: "element",
          tagName: token.tagName,
          attributes: token.attributes,
          children: []
        };
        parent.children.push(elem);
        if (!selfClosingElements.has(elem.tagName)) {
          stack.push(elem);
        }
        break;
      }

      case "self-close-tag":
        parent.children.push({
          type: "element",
          tagName: token.tagName,
          attributes: token.attributes,
          children: []
        });
        break;

      case "close-tag": {
        // Pop until we find a matching ancestor (forgiving HTML-style parsing)
        let matchIndex = -1;
        for (let si = stack.length - 1; si >= 0; si--) {
          if (stack[si].tagName === token.tagName) {
            matchIndex = si;
            break;
          }
        }
        if (matchIndex !== -1) {
          while (stack.length - 1 >= matchIndex) {
            stack.pop();
          }
        } else {
          // no matching ancestor found; ignore the close tag
        }
        break;
      }
      case "comment":
      case "doctype":
        // ignore comment and doctype tokens
        break;
    }
  }

  return root;
}

export function parseHTML(html: string): ElementNode {
  const tokens = tokenize(html);
  return parse(tokens);
}
