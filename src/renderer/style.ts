import { Container } from "@/libs/basalt";
import { ElementNode, TextNode } from "@/dom";

export type StyleKey = "color" | "backgroundColor" | "fontSize" | "textDecoration" | "textAlign" | "margin" | "padding" | "border" | "width" | "height";

const fontSizeMap: Record<string, number> = {
  "small": 0,
  "large": 1
};

export interface Style {
  key: StyleKey;
  value: string | number;
}

export type StyleSheet = Record<string, Style[]>;

export const UnstyledStyle: Style[] = [
  { key: "fontSize", value: "small" },
  { key: "color", value: colors.gray },
  { key: "backgroundColor", value: colors.white },
];

export const DefaultStyleSheet: StyleSheet = {
  "body": [
    { key: "fontSize", value: "medium" },
    { key: "color", value: colors.black },
    { key: "backgroundColor", value: colors.white },
  ],
  "h1": [
    { key: "fontSize", value: "large" },
    { key: "color", value: colors.black },
  ],
  "h2": [
    { key: "fontSize", value: "large" },
    { key: "color", value: colors.black },
  ],
  "h3": [
    { key: "fontSize", value: "small" },
    { key: "color", value: colors.black },
  ],
  "h4": [
    { key: "fontSize", value: "small" },
    { key: "color", value: colors.black },
  ],
  "h5": [
    { key: "fontSize", value: "small" },
    { key: "color", value: colors.black },
  ],
  "h6": [
    { key: "fontSize", value: "small" },
    { key: "color", value: colors.black },
  ],
  "p": [
    { key: "fontSize", value: "small" },
  ],
  "a": [
    { key: "color", value: colors.blue },
  ],
};

function getStyleValue(styles: Style[], key: StyleKey): string | number | undefined {
  const style = styles.find(s => s.key === key);
  return style ? style.value : undefined;
}

export function applyTextStyles(container: Container, currentStyle: Style[], currentNode: TextNode) {
  const realFontSize = fontSizeMap[
    (getStyleValue(currentStyle, "fontSize") as string) || "small"
  ] || 0;
  const isNotSmallText = realFontSize > 0;

  const textColor = getStyleValue(currentStyle, "color") as number || getStyleValue(UnstyledStyle, "color") as number;
  const backgroundColor = getStyleValue(currentStyle, "backgroundColor") as number || getStyleValue(UnstyledStyle, "backgroundColor") as number;

  if (isNotSmallText) {
    const bigFont = container.addBigFont({
      text: currentNode.value.trim(),
      fontSize: realFontSize,
    });
    bigFont.setBackground(backgroundColor);
    bigFont.setForeground(textColor);
    return bigFont;
  } else {
    const label = container.addLabel({
      text: currentNode.value.trim(),
      autoSize: false
    });
    label.setBackground(backgroundColor);
    label.setForeground(textColor);
    return label;
  }
}