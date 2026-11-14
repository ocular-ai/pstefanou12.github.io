/**
 * @fileoverview Every paper the classes implement, with the pages that use each.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {Link} from 'react-router-dom';

import {PAPERS, pagesCiting} from '../content/papers';
import {Citation} from './citation';

/** Every paper the classes implement, with the pages that use each. */
export function PaperList() {
  return (
    <ul className="references paper-list">
      {Object.values(PAPERS).map(paper => {
        const pages = pagesCiting(paper.key);
        return (
          <li key={paper.key}>
            <Citation paper={paper} />
            {pages.length > 0 && (
              <span className="paper-pages">
                {' '}
                Used by:{' '}
                {pages.map((page, i) => (
                  <span key={page.slug}>
                    {i > 0 && ', '}
                    <Link to={`/${page.slug}`}>{page.title}</Link>
                  </span>
                ))}
                .
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
