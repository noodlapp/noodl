import { ProjectModel } from '@noodl-models/projectmodel';

export class NavigationHistory {
  owner: TSFixme;
  history: TSFixme[];
  index: number;
  canNavigateBack: boolean;
  canNavigateForward: boolean;

  constructor({ owner }) {
    this.owner = owner;
    this.reset();
  }

  reset() {
    this.history = [];
    this.index = -1;
    this.canNavigateBack = false;
    this.canNavigateForward = false;
  }

  //History can be incorrect when changing branch, this functions goes through and discards any incorrect entries
  discardInvalidEntries() {
    this.history = this.history.filter((componentName) =>
      ProjectModel.instance.getComponentWithName(componentName) ? true : false
    );
    if (this.index >= this.history.length) {
      this.index = this.history.length - 1;
    }

    //remove components that appear more than once in a row. Can happen when a component is removed and the component before and after is the same.
    for (let i = this.history.length - 1; i > 0; i--) {
      if (this.history[i] === this.history[i - 1]) {
        this.history.splice(i, 1);
      }
    }

    this.canNavigateBack = this.index > 0;
    this.canNavigateForward = false;

    if (this.index > this.history.length - 1) {
      this.index = this.history.length - 1;
      this.goToCurrent();
    }
  }

  push(component) {
    if (this.history[this.index] === component.name) return;

    this.history.length = this.index + 1; //clear the history after the index
    this.history.push(component.name);
    this.index = this.history.length - 1;

    this.canNavigateBack = this.index > 0;
    this.canNavigateForward = false;
  }

  /**
   *
   * @returns Returns true when successfully went back; Otherwise, false.
   */
  public goBack(): boolean {
    if (this.index <= 0) {
      return false;
    }

    this.index--;
    this.goToCurrent();
    return true;
  }

  /**
   *
   * @returns Returns true when successfully went forward; Otherwise, false.
   */
  public goForward(): boolean {
    if (this.index === this.history.length - 1) {
      return false;
    }

    this.index++;
    this.goToCurrent();
    return true;
  }

  onComponentRemoved(component) {
    this.history = this.history.filter((componentName) => componentName !== component);

    this.discardInvalidEntries();
  }

  getTopComponent() {
    return this.history[this.history.length - 1];
  }

  /**
   *
   * @returns Returns true when successfully went to current component; Otherwise, false.
   */
  public goToCurrent(): boolean {
    const componentName = this.history[this.index];
    if (!componentName) return false;

    const component = ProjectModel.instance.getComponentWithName(componentName);
    if (!component) return false;

    this.canNavigateBack = this.index > 0;
    this.canNavigateForward = this.index < this.history.length - 1;

    this.owner.switchToComponent(component);
    return true;
  }
}
