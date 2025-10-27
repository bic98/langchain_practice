import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fg from "fast-glob";
import path from "node:path";
import fs from "node:fs";
import tailwindcss from "@tailwindcss/vite";

function buildInputs() {
  const files = fg.sync("src/**/index.{tsx,ts,jsx,js}", { dot: false });
  return Object.fromEntries(
    files.map((f) => [path.basename(path.dirname(f)), path.resolve(f)])
  );
}

const toFs = (abs: string) => "/@fs/" + abs.replace(/\\/g, "/");

const toServerRoot = (abs: string) => {
  const rel = path.relative(process.cwd(), abs).replace(/\\/g, "/");
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return toFs(abs);
  return "./" + rel;
};

function generateHtmlForBuild(): Plugin {
  return {
    name: "generate-html-for-build",
    apply: "build",
    generateBundle(_, bundle) {
      const entries = Object.keys(bundle).filter(
        (name) => bundle[name].type === "chunk" && bundle[name].isEntry
      );

      for (const entryFile of entries) {
        const chunk = bundle[entryFile];
        if (chunk.type !== "chunk") continue;

        const name = chunk.name;
        const jsFile = entryFile;
        const cssFile = Object.keys(bundle).find(
          (f) => f.endsWith(".css") && f.includes(name)
        );

        const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${name}</title>
  ${cssFile ? `<link rel="stylesheet" href="${cssFile}">` : ""}
  <script type="module" src="${jsFile}"></script>
</head>
<body>
  <div id="${name}-root"></div>
</body>
</html>`;

        this.emitFile({
          type: "asset",
          fileName: `${name}.html`,
          source: html,
        });
      }
    },
  };
}

function multiEntryDevEndpoints(options: {
  entries: Record<string, string>;
  globalCss?: string[];
  perEntryCssGlob?: string;
  perEntryCssIgnore?: string[];
}): Plugin {
  const {
    entries,
    globalCss = ["src/index.css"],
    perEntryCssGlob = "**/*.{css,pcss,scss,sass}",
    perEntryCssIgnore = ["**/*.module.*"],
  } = options;

  const V_PREFIX = "\0multi-entry:";

  const renderIndexHtml = (names: string[]): string => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Revit MCP Widgets</title>
  <style>
    body { font: 15px/1.5 system-ui, sans-serif; margin: 32px; color: #1f2933; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 6px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; margin-left: 6px; color: #64748b; }
  </style>
</head>
<body>
  <h1>Revit MCP Widgets</h1>
  <ul>
    ${names
      .toSorted()
      .map(
        (name) =>
          `<li><a href="/${name}.html">${name}</a><code>/${name}.html</code></li>`
      )
      .join("\n    ")}
  </ul>
</body>
</html>`;

  const renderDevHtml = (name: string): string => `<!doctype html>
<html>
<head>
  <script type="module" src="/${name}.js"></script>
  <link rel="stylesheet" href="/${name}.css">
  </head>
<body>
  <div id="${name}-root"></div>
</body>
</html>`;

  return {
    name: "multi-entry-dev-endpoints",
    configureServer(server) {
      const names = Object.keys(entries);
      const list = names.map((n) => `/${n}.html, /${n}.js, /${n}.css`).join("\n  ");
      server.config.logger.info(`\nDev endpoints:\n  ${list}\n`);

      server.middlewares.use((req, res, next) => {
        try {
          if (req.method !== "GET" || !req.url) return next();
          const url = req.url.split("?")[0];
          if (url === "/" || url === "" || url === "/index.html") {
            const html = renderIndexHtml(names);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
            return;
          }
          const bareMatch = url.match(/^\/?([\w-]+)\/?$/);
          if (bareMatch && entries[bareMatch[1]]) {
            const name = bareMatch[1];
            const html = renderDevHtml(name);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
            return;
          }

          if (!url.endsWith(".html")) return next();

          const m = url.match(/^\/?([\w-]+)\.html$/);
          if (!m) return next();
          const name = m[1];
          if (!entries[name]) return next();

          const html = renderDevHtml(name);
          res.setHeader("Content-Type", "text/html");
          res.end(html);
          return;
        } catch {
          // fall through
        }
        next();
      });
    },
    resolveId(id: string) {
      if (id.startsWith("/")) id = id.slice(1);
      if (id.endsWith(".js")) {
        const name = id.slice(0, -3);
        if (entries[name]) return `${V_PREFIX}entry:${name}`;
      }
      if (id.endsWith(".css")) {
        const name = id.slice(0, -4);
        if (entries[name]) return `${V_PREFIX}style:${name}.css`;
      }
      if (id.startsWith(V_PREFIX)) return id;
      return null;
    },
    load(id: string) {
      if (!id.startsWith(V_PREFIX)) return null;

      const rest = id.slice(V_PREFIX.length);
      const [kind, nameWithExt] = rest.split(":", 2);
      const name = nameWithExt.replace(/\.css$/, "");
      const entry = entries[name];
      if (!entry) return null;

      const entryDir = path.dirname(entry);

      const globals = globalCss
        .map((p) => path.resolve(p))
        .filter((p) => fs.existsSync(p));
      const perEntry = fg.sync(perEntryCssGlob, {
        cwd: entryDir,
        absolute: true,
        dot: false,
        ignore: perEntryCssIgnore,
      });

      if (kind === "style") {
        const allCss = [...globals, ...perEntry];
        const lines = [
          `@source "./src";`,
          ...allCss.map((p) => `@import "${toServerRoot(p)}";`),
        ];
        return lines.join("\n");
      }

      if (kind === "entry") {
        const spec = toFs(entry);

        const lines: string[] = [];

        lines.push(`import "/@vite/client";`);

        lines.push(`
import RefreshRuntime from "/@react-refresh";

if (!window.__vite_plugin_react_preamble_installed__) {
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
}
`);

        lines.push(`import "/${name}.css";`);
        lines.push(`await import(${JSON.stringify(spec)});`);

        return lines.join("\n");
      }

      return null;
    },
  };
}

const inputs = buildInputs();

export default defineConfig(({}) => ({
  plugins: [
    tailwindcss(),
    react(),
    multiEntryDevEndpoints({ entries: inputs }),
    generateHtmlForBuild(),
  ],
  cacheDir: "node_modules/.vite-react",
  server: {
    port: 4444,
    strictPort: true,
    cors: true,
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
    target: "es2022",
  },
  build: {
    target: "es2022",
    sourcemap: true,
    minify: "esbuild",
    outDir: "assets",
    assetsDir: ".",
    rollupOptions: {
      input: inputs,
      preserveEntrySignatures: "strict",
    },
  },
}));
