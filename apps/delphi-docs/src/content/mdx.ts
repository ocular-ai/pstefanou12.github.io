/**
 * @fileoverview Lazy loaders for the MDX pages: guides by slug, class prose by
 * class name, and package intros by package name. A class or package without
 * a file has no loader and renders from the manifest alone.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import type {ComponentType} from 'react';

/** What importing an MDX file yields. */
export interface MdxModule {
  default: ComponentType;
}

/** Imports one MDX page on demand. */
export type MdxLoader = () => Promise<MdxModule>;

/** The folders MDX lives in, under content/. */
export type MdxFolder = 'guides' | 'classes' | 'packages';

function byName(
  modules: Record<string, MdxLoader>,
): Readonly<Record<string, MdxLoader>> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, load]) => [
      path.replace(/^.*\//, '').replace(/\.mdx$/, ''),
      load,
    ]),
  );
}

/** Loaders for content/<folder>/<name>.mdx, by folder and name. */
export const MDX: Readonly<
  Record<MdxFolder, Readonly<Record<string, MdxLoader>>>
> = {
  guides: byName(import.meta.glob<MdxModule>('./guides/*.mdx')),
  classes: byName(import.meta.glob<MdxModule>('./classes/*.mdx')),
  packages: byName(import.meta.glob<MdxModule>('./packages/*.mdx')),
};
