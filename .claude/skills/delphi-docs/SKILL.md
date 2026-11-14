---
name: delphi-docs
description: Update the delphi.ai documentation in apps/delphi-docs: refresh the API manifest from delphi.ai, add or edit a model or guide page, and preview the site. Use when delphi.ai changes or a docs page needs writing.
---

# delphi.ai docs

## Refresh the API reference

1. `just docs-api` regenerates `apps/delphi-docs/src/generated/` (the
   manifest, its JSON Schema, and the TypeScript types) from
   `~/delphi.ai`. For an unmerged branch:
   `DELPHI_REF=<branch> just docs-api`.
2. `just test` fails if the manifest does not match its schema, a page
   names a class the manifest lacks, or an MDX link points nowhere. Fix the
   exporter, the registry or the MDX, never the test.

## Add a model page

1. Nothing to register: a public class in a module named after it gets a
   page in its package's section once the manifest is regenerated.
2. Optional prose and math: `src/content/classes/<ClassName>.mdx`. A
   section's overview takes `src/content/packages/<package>.mdx`. Every code
   example must be run against delphi.ai before it is published.
3. A wrong title, summary or estimate is fixed in delphi.ai (its docstring,
   `display_name`, or property names), not here.

## Check and preview

- `just check`, then `just e2e`, then `just preview` and read the page at
  `http://localhost:8000/delphi/#/<slug>` in both themes and at phone width.
- Follow `CLAUDE.md`: file headers, named exports, no hard-coded facts that
  delphi.ai owns.
