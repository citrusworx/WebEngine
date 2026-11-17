---
"@citrusworx/juiceui": patch
---

Stop shipping declaration files that no package export or types entry can reach: `dist/js/juice.d.ts`, `dist/components/index.d.ts`, and `dist/components/form/cc/cc.d.ts`. The types build no longer includes `src/js/juice.ts`, `src/components/index.ts`, or `src/components/form/cc/cc.tsx`, and `package.json` `files` omits those three outputs. `dist/components/accordion/accordion.d.ts` stays, because `dist/index.d.ts` re-exports `Accordion` from it. Declare `license` (`MIT`, the license `@citrusworx/nectarine` publishes), `repository` (`directory`: `libraries/juice`), and `description`, and ship `LICENSE`.
