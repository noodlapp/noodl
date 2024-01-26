class NavigationHandler {
  constructor() {
    this._pageStacks = {};
    this._navigationQueue = [];
  }

  _performNavigation(name, args, type) {
    name = name || 'Main';
    if (this._pageStacks[name]) {
      for (const pageStack of this._pageStacks[name]) {
        type === 'navigate' ? pageStack.navigate(args) : pageStack.replace(args);
      }
    } else {
      this._navigationQueue.push({ name, args, type });
    }
  }

  navigate(name, args) {
    name = name || 'Main';
    this._performNavigation(name, args, 'navigate');
  }

  replace(name, args) {
    name = name || 'Main';
    this._performNavigation(name, args, 'replace');
  }

  registerPageStack(name, pageStack) {
    name = name || 'Main';
    if (!this._pageStacks[name]) {
      this._pageStacks[name] = [];
    }

    this._pageStacks[name].push(pageStack);

    let hasReset = false;
    let hasNavigated = false;

    let i = 0;
    while (i < this._navigationQueue.length) {
      const e = this._navigationQueue[i];
      if (e.name === name) {
        if (e.type === 'navigate') {
          if (!hasReset) {
            //we need to reset to the start page before doing the first navigation
            pageStack.reset();
            hasReset = true;
          }
          pageStack.navigate(e.args);
        } else {
          pageStack.replace(e.args);
        }

        hasNavigated = true;
        this._navigationQueue.splice(i, 1);
      } else {
        i++;
      }
    }

    if (!hasNavigated) {
      pageStack.reset(); //no navigation has happened, call reset() so the start page is created
    }
  }

  deregisterPageStack(name, pageStack) {
    name = name || 'Main';

    if (!this._pageStacks[name]) {
      return;
    }

    const index = this._pageStacks[name].indexOf(pageStack);
    if (index === -1) {
      return;
    }

    this._pageStacks[name].splice(index, 1);
    if (this._pageStacks[name].length === 0) {
      delete this._pageStacks[name];
    }
  }
}

NavigationHandler.instance = new NavigationHandler();

module.exports = NavigationHandler;
