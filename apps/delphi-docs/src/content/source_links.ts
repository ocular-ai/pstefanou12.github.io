/**
 * @fileoverview Where a page's source lives: its MDX on this site, and its
 * class's Python source in delphi.ai.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {pageBySlug} from 'pat-components';
import type {SourceLink} from 'pat-components';

import {classDoc} from '../api';
import type {ClassDoc} from '../api';
import {MDX} from './mdx';
import type {MdxFolder} from './mdx';
import {GITHUB, NAV, SITE_SOURCE, SOURCE_BRANCH} from './registry';
import type {Entry} from './registry';

/** Returns the GitHub URL of a class's definition. */
export function sourceUrl(doc: ClassDoc): string {
  return `${GITHUB}/blob/${SOURCE_BRANCH}/${doc.source.path}#L${doc.source.line}`;
}

/** Returns the MDX folder and file name a page reads, if it reads one. */
export function mdxFile(
  entry: Entry,
): {folder: MdxFolder; name: string} | undefined {
  switch (entry.kind) {
    case 'guide':
      return {folder: 'guides', name: entry.slug};
    case 'class':
      return {folder: 'classes', name: entry.className};
    case 'package':
      return {folder: 'packages', name: entry.package};
  }
}

/** Returns "Edit on GitHub" for a page's MDX, and its class's source. */
export function sourceLinks(slug: string): SourceLink[] {
  const entry = pageBySlug(NAV, slug);
  if (!entry) return [];
  const links: SourceLink[] = [];
  const file = mdxFile(entry);
  if (file && MDX[file.folder][file.name]) {
    links.push({
      label: 'Edit on GitHub',
      href: `${SITE_SOURCE}/${file.folder}/${file.name}.mdx`,
    });
  }
  const doc = entry.kind === 'class' ? classDoc(entry.key) : undefined;
  if (doc) links.push({label: 'Show source', href: sourceUrl(doc)});
  return links;
}
