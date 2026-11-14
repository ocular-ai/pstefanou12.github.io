/**
 * @fileoverview The docs' navigation. Guides are listed here; everything
 * else derives from the delphi.ai manifest: a package part's sections are
 * its packages that hold classes, and their pages are those classes.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {allPages} from 'pat-components';
import type {NavPage, NavPart, NavSection, NavTree} from 'pat-components';

import {MANIFEST, classEntries, packageDoc} from '../api';
import type {ClassDoc} from '../api';

/** A page of prose, rendered from content/guides/<slug>.mdx. */
export interface GuideEntry extends NavPage {
  readonly kind: 'guide';
  readonly summary: string;
}

/** A class's page, rendered from its manifest record and optional MDX. */
export interface ClassEntry extends NavPage {
  readonly kind: 'class';
  /** Key into the manifest's classes: module.Class. */
  readonly key: string;
  readonly className: string;
  readonly summary: string;
}

/** A section's first page: its package's docstring and its classes. */
export interface PackageEntry extends NavPage {
  readonly kind: 'package';
  /** Key into the manifest's packages. */
  readonly package: string;
  readonly summary: string;
}

/** Any page in the docs. */
export type Entry = GuideEntry | ClassEntry | PackageEntry;

/** A group of pages in the sidebar. */
export type Section = NavSection<Entry>;

/** A tab of the navbar, with the one line its landing-page card shows. */
export interface Part extends NavPart<Entry> {
  readonly summary: string;
}

/** A part of hand-written guides. */
interface GuidePartSpec {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly guides: readonly GuideEntry[];
}

/** A part documenting a delphi package, e.g. "delphi.stats". */
interface PackagePartSpec {
  readonly package: string;
}

type PartSpec = GuidePartSpec | PackagePartSpec;

/** The delphi.ai repository. */
export const GITHUB = MANIFEST.repository;
/** The branch source links point at. */
export const SOURCE_BRANCH = 'master';
/** Where this site's MDX lives, for "Edit on GitHub" links. */
export const SITE_SOURCE =
  'https://github.com/pstefanou12/pstefanou12.github.io/edit/main/apps/delphi-docs/src/content';

/**
 * Package names whose sections come first in a part, in this order; the
 * rest follow alphabetically. Truncated is the library's first area.
 */
const SECTIONS_FIRST: readonly string[] = ['truncated'];

function guide(slug: string, title: string, summary: string): GuideEntry {
  return {kind: 'guide', slug, title, summary};
}

/** The navbar's tabs, in order. */
const PART_SPECS: readonly PartSpec[] = [
  {
    id: 'start',
    title: 'Get started',
    summary: 'Install delphi.ai, fit a first model, and learn how fits work.',
    guides: [
      guide('installation', 'Installation', 'Install delphi.ai with Poetry.'),
      guide(
        'quickstart',
        'Quickstart',
        'Write a model, train it with the trainer, and read its estimates.',
      ),
      guide(
        'training-and-estimates',
        'Training and estimates',
        'Hyperparameters, the Fisher schedule, estimates, summaries and logs.',
      ),
      guide(
        'truncation',
        'Truncation',
        'Truncated samples, the truncation set phi, alpha, and learning the set.',
      ),
    ],
  },
  {package: 'delphi.distributions'},
  {package: 'delphi.stats'},
  {package: 'delphi.transformations'},
  {
    id: 'torchnomials',
    title: 'torchnomials',
    summary:
      'Orthogonal polynomial families in torch: Hermite, Laguerre and empirical.',
    guides: [
      guide(
        'torchnomials',
        'torchnomials',
        'Hermite, Laguerre and empirical orthonormal families in torch.',
      ),
    ],
  },
  {
    id: 'notes',
    title: 'Developer notes',
    summary: 'How the trainer fits every model, and what a model supplies.',
    guides: [
      guide(
        'trainer',
        'The trainer',
        'Warm start, phases and runs: how every model is fit.',
      ),
      guide(
        'models',
        'Models',
        'What a DelphiModel supplies, and the layers built on it.',
      ),
    ],
  },
  {
    id: 'contributing',
    title: 'Contributing',
    summary: 'Add a model: what is expected, code style and review.',
    guides: [
      guide(
        'adding-a-model',
        'Adding a model',
        'What a new model needs, the code style, and how it is reviewed.',
      ),
    ],
  },
  {
    id: 'citing',
    title: 'Citing',
    summary: 'Cite delphi.ai, and the papers its models implement.',
    guides: [
      guide(
        'citing',
        'Citing',
        'Cite delphi.ai, and the papers its models implement.',
      ),
    ],
  },
];

