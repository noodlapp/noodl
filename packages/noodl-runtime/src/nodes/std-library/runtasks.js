const { Node } = require('../../../noodl-runtime');
const guid = require('../../guid');
const Model = require('../../model');

function sendSignalOnInput(itemNode, name) {
  itemNode.queueInput(name, true); // send signal
  itemNode.queueInput(name, false);
}

const RunTasksDefinition = {
  name: 'RunTasks',
  displayNodeName: 'Run Tasks',
  docs: 'https://docs.noodl.net/nodes/data/run-tasks',
  color: 'data',
  category: 'Data',
  initialize() {
    this._internal.queuedOperations = [];
    this._internal.state = 'idle';
    this._internal.maxRunningTasks = 10;
    this._internal.activeTasks = new Map(); //id => ComponentInstanceNode
  },
  inputs: {
    items: {
      group: 'Data',
      displayName: 'Items',
      type: 'array',
      set: function (value) {
        if (!value) return;
        if (value === this._internal.items) return;

        this._internal.items = value;
      }
    },
    stopOnFailure: {
      group: 'General',
      displayName: 'Stop On Failure',
      type: 'boolean',
      default: false,
      set: function (value) {
        this._internal.stopOnFailure = value;
      }
    },
    maxRunningTasks: {
      group: 'General',
      displayName: 'Max Running Tasks',
      type: 'number',
      default: 10,
      set: function (value) {
        this._internal.maxRunningTasks = value;
      }
    },
    taskTemplate: {
      type: 'component',
      displayName: 'Template',
      group: 'General',
      set: function (value) {
        this._internal.template = value;
      }
    },
    run: {
      group: 'General',
      displayName: 'Do',
      type: 'signal',
      valueChangedToTrue: function () {
        this.scheduleRun();
      }
    },
    abort: {
      group: 'General',
      displayName: 'Abort',
      type: 'signal',
      valueChangedToTrue: function () {
        this.scheduleAbort();
      }
    }
  },
  outputs: {
    success: {
      type: 'signal',
      group: 'Events',
      displayName: 'Success'
    },
    failure: {
      type: 'signal',
      group: 'Events',
      displayName: 'Failure'
    },
    done: {
      type: 'signal',
      group: 'Events',
      displayName: 'Done'
    },
    aborted: {
      type: 'signal',
      group: 'Events',
      displayName: 'Aborted'
    }
  },
  methods: {
    scheduleRun() {
      var internal = this._internal;
      if (!internal.hasScheduledRun) {
        internal.hasScheduledRun = true;
        this.scheduleAfterInputsHaveUpdated(() => {
          this._queueOperation(() => {
            internal.hasScheduledRun = false;
            this.run();
          });
        });
      }
    },
    scheduleAbort() {
      var internal = this._internal;
      if (!internal.hasScheduledAbort) {
        internal.hasScheduledAbort = true;
        this.scheduleAfterInputsHaveUpdated(() => {
          this._queueOperation(() => {
            internal.hasScheduledAbort = false;
            this.abort();
          });
        });
      }
    },
    async createTaskComponent(item) {
      const internal = this._internal;

      const modelScope = this.nodeScope.modelScope || Model;
      const model = modelScope.create(item);

      var itemNode = await this.nodeScope.createNode(internal.template, guid(), {
        _forEachModel: model,
        _forEachNode: this
      });

      // This is needed to make sure any action connected to "Do"
      // is not run directly
      const _isInputConnected = itemNode.isInputConnected.bind(itemNode);
      itemNode.isInputConnected = (name) => {
        if (name === 'Do') return true;
        return _isInputConnected(name);
      };

      // Set the Id as an input
      if (itemNode.hasInput('Id')) {
        itemNode.setInputValue('Id', model.getId());
      }
      if (itemNode.hasInput('id')) {
        itemNode.setInputValue('id', model.getId());
      }

      // Push all other values also as inputs
      // if they exist as component inputs
      for (var inputKey in itemNode._inputs) {
        if (model.data[inputKey] !== undefined) itemNode.setInputValue(inputKey, model.data[inputKey]);
      }

      // capture signals
      itemNode._internal.creatorCallbacks = {
        onOutputChanged: (name, value, oldValue) => {
          if ((oldValue === false || oldValue === undefined) && value === true) {
            this.itemOutputSignalTriggered(name, model, itemNode);
          }
        }
      };

      return itemNode;
    },
    async startTask(task) {
      const internal = this._internal;

      try {
        const taskComponent = await this.createTaskComponent(task);
        internal.runningTasks++;
        sendSignalOnInput(taskComponent, 'Do');
        internal.activeTasks.set(taskComponent.id, taskComponent);
      } catch (e) {
        // Something went wrong starting the task
        console.log(e);
      }
    },
    async run() {
      const internal = this._internal;

      if (this.context.editorConnection) {
        if (internal.state !== 'idle') {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'run-tasks', {
            message: 'Cannot start when not in idle mode'
          });
        } else if (!internal.template) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'run-tasks', {
            message: 'No task template specified.'
          });
        } else if (!internal.items) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'run-tasks', {
            message: 'No items array provided.'
          });
        } else {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'run-tasks');
        }
      }

      if (internal.state !== 'idle') {
        return;
      }

      if (!internal.template) {
        return;
      }

      if (!internal.items) {
        return;
      }

      internal.state = 'running';
      internal.numTasks = internal.items.length;
      internal.failedTasks = 0;
      internal.completedTasks = 0;
      internal.queuedTasks = [].concat(internal.items);
      internal.runningTasks = 0;

      // No tasks
      if (internal.items.length === 0) {
        this.sendSignalOnOutput('success');
        internal.state = 'idle';
      }

      // Start tasks
      for (let i = 0; i < Math.min(internal.maxRunningTasks, internal.queuedTasks.length); i++) {
        const task = internal.queuedTasks.shift();
        if (!task) break;

        this.startTask(task);
      }
    },
    abort: function () {
      const internal = this._internal;

      internal.state = 'aborted';
    },
    itemOutputSignalTriggered: function (name, model, itemNode) {
      const internal = this._internal;

      if (internal.state === 'idle') {
        // Signal while we are not running is ignored
        return;
      }

      const checkDone = () => {
        if (internal.state === 'aborted') {
          this.sendSignalOnOutput('aborted');
          internal.state = 'idle';
          return;
        }

        if (internal.completedTasks === internal.numTasks) {
          if (internal.failedTasks === 0) this.sendSignalOnOutput('success');
          else this.sendSignalOnOutput('failure');
          this.sendSignalOnOutput('done');
          internal.state = 'idle';
        } else {
          if (internal.stopOnFailure) {
            // Only continue if there are no failed tasks, otherwise aborted
            if (internal.failedTasks === 0) {
              internal.runningTasks++;
              const task = internal.queuedTasks.shift();
              if (task) this.startTask(task);
            } else {
              this.sendSignalOnOutput('failure');
              this.sendSignalOnOutput('aborted');
            }
          } else {
            internal.runningTasks++;
            const task = internal.queuedTasks.shift();
            if (task) this.startTask(task);
          }
        }
      };

      if (name === 'Success') {
        internal.completedTasks++;
        internal.runningTasks--;
        checkDone();
      } else if (name === 'Failure') {
        internal.completedTasks++;
        internal.failedTasks++;
        internal.runningTasks--;
        checkDone();
      }

      internal.activeTasks.delete(itemNode.id);
      this.nodeScope.deleteNode(itemNode);
    },
    _queueOperation(op) {
      this._internal.queuedOperations.push(op);
      this._runQueueOperations();
    },
    async _runQueueOperations() {
      if (this.runningOperations) {
        return;
      }
      this.runningOperations = true;

      while (this._internal.queuedOperations.length) {
        const op = this._internal.queuedOperations.shift();
        await op();
      }

      this.runningOperations = false;
    }
  },
  _deleteAllTasks() {
    for (const taskComponent of this._internal.activeTasks) {
      this.nodeScope.deleteNode(taskComponent);
    }
    this._internal.activeTasks.clear();
  },
  _onNodeDeleted: function () {
    Node.prototype._onNodeDeleted.call(this);
    this._deleteAllTasks();
  }
};

module.exports = {
  node: RunTasksDefinition
};
