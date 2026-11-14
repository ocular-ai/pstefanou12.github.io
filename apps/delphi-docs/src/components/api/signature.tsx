/**
 * @fileoverview A constructor rendered as Python source.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {CodeBlock} from 'pat-components';

import type {ClassDoc} from '../../api';
import {constructorSource} from './python_source';

/** Props of Signature. */
export interface SignatureProps {
  doc: ClassDoc;
}

/** The constructor, one parameter per line. */
export function Signature({doc}: SignatureProps) {
  return (
    <CodeBlock>
      <code className="language-python">{constructorSource(doc)}</code>
    </CodeBlock>
  );
}
