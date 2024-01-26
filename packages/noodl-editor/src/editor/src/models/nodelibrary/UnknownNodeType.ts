import Model from '../../../../shared/model';

export class UnknownNodeType extends Model {
  private name: string;

  public get localName() {
    const path = this.name.split('/');
    return path[path.length - 1];
  }

  public get fullName() {
    return this.name;
  }

  public get displayName() {
    return this.localName;
  }

  constructor(typename: string) {
    super();

    this.name = typename;

    return this;
  }

  labelForNode(node: TSFixme) {
    return this.localName;
  }

  /**
   * Module is undefined for basic types
   */
  getModule() {}
}
