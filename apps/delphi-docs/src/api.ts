/**
 * @fileoverview The delphi.ai API manifest, typed: generated/api.json, read
 * through the types generated from its JSON Schema.
 * Copyright 2026 Delphi Tech. All Rights Reserved.
 * Author: pstefanou12@
 */

import raw from './generated/api.json';
import type {
  ApiManifest,
  ClassDoc,
  Config,
  Package,
} from './generated/api_types';

export type {
  ApiManifest,
  Citation,
  ClassDoc,
  Config,
  ConfigField,
  ConfigGroup,
  Estimator,
  Method,
  Package,
  Param,
  Property,
  Reference,
} from './generated/api_types';

/**
 * The manifest. Safe: api_test.ts validates api.json against api.schema.json,
 * the schema api_types.ts is generated from; JSON imports widen string
 * literal unions, so TypeScript cannot check this itself.
 */
export const MANIFEST = raw as ApiManifest;

/** Returns a class's record by its qualified name, module.Class. */
export function classDoc(key: string): ClassDoc | undefined {
  return MANIFEST.classes[key];
}

/** Returns a package's record by its dotted name. */
export function packageDoc(name: string): Package | undefined {
  return MANIFEST.packages[name];
}

/** Returns a config by name, or undefined for a class without one. */
export function configDoc(name: string | null): Config | undefined {
  return name === null ? undefined : MANIFEST.configs[name];
}

/** Every documented class with its qualified name. */
export function classEntries(): ReadonlyArray<readonly [string, ClassDoc]> {
  return Object.entries(MANIFEST.classes);
}
