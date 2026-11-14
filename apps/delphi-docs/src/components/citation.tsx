/**
 * @fileoverview One paper, its title linking to it: authors (year). Title. Venue.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import type {Reference} from '../api';

/** Props of Citation. */
export interface CitationProps {
  paper: Reference;
}

/** One reference, its title linking to the paper: authors (year). Title. Venue. */
export function Citation({paper}: CitationProps) {
  return (
    <span className="citation">
      {paper.authors} ({paper.year}).{' '}
      <a href={paper.url} target="_blank" rel="noopener noreferrer">
        <cite>{paper.title}</cite>
      </a>
      . {paper.venue}.
    </span>
  );
}
