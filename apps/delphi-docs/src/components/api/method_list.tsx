/**
 * @fileoverview A class's public methods and properties, with signatures and
 * summaries.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {Description} from 'pat-components';

import type {Method, Property} from '../../api';
import {Inline} from '../doc';
import {methodSignature} from './python_source';

interface MemberProps {
  name: string;
  signature: string;
  summary: string;
  definedIn: string;
}

function Member({name, signature, summary, definedIn}: MemberProps) {
  return (
    <div className="method">
      <dt title={`Defined in ${definedIn}`}>
        <code>
          <span className="api-name">{name}</span>
          <span className="api-type">{signature}</span>
        </code>
      </dt>
      <dd>
        <Description>{summary && <Inline text={summary} />}</Description>
      </dd>
    </div>
  );
}

/** Props of MethodList. */
export interface MethodListProps {
  methods: readonly Method[];
}

/** A definition list of methods. */
export function MethodList({methods}: MethodListProps) {
  return (
    <dl className="method-list">
      {methods.map(method => (
        <Member
          key={method.name}
          name={method.name}
          signature={methodSignature(method)}
          summary={method.summary}
          definedIn={method.definedIn}
        />
      ))}
    </dl>
  );
}

/** Props of PropertyList. */
export interface PropertyListProps {
  properties: readonly Property[];
}

/** A definition list of properties, each with its type. */
export function PropertyList({properties}: PropertyListProps) {
  return (
    <dl className="method-list">
      {properties.map(property => (
        <Member
          key={property.name}
          name={property.name}
          signature={property.type ? `: ${property.type}` : ''}
          summary={property.summary}
          definedIn={property.definedIn}
        />
      ))}
    </dl>
  );
}
