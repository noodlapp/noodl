import type { NodeRegister, GraphModel, TSFixme } from '../typings/global';
import FontLoader from './fontloader';

function getInputsWithType(nodeScope, inputType) {
  const result = [];

  const nodes = nodeScope.getAllNodesRecursive();
  nodes.forEach((node) => {
    const inputs = [];

    for (const inputName in node._inputs) {
      const input = node._inputs[inputName];
      if (input.type === inputType) {
        inputs.push(inputName);
      }
    }

    if (inputs.length) {
      result.push({ node, inputs });
    }
  });

  return result;
}

type TextStyleData = {
  letterSpacing: string;
  lineHeight: { value: string; unit: string };
  textTransform: string;
  fontSize: { value: string; unit: string };
  fontFamily: string;
  color: string;
};

type StylesData = {
  text?: Record<string, TextStyleData>;
  colors?: Record<string, string>;
};

export default class Styles {
  getNodeScope: () => TSFixme;
  graphModel: GraphModel;
  nodeRegister: NodeRegister;
  styles: StylesData;

  constructor({ graphModel, nodeRegister, getNodeScope }) {
    this.getNodeScope = getNodeScope;
    this.graphModel = graphModel;
    this.nodeRegister = nodeRegister;

    this.setStyles(graphModel.getMetaData('styles') || {});
    graphModel.on('metadataChanged.styles', (styles) => this.setStyles(styles));
  }

  setStyles(styles: StylesData) {
    // Brute force update all styles, no delta check
    this.styles = styles;

    // Process text styles
    const textStyles = styles.text || {};

    // Format font family
    Object.values(textStyles)
      .filter((style) => style.fontFamily)
      .forEach((textStyle) => {
        let family = textStyle.fontFamily;

        // Load files and create font css
        if (family.split('.').length > 1) {
          FontLoader.instance.loadFont(family);
          family = family.replace(/\.[^/.]+$/, '');
          family = family.split('/').pop();

          // Update the style to the font css instead of the file name
          textStyle.fontFamily = family;
        }
      });

    // Format values with units (to css strings)
    for (const name in textStyles) {
      const style = textStyles[name];
      for (const prop in style) {
        const value = style[prop];
        if (typeof value === 'object') {
          style[prop] = value.value + value.unit;
        }
      }
    }

    // Remove colors with empty strings
    for (const name in textStyles) {
      const style = textStyles[name];
      if (style.hasOwnProperty('color') && !style.color) {
        delete style.color;
      }
    }

    const nodeScope = this.getNodeScope && this.getNodeScope();
    if (!nodeScope) return;

    const variants = this.graphModel.getVariants();
    for (const variant of variants) {
      if (this._variantHasInputsWithTypes(variant, ['color', 'textStyle'])) {
        const nodes = nodeScope.getAllNodesWithVariantRecursive(variant);
        nodes.forEach((node) => node.setVariant(variant));
      }
    }

    //set all inputs with types using styles
    //just re-apply the previous value to trigger a new style resolve
    ['color', 'textStyle'].forEach((inputType) => {
      getInputsWithType(nodeScope, inputType).forEach(({ node, inputs }) => {
        inputs.forEach((inputName) => {
          if (node.getInputValue(inputName)) {
            node.setInputValue(inputName, node.getInputValue(inputName));
          }
        });
      });
    });
  }

  resolveColor(color: string) {
    if (!this.styles.colors) return color;

    const resolvedColor = this.styles.colors[color];
    return resolvedColor ? resolvedColor : color;
  }

  getTextStyle(styleName: string) {
    if (!this.styles.text) return {};
    return this.styles.text[styleName] || {};
  }

  //checks if a variant includes inputs with the specified types
  _variantHasInputsWithTypes(variant, types) {
    if (!this.nodeRegister.hasNode(variant.typename)) return;

    //get the metadata for the node this variant is used by
    const metadata = this.nodeRegister.getNodeMetadata(variant.typename);

    //get all the inputs this variant affects...
    const parameterNames = new Set(Object.keys(variant.parameters));
    for (const state in variant.stateParameters) {
      Object.keys(variant.stateParameters[state]).forEach((param) => parameterNames.add(param));
    }

    //...and check if the inputs are of the supplied types
    for (const param of Array.from(parameterNames)) {
      const inputType = metadata.inputs[param] && metadata.inputs[param].type;
      if (types.includes(inputType)) {
        return true;
      }
    }

    return false;
  }
}
