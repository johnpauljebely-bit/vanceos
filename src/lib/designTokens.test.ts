import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Design-token discipline check: components must reach for the named
 * bg/accent-teal/accent-status-green/accent-red Tailwind classes (mapped to
 * CSS vars in globals.css), never a raw hex color — that's what keeps the
 * three accent colors from getting conflated as the app grows.
 */
function collectSourceFiles(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectSourceFiles(full, out);
    } else if (/\.(tsx|ts)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;

describe("design token discipline", () => {
  it("no component or lib file hardcodes a raw hex color (globals.css owns the palette)", () => {
    const root = path.join(__dirname, "..");
    const files = collectSourceFiles(path.join(root, "components")).concat(
      collectSourceFiles(path.join(root, "app")),
    );

    const offenders = files
      .map((file) => ({ file, content: readFileSync(file, "utf8") }))
      .filter(({ content }) => HEX_COLOR.test(content))
      .map(({ file }) => path.relative(root, file));

    expect(offenders).toEqual([]);
  });
});
