export declare interface VisualElementConfig {
    x?: number;
    y?: number;
    z?: number;
    width?: number;
    height?: number;
    background?: Color;
    foreground?: Color;
    backgroundEnabled?: boolean;
    visible?: boolean;
}

export declare interface TabControlConfig extends VisualElementConfig {
    headerBackground?: Color;
    activeTabBackground?: Color;
    scrollableTab?: boolean
}

export declare interface ProgressBarConfig extends VisualElementConfig {
    progressColor?: Color;
}

export declare interface LabelConfig extends VisualElementConfig {
    autoSize?: boolean;
    text?: string;
}

export declare interface BigFontConfig extends VisualElementConfig {
    text?: string;
    fontSize?: number;
}

export declare interface ListConfig extends VisualElementConfig {
    items?: ListItem[]
    selectable?: boolean
    multiSelection?: boolean
    emptyText?: string
}

export declare interface DropDownConfig extends ListConfig {
    selectedText?: string
    dropdownHeight?: number
    dropSymbol?: string
}

export declare interface ComboBoxConfig extends DropDownConfig {
    editable?: string
    text?: string
    autoComplete?: boolean
}

export declare interface ButtonConfig extends VisualElementConfig {
    text?: string
}

export declare interface CheckBoxConfig extends VisualElementConfig {
    checked?: boolean,
    text?: string
    checkedText?: string
}

export declare class PropertySystem {
    observe(name: string, callback: (value: any, oldValue: any) => void)
    removeObserver(name: string, callback: (value: any, oldValue: any) => void)
    removeAllObservers(name: string)
}

export declare class BaseElement extends PropertySystem {

}

export declare class VisualElement extends BaseElement {
    setBackground(color: Color | string);
    setForeground(color: Color | string);
    setVisible(value: boolean | string);
    setWidth(value: number | string);
    setHeight(value: number | string);
    setX(value: number | string);
    setY(value: number | string);
    setZ(value: number | string);
    getBackground(): Color;
    getForeground(): Color;
    getVisible(): boolean;
    getWidth(): number;
    getHeight(): number;
    getX(): number;
    getY(): number;
    getZ(): number;

    onScroll(callback: (this: this, delta: number) => void)
    onKeyUp(callback: (this: this, key: number) => void)
    onKey(callback: (this: this, key: number) => void)
    onClick(callback: (this: this, button: string, x: number, y: number) => void)

    /** @NoSelf **/
    get(name: string): any
    /** @NoSelf **/
    set(name: string, value: any)

    updateRender()
}

export declare class TabControl extends Container {
    newTab(name: string): Container;
    getActiveTab(): number
    setActiveTab(id: number)
}

export declare class ProgressBar extends VisualElement {
    getProgress(): number;
    setProgress(p: number);
    setDirection(v: "up" | "down" | "left" | "right");
    getDirection(): "up" | "down" | "left" | "right";
}

export declare class Label extends VisualElement {
    setAutoSize(autoSize: boolean);
    getAutoSize();
    getText(): string;
    setText(value: string);
}

export declare class BigFont extends VisualElement {
    getText(): string;
    setText(value: string);
    getFontSize(): number;
    setFontSize(value: number);
}

export declare class Button extends VisualElement {
    getText(): string;
    setText(value: string);
}

export declare class TextBox extends VisualElement {
    setEditable(editable: boolean);
    getEditable(): boolean;
    getText(): string;
    setText(value: string);
}

export declare class Input extends VisualElement {
    getText(): string;
    setText(value: string);
}

export declare interface ListItem {
    text: string
    callback?: () => void
    fg?: number
    bg?: number
    selected?: boolean
    [key: string]: any;
}

export declare class Collection<T extends ListItem> extends VisualElement {
    addItem(item: T)
    setItems(items: T[])
    setOffset(value: number)
    getItems(): T[]
    clear(): void
    getSelectedItems(): T[]
    getSelectedItem(): T
    clearItemSelection()
    selectItem(index: number)
}

export declare class List<T extends ListItem> extends Collection<T> {
    scrollToBottom()
    scrollToTop()
    scrollToTop(index:number)
}

export declare class DropDown<T extends ListItem> extends List<T> {

}

export declare class ComboBox<T extends ListItem> extends DropDown<T> {
    getText(): string
    setText(text: string)
}

export declare class CheckBox extends VisualElement { 

}

export declare class Container extends VisualElement {
    setOffsetY(value: number | string);
    getOffsetY(): number;
    clear(): void;

    addBigFont(configuration: BigFontConfig): BigFont;
    addContainer(configuration: VisualElementConfig): Container;
    addTabControl(configuration: TabControlConfig): TabControl;
    addLabel(configuration: LabelConfig): Label;
    addList<T extends ListItem>(configuration: ListConfig): List<T>;
    addTextBox(configuration: VisualElementConfig): TextBox;
    addButton(configuration: ButtonConfig): Button;
    addInput(configuration: VisualElementConfig): Input;
    addProgressBar(configuration: ProgressBarConfig): ProgressBar;
    addFrame(configuration: VisualElementConfig): BaseFrame;
    addDropDown<T extends ListItem>(configuration: DropDownConfig): DropDown<T>;
    addComboBox<T extends ListItem>(configuration: ComboBoxConfig): ComboBox<T>;
    addCheckBox(configuration: CheckBoxConfig): CheckBox
}

export declare class BaseFrame extends Container {}

export declare class MainFrame extends BaseFrame {}

/** @NoSelf **/
export declare function getMainFrame(): MainFrame;
/** @NoSelf **/
export declare function run();
/** @NoSelf **/
export declare function schedule(func: () => void);
/** @NoSelf **/
export declare function update();
/** @NoSelf **/
export declare function stop();

/** @NoSelf **/
export declare function onEvent<T extends any[]>(event: string, callback: (this:void, ...args: T) => void)

/** @NoSelf **/
export declare function removeEvent<T extends any[]>(event: string, callback: (this: void, ...args: T) => void)

/** @NoSelf **/
export declare function debug(a: any);