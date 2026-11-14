# delphi-docs

The [delphi.ai](https://github.com/pstefanou12/delphi.ai) documentation,
served at `/delphi/`. Built with Vite, React and MDX on `pat-components` and
`pat-styles`.

```bash
just dev          # hot reload at http://localhost:5173/
just docs-api     # regenerate the manifest, its schema and types from ~/delphi.ai
                  # (DELPHI_AI=<path>, DELPHI_REF=<git ref> for unmerged work)
```

## Where the content comes from

The API reference and most of the navigation come from delphi.ai's
**manifest**, `src/generated/api.json`. `scripts/export_api.py` writes it by
discovering the package. It lists nothing by hand:

- A **class** is documented if it is public and defined in a module named
  after it, or is a subclass of that class defined in the same module.
- Its **package** becomes a section of the navbar part named after the
  top-level package: `delphi.distributions.truncated` is *Distributions ›
  Truncated*.
- **Estimates**, **methods** and **properties** come from the class.
  **Hyperparameters** come from its config, grouped by the config class that
  declares each field.

`src/generated/api_types.ts` is generated from the manifest's JSON Schema.
`src/api_test.ts` validates the manifest against that schema.

What is written by hand here:

| Path | What it holds |
|---|---|
| `src/content/registry.ts` | The navbar's order, its guides, and which packages are parts. |
| `src/content/guides/<slug>.mdx` | Guides. |
| `src/content/classes/<ClassName>.mdx` | Optional prose and math for a class page. |
| `src/content/packages/<package>.mdx` | Optional prose for a section's overview. |
| `src/content/papers.ts` | Papers per class, until delphi.ai declares `references`. |
| `src/components/` | Class, package and guide page templates, API tables. |
| `e2e/` | The Playwright smoke test of the assembled site (`just e2e`). |

**Moving into delphi.ai.** `scripts/export_api.py` moves to delphi.ai as
`tools/export_api.py` (delphi.ai#76). delphi.ai then commits the manifest and
checks it is current in CI. This app will pin a delphi.ai ref and sync the
manifest at build time.
