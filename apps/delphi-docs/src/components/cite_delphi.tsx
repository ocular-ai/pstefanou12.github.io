/**
 * @fileoverview How to cite delphi.ai: its CITATION.cff, from the manifest,
 * as BibTeX.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {CodeBlock} from 'pat-components';

import {MANIFEST} from '../api';
import type {Citation} from '../api';

/** Returns a citation as a BibTeX @software entry. */
export function bibtex(citation: Citation): string {
  const surname = citation.authors[0]?.split(',')[0] ?? 'delphi';
  const key = `${surname.toLowerCase()}_delphi`;
  return [
    `@software{${key},`,
    `  author  = {${citation.authors.join(' and ')}},`,
    `  title   = {${citation.title}},`,
    `  url     = {${citation.url}},`,
    `  version = {${citation.version}},`,
    '}',
  ].join('\n');
}

/** delphi.ai's citation message and BibTeX entry. */
export function CiteDelphi() {
  const citation = MANIFEST.citation;
  if (!citation) return null;
  return (
    <>
      <p>{citation.message}</p>
      <CodeBlock>
        <code className="language-bibtex">{bibtex(citation)}</code>
      </CodeBlock>
    </>
  );
}