/** Returns a CamelCase name as a URL slug: TruncatedLQR → truncated-lqr. */
export function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** Returns the slug of a package's page: delphi.stats.truncated → stats-truncated. */
export function packageSlug(name: string): string {
  return name.replace(/^delphi\./, '').replace(/[._]/g, '-');
}

function classEntry(key: string, doc: ClassDoc): ClassEntry {
  return {
    kind: 'class',
    slug: kebab(doc.name),
    title: doc.title,
    summary: doc.summary,
    key,
    className: doc.name,
    keywords: [doc.name],
  };
}

function byTitle(a: ClassEntry, b: ClassEntry): number {
  return a.title.localeCompare(b.title, 'en', {sensitivity: 'base'});
}

// A package's classes: concrete ones by title, then abstract bases.
function classPages(name: string): ClassEntry[] {
  const docs = classEntries().filter(([, doc]) => doc.package === name);
  const concrete = docs.filter(([, doc]) => !doc.abstract);
  const abstract = docs.filter(([, doc]) => doc.abstract);
  return [
    ...concrete.map(([key, doc]) => classEntry(key, doc)).sort(byTitle),
    ...abstract.map(([key, doc]) => classEntry(key, doc)).sort(byTitle),
  ];
}

function sectionRank(name: string): number {
  const rank = SECTIONS_FIRST.indexOf(name.split('.').pop() ?? '');
  return rank === -1 ? SECTIONS_FIRST.length : rank;
}

function packagePart({package: name}: PackagePartSpec): Part {
  const part = packageDoc(name);
  if (!part) throw new Error(`${name} is not in the manifest`);
  // Subpackages first, then classes defined in the part's package itself.
  const names = Object.keys(MANIFEST.packages)
    .filter(other => other.startsWith(`${name}.`))
    .sort((a, b) => sectionRank(a) - sectionRank(b) || a.localeCompare(b));
  const sections = [...names, name].flatMap((sectionName): Section[] => {
    const pages = classPages(sectionName);
    const section = packageDoc(sectionName);
    if (pages.length === 0 || !section) return [];
    // The part's own classes are shared by its subpackages' sections.
    const title =
      sectionName === name && names.length > 0 ? 'Shared' : section.title;
    const intro: PackageEntry = {
      kind: 'package',
      slug: packageSlug(sectionName),
      title: 'Overview',
      summary: section.summary,
      package: sectionName,
      keywords: [sectionName],
    };
    return [{id: intro.slug, title, pages: [intro, ...pages]}];
  });
  return {
    id: packageSlug(name),
    title: part.title,
    summary: part.summary,
    sections,
  };
}

function guidePart(spec: GuidePartSpec): Part {
  return {
    id: spec.id,
    title: spec.title,
    summary: spec.summary,
    sections: [{id: spec.id, title: spec.title, pages: [...spec.guides]}],
  };
}

/** The navbar's tabs, in order. */
export const PARTS: readonly Part[] = PART_SPECS.map(spec =>
  'package' in spec ? packagePart(spec) : guidePart(spec),
);

/** The whole navigation. */
export const NAV: NavTree<Entry> = {parts: PARTS};

/** Every page, in navigation order. */
export const PAGES: readonly Entry[] = allPages(NAV);

/** Every class page, in navigation order. */
export const CLASS_PAGES: readonly ClassEntry[] = PAGES.filter(
  (page): page is ClassEntry => page.kind === 'class',
);

/** Returns the page of a class by its name, if it has one. */
export function classPage(name: string): ClassEntry | undefined {
  return CLASS_PAGES.find(page => page.className === name);
}
