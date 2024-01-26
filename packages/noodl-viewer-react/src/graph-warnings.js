export default class GraphWarnings {
  constructor(graphModel, editorConnection) {
    this.graphModel = graphModel;
    this.editorConnection = editorConnection;

    this.graphModel.getAllComponents().forEach((c) => this._bindComponentModel(c));
    this.graphModel.on('componentAdded', (c) => this._bindComponentModel(c), this);
    this.graphModel.on('componentRemoved', (c) => c.removeListenersWithRef(this), this);
  }

  _bindComponentModel(c) {
    c.on('rootAdded', () => this._evaluateWarnings(c), this);
    c.on(
      'rootRemoved',
      (root) => {
        this.editorConnection.clearWarning(c.name, root, 'multiple-visual-roots-warning');
        this._evaluateWarnings(c);
      },
      this
    );
    this._evaluateWarnings(c);
  }

  _evaluateWarnings(c) {
    const roots = c.getRoots();

    if (roots.lenth === 0) return;

    this.editorConnection.clearWarning(c.name, roots[0], 'multiple-visual-roots-warning');
    for (let i = 1; i < roots.length; i++) {
      this.editorConnection.sendWarning(c.name, roots[i], 'multiple-visual-roots-warning', {
        message: "This node is detached from the main node tree<br>and won't be rendered",
        level: 'info'
      });
    }
  }

  dispose() {
    this.graphModel.getAllComponents().forEach((c) => {
      c.removeListenersWithRef(this);
    });

    this.graphModel.removeListenersWithRef(this);
  }
}
