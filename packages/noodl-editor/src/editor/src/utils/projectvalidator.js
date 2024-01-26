class ProjectValidator {
  constructor() {
    this.errors = [];
  }

  expectNotUndefined(value, msg) {
    if (value === undefined) {
      this.error(msg);
    }
  }

  expectTrue(value, msg) {
    if (!value) {
      this.error(msg);
    }
  }

  error(msg, args) {
    this.errors.push({
      msg,
      args
    });
  }

  validateType(type) {
    this.expectTrue(type !== undefined, 'Node is missing type');
    this.expectTrue(typeof type === 'string' || typeof type === 'object', 'Type should be string or object');
  }

  validateNode(n) {
    this.validateType(n.type);

    this.expectTrue(typeof n.id === 'string', 'Node, id is not valid');
    this.expectTrue(typeof n.x === 'number' || typeof n.x === 'undefined', 'Node, x position should be number');
    this.expectTrue(typeof n.y === 'number' || typeof n.y === 'undefined', 'Node, y position should be number');
    this.expectTrue(typeof n.parameters === 'object', 'Node, invalid parameters');
  }

  validateComponent(c) {
    var _this = this;

    var graph = c.graph;

    this.expectTrue(typeof c.name === 'string', 'Component is missing name');
    this.expectTrue(graph !== undefined, 'Component does not have a graph ' + c.name);

    this.expectTrue(
      graph.roots !== undefined && Array.isArray(graph.roots),
      'Component does not have a roots array ' + c.name
    );

    this.expectTrue(
      graph.connections !== undefined && Array.isArray(graph.connections),
      'Component does not have a connections array ' + c.name
    );

    var nodes = {};

    function _collectNodes(ns) {
      ns.forEach((n) => {
        _this.validateNode(n);
        nodes[n.id] = n;
        if (n.children !== undefined) _collectNodes(n.children);
      });
    }
    graph.roots !== undefined && _collectNodes(graph.roots);

    graph.connections !== undefined &&
      graph.connections.forEach((con) => {
        if (nodes[con.fromId] === undefined || nodes[con.toId] === undefined) {
          // This connection is dangling
          var missing =
            (nodes[con.fromId] === undefined ? 'missing source ' : '') +
            (nodes[con.toId] === undefined ? 'missing target ' : '');
          this.error('Dangling connection at ' + c.name + ' ' + missing, {
            con,
            graph,
            fix: function () {
              var idx = this.graph.connections.indexOf(con);
              if (idx !== -1) this.graph.connections.splice(idx, 1);
            }
          });
        }
      });
  }

  validate(json) {
    if (!json) json = this.json;

    this.expectTrue(typeof json.name === 'string', 'Project is missing name');

    this.expectTrue(json.components !== undefined && Array.isArray(json.components), 'Project is missing components');

    json.components !== undefined &&
      json.components.forEach((c) => {
        this.validateComponent(c);
      });
  }

  validateProjectDirectory(dir) {
    const FileSystem = require('./filesystem');

    try {
      var content = FileSystem.instance.readFileSync(dir + '/project.json');
      if (!content) return this.error('No project json');

      this.json = JSON.parse(content);
    } catch (e) {
      return this.error('Not valid json');
    }

    this.validate(this.json);
  }

  print() {
    if (this.errors.length === 0) console.log('No errors');
    this.errors.forEach((e) => {
      console.log(e.msg);
    });
  }

  clearErrors() {
    this.errors = [];
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  fix() {
    this.errors.forEach((e) => {
      e.args && e.args.fix && e.args.fix();
    });
  }

  writeToProjectDirectory(dir) {
    if (!this.json) return;

    const FileSystem = require('./filesystem');
    FileSystem.instance.writeFileSync(dir + '/project.json', JSON.stringify(this.json, null, 4));
  }
}

module.exports = ProjectValidator;
