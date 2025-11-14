import { parseHTML } from "./dom/html";

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