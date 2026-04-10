import { $ } from "bun";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";

console.log("Cleaning build directory...");
rmSync("./build", { recursive: true, force: true });
mkdirSync("./build");

console.log("Building CSS with Tailwind...");
// Tailwind v4 CLI
await $`npx @tailwindcss/cli -i ./src/index.css -o ./build/index.css`;

console.log("Building JS with Bun...");
const result = await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: "./build",
  minify: true,
  sourcemap: "external",
  naming: "[dir]/[name].[ext]", // will output main.js
  external: ["*.css"],
});

if (!result.success) {
  console.error("Build failed!");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log("Processing HTML...");
let html = readFileSync("./index.html", "utf-8");
// Replace Vite's module script with the bundled JS
html = html.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  '<script type="module" src="./main.js"></script>'
);
// Add CSS link before closing head
html = html.replace(
  '</head>',
  '  <link rel="stylesheet" href="./index.css">\n</head>'
);
writeFileSync("./build/index.html", html);

// Copy assets if they exist
try {
  await $`cp -r public/* build/ 2>/dev/null || true`;
} catch (e) {}

console.log("Build complete! Output is in the ./build directory.");
