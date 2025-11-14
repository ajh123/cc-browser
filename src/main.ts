import { parseHTML } from "./dom/html";
import { DOM } from "./dom";

const html = `
  <!DOCTYPE html>
  <!-- Example HTML to exercise tokenizer -->
  <div class=container data-value='a b' disabled>
    <h1>Hello, world!</h1>
    <p>This is a <strong>test</strong>.</p>
    <img src="foo.png">
    <br>
    <script>if (a < b) { /* angle bracket inside script */ }</script>
  </div>
`;

const ast = parseHTML(html);
print(
  textutils.serialiseJSON(ast)
);

const dom = new DOM(ast);
const divs = dom.getElementsByTagName("div");
print(`Found ${divs.length} <div> elements.`);