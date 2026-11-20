/**
 * @fileoverview The docs' routes: the landing page, and every page of the
 * navigation at /<slug>, inside the shared docs shell.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {DocsShell, pageBySlug} from 'pat-components';
import {Navigate, Route, Routes, useParams} from 'react-router-dom';

import {MANIFEST} from './api';
import {ClassPage} from './components/class_page';
import {GuidePage} from './components/guide_page';
import {Home} from './components/home';
import {PackagePage} from './components/package_page';
import {GITHUB, NAV} from './content/registry';
import {sourceLinks} from './content/source_links';

const BRAND = {mark: 'δ', name: 'delphi.ai', version: MANIFEST.version};

function Page() {
  const {slug = ''} = useParams();
  const entry = pageBySlug(NAV, slug);
  if (!entry) return <Navigate to="/" replace />;
  switch (entry.kind) {
    case 'guide':
      return <GuidePage key={slug} entry={entry} />;
    case 'class':
      return <ClassPage key={slug} entry={entry} />;
    case 'package':
      return <PackagePage key={slug} entry={entry} />;
  }
}

/** The app: every route inside the docs shell. */
export function App() {
  return (
    <Routes>
      <Route
        element={
          <DocsShell
            tree={NAV}
            brand={BRAND}
            repositoryUrl={GITHUB}
            sourceLinks={sourceLinks}
          />
        }
      >
        <Route index element={<Home />} />
        <Route path=":slug" element={<Page />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
