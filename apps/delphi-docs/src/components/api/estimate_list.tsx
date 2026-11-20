/**
 * @fileoverview The estimates a fitted model exposes, each read at every
 * iterate delphi.ai reports (its `constants.Estimator`).
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {Table} from 'pat-components';

import {MANIFEST} from '../../api';
import type {Estimator} from '../../api';

// TODO(pstefanou12): Delete once constants.Estimator documents its members
// (delphi.ai#76); the manifest's descriptions are then never empty.
const INTERIM_DESCRIPTIONS: Readonly<Record<string, string>> = {
  avg: 'Mean of the iterates after the burn-in. The one the guarantees are about; use this.',
  ema: 'Bias-corrected exponential moving average of the iterates.',
  final: 'The last iterate.',
  best: 'The iterate with the lowest validation loss.',
};

function describe(estimator: Estimator): string {
  return estimator.description || (INTERIM_DESCRIPTIONS[estimator.name] ?? '');
}

/** Props of EstimateList. */
export interface EstimateListProps {
  /** Estimate names, such as "rate_". */
  estimates: readonly string[];
}

/** A row per iterate, a column per estimate: `avg_rate_`, `ema_rate_`, ... */
export function EstimateList({estimates}: EstimateListProps) {
  return (
    <Table className="api-table estimates">
      <thead>
        <tr>
          <th>Iterate</th>
          {estimates.map(estimate => (
            <th key={estimate}>
              <code>{estimate}</code>
            </th>
          ))}
          <th>Meaning</th>
        </tr>
      </thead>
      <tbody>
        {MANIFEST.estimators.map(estimator => (
          <tr key={estimator.name}>
            <td>
              <code>{estimator.name}_</code>
            </td>
            {estimates.map(estimate => (
              <td key={estimate}>
                <code className="api-name">
                  {estimator.name}_{estimate}
                </code>
              </td>
            ))}
            <td>{describe(estimator)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
