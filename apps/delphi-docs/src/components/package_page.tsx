/**
 * @fileoverview A section's first page: its package's docstring, its own MDX
 * if written, and a card per class.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {PrevNext, breadcrumb, sectionOf} from 'pat-components';
import {Link} from 'react-router-dom';

import {packageDoc} from '../api';
import {MDX} from '../content/mdx';
import {NAV} from '../content/registry';
import type {ClassEntry, PackageEntry} from '../content/registry';
import {Doc, Inline} from './doc';
import {MdxBody} from './mdx_body';

/** Props of PackagePage. */
export interface PackagePageProps {
  entry: PackageEntry;
}

/** Renders a package's overview. */
export function PackagePage({entry}: PackagePageProps) {
  const doc = packageDoc(entry.package);
  const section = sectionOf(NAV, entry.slug);
  const classes = (section?.pages ?? []).filter(
    (page): page is ClassEntry => page.kind === 'class',
  );
  const load = MDX.packages[entry.package];
  return (
    <article className="page prose">
      <p className="eyebrow">{breadcrumb(NAV, entry.slug)}</p>
      <h1>{section?.title ?? entry.package}</h1>
      <div className="meta-row">
        <code className="class-badge">{entry.package}</code>
      </div>
      {doc?.docstring && <Doc text={doc.docstring} />}
      {load && <MdxBody load={load} />}
      <h2 id="classes">Classes</h2>
      <div className="card-grid">
        {classes.map(page => (
          <Link key={page.slug} className="card card-link" to={`/${page.slug}`}>
            <span className="card-title">{page.title}</span>
            <span className="card-meta">{page.className}</span>
            {page.summary && (
              <span className="card-body">
                <Inline text={page.summary} />
              </span>
            )}
          </Link>
        ))}
      </div>
      <PrevNext tree={NAV} />
    </article>
  );
}
