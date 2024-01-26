//used to optimize warnings so we're not sending unneccessary warnings.
//Improves editor performance, especially in larger projects

class ActiveWarnings {
  constructor() {
    this.currentWarnings = new Map();
  }

  setWarning(nodeId, key, warning) {
    //Check if we've already sent this warning
    if (this.currentWarnings.has(nodeId)) {
      //we have sent warnings to this node before, check if we've sent this particular one before
      const warningKeys = this.currentWarnings.get(nodeId);
      if (warningKeys[key] === warning) {
        //we've already sent this warning, no need to send it again
        return false;
      }

      //new warning, remember that we sent it
      warningKeys[key] = warning;
      return true;
    } else {
      //new warning, we havent sent any warnings to this node before
      //Remember that we sent it
      this.currentWarnings.set(nodeId, { [key]: warning });
      return true;
    }
  }

  clearWarning(nodeId, key) {
    const warningKeys = this.currentWarnings.get(nodeId);

    if (!warningKeys || !warningKeys[key]) {
      //There are no warnings that we've sent on this node.
      //Save some performance by not sending an uneccesary message to the editor
      return false;
    }

    delete warningKeys[key];
    if (Object.keys(warningKeys).length === 0) {
      delete this.currentWarnings.delete(nodeId);
    }

    return true;
  }

  clearWarnings(nodeId) {
    if (this.currentWarnings.has(nodeId) === false) {
      //no warnings on this node, save some performance by not sending a message to the editor
      return false;
    }

    //no warnings for this node anymore
    this.currentWarnings.delete(nodeId);
    return true;
  }
}

module.exports = ActiveWarnings;
