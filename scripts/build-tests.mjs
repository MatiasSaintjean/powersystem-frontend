import { build, transform } from "esbuild";
import { createInstrumenter } from "istanbul-lib-instrument";
import { readFile, mkdir } from "node:fs/promises";
await mkdir(".test-build", { recursive: true });
await build({
  entryPoints: ["tests/index.jsx"],
  outfile: ".test-build/tests.js",
  bundle: true,
  format: "iife",
  jsx: "automatic",
  sourcemap: "inline",
  define: {
    "process.env.NODE_ENV": '"test"',
    "import.meta.env.BASE_URL": '"/"',
  },
  plugins: [
    {
      name: "coverage-source",
      setup(b) {
        b.onLoad({ filter: /[\\/]src[\\/].*\.(jsx|js)$/ }, async ({ path }) => {
          const original = await readFile(path, "utf8");
          const { code } = await transform(original, {
            loader: path.endsWith("jsx") ? "jsx" : "js",
            jsx: "automatic",
            define: { "import.meta.env.BASE_URL": '"/"' },
          });
          const instrumenter = createInstrumenter({
            esModules: true,
            compact: false,
          });
          return {
            contents: instrumenter.instrumentSync(code, path),
            loader: "js",
          };
        });
      },
    },
  ],
});
