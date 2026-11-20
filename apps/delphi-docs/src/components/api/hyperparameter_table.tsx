/**
 * @fileoverview A config's fields, grouped by the config class that declares
 * them: the model's own open, the shared ones folded.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import {Description, Table} from 'pat-components';

import type {Config, ConfigField, ConfigGroup} from '../../api';
import {Inline} from '../doc';

interface FieldTableProps {
  fields: readonly ConfigField[];
}

function FieldTable({fields}: FieldTableProps) {
  return (
    <Table className="api-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {fields.map(field => (
          <tr key={field.name}>
            <td>
              <code className="api-name">{field.name}</code>
              {field.type && <div className="api-type">{field.type}</div>}
            </td>
            <td>
              {field.required ? (
                <span className="required">required</span>
              ) : (
                <code>{field.default}</code>
              )}
            </td>
            <td>
              <Description>
                {field.description && <Inline text={field.description} />}
              </Description>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

interface GroupProps {
  group: ConfigGroup;
}

function FoldedGroup({group}: GroupProps) {
  return (
    <details className="disclosure">
      <summary>
        <code>{group.name}</code>{' '}
        <span className="badge">{group.fields.length}</span>
        {group.summary && (
          <span className="disclosure-note"> {group.summary}</span>
        )}
      </summary>
      <FieldTable fields={group.fields} />
    </details>
  );
}

/** Props of HyperparameterTable. */
export interface HyperparameterTableProps {
  config: Config;
}

/**
 * How to pass hyperparameters, then the config's own fields, then the
 * groups it inherits, folded.
 */
export function HyperparameterTable({config}: HyperparameterTableProps) {
  const [own, ...shared] = config.groups;
  return (
    <>
      <p>
        Pass any of these as <code>{'hyperparameters={"key": value}'}</code>.
        They are validated by <code>{config.name}</code>; a key it does not
        declare is ignored with a warning.
      </p>
      {own && <FieldTable fields={own.fields} />}
      {shared.length > 0 && (
        <>
          <p>Inherited from the shared configs:</p>
          {shared.map(group => (
            <FoldedGroup key={group.name} group={group} />
          ))}
        </>
      )}
    </>
  );
}
