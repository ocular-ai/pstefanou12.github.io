/**
 * @fileoverview Renders manifest signatures as the Python that declares them.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import type {ClassDoc, Method, Param} from '../../api';

function paramSource(param: Param): string {
  const star =
    param.kind === 'var_positional'
      ? '*'
      : param.kind === 'var_keyword'
        ? '**'
        : '';
  const annotation = param.type ? `: ${param.type}` : '';
  const fallback = param.default !== null ? ` = ${param.default}` : '';
  return `${star}${param.name}${annotation}${fallback}`;
}

// Each parameter's source, with the bare `*` and `/` markers Python needs.
function paramSources(params: readonly Param[]): string[] {
  const out: string[] = [];
  params.forEach((param, i) => {
    const previous = params[i - 1];
    if (
      param.kind === 'keyword_only' &&
      previous?.kind !== 'keyword_only' &&
      previous?.kind !== 'var_positional'
    ) {
      out.push('*');
    }
    out.push(paramSource(param));
    if (
      param.kind === 'positional_only' &&
      params[i + 1]?.kind !== 'positional_only'
    ) {
      out.push('/');
    }
  });
  return out;
}

/** The constructor as a class declaration, one parameter per line. */
export function constructorSource(doc: ClassDoc): string {
  const lines = paramSources(doc.params).map(source => `    ${source},`);
  return lines.length === 0
    ? `class ${doc.name}()`
    : `class ${doc.name}(\n${lines.join('\n')}\n)`;
}

/** A method's parameter list and return type: `(S: Tensor) -> Self`. */
export function methodSignature(method: Method): string {
  const returns = method.returns ? ` -> ${method.returns}` : '';
  return `(${paramSources(method.params).join(', ')})${returns}`;
}

/** Returns the arguments a call must pass: required, not keyword-only. */
export function requiredArguments(params: readonly Param[]): string {
  return params
    .filter(
      param =>
        param.default === null &&
        (param.kind === 'positional_only' ||
          param.kind === 'positional_or_keyword'),
    )
    .map(param => param.name)
    .join(', ');
}
