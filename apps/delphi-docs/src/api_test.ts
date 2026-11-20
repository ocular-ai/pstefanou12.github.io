/**
 * @fileoverview Validates generated/api.json against the JSON Schema its
 * TypeScript types are generated from, which is what makes api.ts's typed
 * read of it safe.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 * @vitest-environment node
 */

import {Ajv2020} from 'ajv/dist/2020.js';
import {describe, expect, it} from 'vitest';

import manifest from './generated/api.json';
import schema from './generated/api.schema.json';

describe('api manifest', () => {
  it('matches its schema', () => {
    const validate = new Ajv2020({allErrors: true, strict: false}).compile(
      schema,
    );
    expect(validate(manifest) ? [] : validate.errors).toEqual([]);
  });
});
