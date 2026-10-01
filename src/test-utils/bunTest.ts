/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
/**
 * `test` and `expect`, re-exported from `bun:test` so TypeScript can see them.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Two problems this avoids, both verified against admin-ui:
 *
 * 1. `bun-types` is not installed, and adding it as a dependency is not wanted.
 *    So `import { test, expect } from "bun:test"` is TS2307 and breaks
 *    `npx tsc --noEmit` (and therefore `next build`, which typechecks). Requiring
 *    the module works at runtime but gives `test`/`expect` type `any`.
 *
 * 2. Using bare `require` in two files in the same directory is TS2451 —
 *    "cannot redeclare block-scoped variable 'test'" — because `tsconfig.json`
 *    declares no `include`/`exclude` (the Next.js default includes every `.ts`
 *    file in the project), so a file with no top-level import or export is
 *    compiled as a *global script* and shares scope with its siblings. Every test
 *    file would therefore need `export {}`, which is a per-file footgun nobody
 *    remembers.
 *
 * Importing from here solves both: this file has an `export`, so every importer is
 * a module with its own scope, and the cast gives the matchers real types.
 *
 * Do NOT "fix" the underlying type error by adding test globs to a `tsconfig`
 * `exclude`. `tsc` is the only thing that catches these errors — `bun test` passes
 * happily against a build that is broken — so excluding tests from the typecheck
 * would hide exactly the class of bug this file's existence is about.
 */
export const { test, expect } = require('bun:test') as any;
