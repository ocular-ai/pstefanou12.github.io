/**
 * @fileoverview Keeps the navigation, the API manifest and the MDX pages
 * consistent: every page resolves, every MDX file and link has a page.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 * @vitest-environment node
 */

import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {describe, expect, it} from 'vitest';

import {classDoc, packageDoc} from '../api';
import {PAPERS, pagesCiting} from './papers';
import {CLASS_PAGES, PAGES, PARTS, classPage} from './registry';
import type {MdxFolder} from './mdx';

const CONTENT_DIR = fileURLToPath(new URL('.', import.meta.url));
const SLUGS = new Set(PAGES.map(page => page.slug));

function mdxNames(folder: MdxFolder): string[] {
  return readdirSync(`${CONTENT_DIR}/${folder}`)
    .filter(name => name.endsWith('.mdx'))
    .map(name => name.replace(/\.mdx$/, ''));
}

function mdxTexts(): Array<[path: string, text: string]> {
  const folders: MdxFolder[] = ['guides', 'classes', 'packages'];
  return folders.flatMap(folder =>
    mdxNames(folder).map((name): [string, string] => {
      const path = `${folder}/${name}.mdx`;
      return [path, readFileSync(`${CONTENT_DIR}/${path}`, 'utf8')];
    }),
  );
}

describe('registry', () => {
  it('gives every page a unique slug', () => {
    expect(SLUGS.size).toBe(PAGES.length);
  });

  it('builds every package part from the manifest', () => {
    for (const part of PARTS) expect(part.sections.length).toBeGreaterThan(0);
    expect(PARTS.map(part => part.id)).toEqual(
      expect.arrayContaining(['distributions', 'stats', 'transformations']),
    );
  });

  it('resolves every class page in the manifest', () => {
    expect(CLASS_PAGES.filter(page => !classDoc(page.key))).toEqual([]);
  });

  it('puts the truncated section first in each part that has one', () => {
    for (const part of PARTS) {
      const ids = part.sections.map(section => section.id);
      const truncated = ids.findIndex(id => id.endsWith('-truncated'));
      if (truncated !== -1) expect(truncated).toBe(0);
    }
  });

  it('has a page for every guide MDX file', () => {
    expect(mdxNames('guides').filter(slug => !SLUGS.has(slug))).toEqual([]);
  });

  it('has a class page for every class MDX file', () => {
    expect(mdxNames('classes').filter(name => !classPage(name))).toEqual([]);
  });

  it('has a package in the manifest for every package MDX file', () => {
    expect(mdxNames('packages').filter(name => !packageDoc(name))).toEqual([]);
  });

  it('only links MDX to pages that exist', () => {
    const broken = mdxTexts().flatMap(([path, text]) =>
      [...text.matchAll(/\]\(\/([a-z0-9-]+)\)/g)]
        .map(match => match[1])
        .filter(slug => !SLUGS.has(slug))
        .map(slug => `${path} → /${slug}`),
    );
    expect(broken).toEqual([]);
  });

  it('cites every paper from at least one page', () => {
    const uncited = Object.keys(PAPERS).filter(
      key => pagesCiting(key).length === 0,
    );
    expect(uncited).toEqual([]);
  });
});
