/**
 * @fileoverview The papers each class implements or builds on: those the
 * manifest records, plus, until delphi.ai declares them, the interim list
 * below.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {MANIFEST, classDoc} from '../api';
import type {ClassDoc, Reference} from '../api';
import {CLASS_PAGES} from './registry';
import type {ClassEntry} from './registry';

// TODO(pstefanou12): Delete INTERIM_PAPERS and INTERIM_CITED_BY once
// delphi.ai's models declare `references` (delphi.ai#76); the manifest then
// carries both.
const INTERIM_PAPERS: Readonly<Record<string, Reference>> = {
  dgtz18: {
    key: 'dgtz18',
    authors:
      'Constantinos Daskalakis, Themis Gouleakis, Christos Tzamos, Manolis Zampetakis',
    year: 2018,
    title: 'Efficient Statistics, in High Dimensions, from Truncated Samples',
    venue: 'FOCS',
    url: 'https://arxiv.org/abs/1809.03986',
  },
  dgtz19: {
    key: 'dgtz19',
    authors:
      'Constantinos Daskalakis, Themis Gouleakis, Christos Tzamos, Manolis Zampetakis',
    year: 2019,
    title: 'Computationally and Statistically Efficient Truncated Regression',
    venue: 'COLT',
    url: 'https://arxiv.org/abs/2010.12000',
  },
  ktz19: {
    key: 'ktz19',
    authors: 'Vasilis Kontonis, Christos Tzamos, Manolis Zampetakis',
    year: 2019,
    title: 'Efficient Truncated Statistics with Unknown Truncation',
    venue: 'FOCS',
    url: 'https://arxiv.org/abs/1908.01034',
  },
  drz20: {
    key: 'drz20',
    authors: 'Constantinos Daskalakis, Dhruv Rohatgi, Manolis Zampetakis',
    year: 2020,
    title: 'Truncated Linear Regression in High Dimensions',
    venue: 'NeurIPS',
    url: 'https://arxiv.org/abs/2007.14539',
  },
  izd20: {
    key: 'izd20',
    authors: 'Andrew Ilyas, Emmanouil Zampetakis, Constantinos Daskalakis',
    year: 2020,
    title:
      'A Theoretical and Practical Framework for Regression and Classification from Truncated Samples',
    venue: 'AISTATS',
    url: 'https://proceedings.mlr.press/v108/ilyas20a.html',
  },
  dsyz21: {
    key: 'dsyz21',
    authors:
      'Constantinos Daskalakis, Patroklos Stefanou, Rui Yao, Manolis Zampetakis',
    year: 2021,
    title: 'Efficient Truncated Linear Regression with Unknown Noise Variance',
    venue: 'NeurIPS',
    url: 'https://arxiv.org/abs/2208.12042',
  },
  lwz23: {
    key: 'lwz23',
    authors: 'Jane H. Lee, Andre Wibisono, Manolis Zampetakis',
    year: 2023,
    title: 'Learning Exponential Families from Truncated Samples',
    venue: 'NeurIPS',
    url: 'https://proceedings.neurips.cc/paper_files/paper/2023/hash/6d5f304fb4ed0243851e41699dca4287-Abstract-Conference.html',
  },
  lmz24: {
    key: 'lmz24',
    authors: 'Jane H. Lee, Anay Mehrotra, Manolis Zampetakis',
    year: 2024,
    title:
      'Efficient Statistics With Unknown Truncation, Polynomial Time Algorithms, Beyond Gaussians',
    venue: 'arXiv',
    url: 'https://arxiv.org/abs/2410.01656',
  },
};

/** The papers a class cites, by class name; subclasses inherit them. */
const INTERIM_CITED_BY: Readonly<Record<string, readonly string[]>> = {
  TruncatedExponentialFamilyDistribution: ['lwz23', 'lmz24'],
  KnownTruncationMultivariateNormal: ['dgtz18'],
  TruncatedMultivariateNormal: ['dgtz18', 'ktz19', 'lmz24'],
  TruncatedNormal: ['ktz19'],
  TruncatedLinearRegression: ['dgtz19', 'dsyz21'],
  TruncatedLassoRegression: ['drz20'],
  TruncatedClassification: ['izd20'],
};

/** Every paper, by key: the manifest's, then the interim ones. */
export const PAPERS: Readonly<Record<string, Reference>> = {
  ...INTERIM_PAPERS,
  ...MANIFEST.references,
};

/** Returns the papers a class cites, its bases' included, in key order. */
export function papersOf(doc: ClassDoc): Reference[] {
  const keys = new Set([
    ...doc.references,
    ...[doc.name, ...doc.bases].flatMap(name => INTERIM_CITED_BY[name] ?? []),
  ]);
  return Object.values(PAPERS).filter(paper => keys.has(paper.key));
}

/** Returns the class pages citing a paper. */
export function pagesCiting(key: string): ClassEntry[] {
  return CLASS_PAGES.filter(page => {
    const doc = classDoc(page.key);
    return doc !== undefined && papersOf(doc).some(paper => paper.key === key);
  });
}
