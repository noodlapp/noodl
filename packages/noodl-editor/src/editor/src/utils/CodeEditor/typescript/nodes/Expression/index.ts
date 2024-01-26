import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { CodeEditorType } from '../../../../../views/panels/propertyeditor/CodeEditor';
import { TypescriptModule } from '../../helper';

function expressionLib() {
  return `
/** Pi. This is the ratio of the circumference of a circle to its diameter. */
declare const pi: number;

/**
 * Returns the smaller of a set of supplied numeric expressions.
 * @param values Numeric expressions to be evaluated.
 */
declare function min(...values: number[]): number;

/**
 * Returns the larger of a set of supplied numeric expressions.
 * @param values Numeric expressions to be evaluated.
 */
declare function max(...values: number[]): number;

/**
 * Returns the cosine of a number.
 * @param x A numeric expression that contains an angle measured in radians.
 */
declare function cos(x: number): number;

/**
 * Returns the sine of a number.
 * @param x A numeric expression that contains an angle measured in radians.
 */
declare function sin(x: number): number;

/**
 * Returns the tangent of a number.
 * @param x A numeric expression that contains an angle measured in radians.
 */
declare function tan(x: number): number;

/**
 * Returns the square root of a number.
 * @param x A numeric expression.
 */
declare function sqrt(x: number): number;

/**
 * Returns a supplied numeric expression rounded to the nearest integer.
 * @param x The value to be rounded to the nearest integer.
 */
declare function round(x: number): number;

/**
 * Returns the greatest integer less than or equal to its numeric argument.
 * @param x A numeric expression.
 */
declare function floor(x: number): number;

/**
 * Returns the smallest integer greater than or equal to its numeric argument.
 * @param x A numeric expression.
 */
declare function ceil(x: number): number;

/**
 * Returns the absolute value of a number (the value without regard to whether it is positive or negative).
 * For example, the absolute value of -5 is the same as the absolute value of 5.
 * @param x A numeric expression for which the absolute value is needed.
 */
declare function abs(x: number): number;

/** Returns a pseudorandom number between 0 and 1. */
declare function random(): number;
`;
}

function buildNodeLib() {
  const libPathName = 'inmemory://@noodl/nodes/Expression/Expression.d.ts';
  const libUri = monaco.Uri.parse(libPathName);

  const source = expressionLib();

  return {
    source,
    libPathName,
    libUri
  };
}

export function registerOrUpdate_Expression(): TypescriptModule {
  const { source, libPathName, libUri } = buildNodeLib();

  const pkg = new TypescriptModule();
  pkg.setLib([]);

  // Try get the model
  const model = monaco.editor.getModel(libUri);
  if (model) {
    pkg.setModel(model);
    pkg.setSource(source);
  } else {
    const model = monaco.editor.createModel(source, 'typescript', libUri);
    pkg.setModel(model);

    pkg.setExtraLib(monaco.languages.typescript.javascriptDefaults.addExtraLib(source, libPathName));
    pkg.setSource(source);
  }

  return pkg;
}
