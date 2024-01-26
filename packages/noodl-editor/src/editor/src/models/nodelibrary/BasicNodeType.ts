import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';

import Model from '../../../../shared/model';

export class BasicNodeType extends Model {
  private displayNodeName: TSFixme; // TODO: Where is this from?

  allowAsChild: boolean;
  allowAsExportRoot: boolean;
  allowChildrenWithCategory: string[];
  public category: string;
  color: string;
  connectionPanel: TSFixme;
  public docs: string;
  dynamicports: TSFixme[];
  listeners: TSFixme[];
  listenersOnce: TSFixme[];
  public name: string;
  ports: TSFixme[];
  public runtimeTypes: RuntimeType[];
  shortDocs: string;
  useVariants: boolean;
  visualStates: { name: string; label: string }[];
  nodeDoubleClickAction?: {
    focusPort: string;
  };
  public searchTags: string[];

  public get localName() {
    return this.name;
  }

  public get fullName() {
    return (this.category ? this.category + '/' : '') + this.name;
  }

  public get displayName() {
    return this.displayNodeName ? this.displayNodeName : this.localName;
  }

  constructor(args) {
    super();

    // Set default variable
    this.runtimeTypes = [];
    this.searchTags = [];

    // Add anything...
    // TODO: Try to get rid of this args loop
    for (const i in args) {
      this[i] = args[i];
    }

    return this;
  }

  labelForNode(node: TSFixme) {
    // If usePortAsLabel is specified use that port value as label
    if (node.type.usePortAsLabel && node.parameters[node.type.usePortAsLabel]) {
      let labelName: string = node.parameters[node.type.usePortAsLabel];

      const truncationMode = node.type.portLabelTruncationMode;
      if (truncationMode === 'filename') {
        labelName = labelName.split('/').pop();
      } else if (truncationMode === 'length' && labelName.length > 36) {
        labelName = labelName.slice(0, 33) + '...';
      }

      return labelName;
    } else {
      return this.displayName;
    }
  }

  /**
   * Module is undefined for basic types
   */
  getModule() {}
}
