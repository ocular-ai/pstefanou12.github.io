/**
 * @fileoverview The template every class page shares: header and usage, the
 * page's own MDX if written, the API reference generated from the manifest,
 * and the papers the class implements.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {CodeBlock, PrevNext, breadcrumb} from 'pat-components';
import {Link} from 'react-router-dom';

import {classDoc, configDoc} from '../api';
import type {ClassDoc} from '../api';
import {MDX} from '../content/mdx';
import {papersOf} from '../content/papers';
import {NAV} from '../content/registry';
import type {ClassEntry} from '../content/registry';
import {EstimateList} from './api/estimate_list';
import {HyperparameterTable} from './api/hyperparameter_table';
import {MethodList, PropertyList} from './api/method_list';
import {ParamTable} from './api/param_table';
import {requiredArguments} from './api/python_source';
import {Signature} from './api/signature';
import {Citation} from './citation';
import {Doc, Inline} from './doc';
import {ExponentialFamilyMethod} from './exponential_family_method';
import {MdxBody} from './mdx_body';

/** The base whose subclasses share the generic exponential-family method. */
const EXPONENTIAL_FAMILY_BASE = 'TruncatedExponentialFamilyDistribution';

/** Props of ClassPage. */
export interface ClassPageProps {
  entry: ClassEntry;
}

// How to import and construct the class, and fit it when it has `fit`.
function usageSnippet(doc: ClassDoc): string {
  const path = doc.module.split('.');
  const leaf = path[path.length - 1];
  const lines = [
    `from ${path.slice(0, -1).join('.')} import ${leaf}`,
    '',
    `model = ${leaf}.${doc.name}(${requiredArguments(doc.params)})`,
  ];
  const fit = doc.methods.find(method => method.name === 'fit');
  if (fit) lines.push(`model.fit(${requiredArguments(fit.params)})`);
  return lines.join('\n');
}

interface ReferenceProps {
  doc: ClassDoc;
}

// Constructor, estimates, methods, properties and hyperparameters.
function ApiReference({doc}: ReferenceProps) {
  const config = configDoc(doc.config);
  const raises = Object.entries(doc.raises);
  return (
    <>
      <h2 id="api-reference">API reference</h2>
      <h3 id="constructor">Constructor</h3>
      <Signature doc={doc} />
      <ParamTable params={doc.params} />
      {raises.length > 0 && (
        <ul className="raises">
          {raises.map(([error, why]) => (
            <li key={error}>
              <code>{error}</code>: {why}
            </li>
          ))}
        </ul>
      )}

      {doc.estimates.length > 0 && (
        <>
          <h3 id="estimates">Estimates</h3>
          <EstimateList estimates={doc.estimates} />
        </>
      )}

      {doc.methods.length > 0 && (
        <>
          <h3 id="methods">Methods</h3>
          <MethodList methods={doc.methods} />
        </>
      )}

      {doc.properties.length > 0 && (
        <>
          <h3 id="properties">Properties</h3>
          <PropertyList properties={doc.properties} />
        </>
      )}

      {config && (
        <>
          <h3 id="hyperparameters">Hyperparameters</h3>
          <HyperparameterTable config={config} />
        </>
      )}
    </>
  );
}

/** Renders a class's page. */
export function ClassPage({entry}: ClassPageProps) {
  const doc = classDoc(entry.key);
  if (!doc) {
    return (
      <article className="page prose">
        <h1>{entry.title}</h1>
        <p className="callout callout-warning">
          No manifest record for <code>{entry.key}</code>. Run{' '}
          <code>just docs-api</code>.
        </p>
      </article>
    );
  }
  const load = MDX.classes[doc.name];
  const papers = papersOf(doc);

  return (
    <article className="page prose">
      <p className="eyebrow">{breadcrumb(NAV, entry.slug)}</p>
      <h1>{entry.title}</h1>
      {doc.summary && (
        <p className="lead">
          <Inline text={doc.summary} />
        </p>
      )}
      <div className="meta-row">
        <code className="class-badge">{doc.name}</code>
        {doc.abstract && <span className="badge">abstract base class</span>}
      </div>

      {!doc.abstract && (
        <CodeBlock>
          <code className="language-python">{usageSnippet(doc)}</code>
        </CodeBlock>
      )}

      {/* The class docstring stands in for prose until the page has its own. */}
      {!load && doc.docstring && doc.docstring !== doc.summary && (
        <div className="docstring">
          <Doc text={doc.docstring} />
        </div>
      )}

      {!load && doc.bases.includes(EXPONENTIAL_FAMILY_BASE) && (
        <ExponentialFamilyMethod className={doc.name} />
      )}
      {load && <MdxBody load={load} />}

      <ApiReference doc={doc} />

      {papers.length > 0 && (
        <>
          <h2 id="references">References</h2>
          <p>
            The class implements or builds on the following. See{' '}
            <Link to="/citing">Citing</Link> to cite delphi.ai itself.
          </p>
          <ul className="references">
            {papers.map(paper => (
              <li key={paper.key}>
                <Citation paper={paper} />
              </li>
            ))}
          </ul>
        </>
      )}

      <PrevNext tree={NAV} />
    </article>
  );
}
