import { ComponentModel } from '@noodl-models/componentmodel';
import { ProjectModel } from '@noodl-models/projectmodel';
import { toArray } from 'underscore';
import Model from '../../../shared/model';
import { NodeLibrary } from './nodelibrary';

/**
 * The first level of the warnings object is component name
 * Second is the connection / node identifier
 * Third is the warning keys
 */
interface Warnings {
  [componentName: string]: {
    [node_connection_id: string]: {
      [warningKey: string]: {
        ref: TSFixme;
        warning: TSFixme;
      };
    };
  };
}

export class WarningsModel extends Model {
  public static instance = new WarningsModel();

  private warnings: Warnings = {};
  private notifyChangedScheduled: boolean = false;

  constructor() {
    super();

    // Clear all warnings if a new module (e.g. project) is loaded or unloaded
    NodeLibrary.instance.on(['moduleRegistered', 'moduleUnregistered'], () => {
      this.clearAllWarnings();
    });
  }

  public setWarning(ref, warning) {
    var w = this.getWarningsForRef(ref, warning !== undefined);
    if (!warning) {
      if (w) delete w[ref.key];
    } else {
      warning.level = warning.level || 'warning';
      w[ref.key] = { ref: ref, warning: warning };
    }

    this.scheduleNotifyChanged();
  }

  public clearWarningsForRef(ref) {
    var w = this.getWarningsForRef(ref);
    if (!w) return;

    for (var i in w) delete w[i];

    this.scheduleNotifyChanged();
  }

  public clearAllWarningsForComponent(component) {
    const warnings = this.warnings[component.name];

    if (!warnings) return;

    for (let i in warnings) delete warnings[i];

    this.scheduleNotifyChanged();
  }

  public clearWarningsForRefMatching(matchCb) {
    for (const cw of Object.values(this.warnings)) {
      for (const ws of Object.values(cw)) {
        for (const key in ws) {
          const w = ws[key];
          if (matchCb(w.ref)) {
            delete ws[key];
          }
        }
      }
    }

    this.scheduleNotifyChanged();
  }

  public clearAllWarnings() {
    this.warnings = {};

    this.scheduleNotifyChanged();
  }

  public getWarnings(ref) {
    var w = this.getWarningsForRef(ref);
    if (!w) return;

    if (Object.keys(w).length === 0) return;

    // Create short message for hover
    var messages = [];
    for (var k in w) {
      if (w[k].warning) messages.push(w[k].warning.message);
    }

    return {
      shortMessage: messages.join('<br>'),
      warnings: toArray(w)
    };
  }

  public forEachWarningInComponent(c, callback, args) {
    var cw = this.warnings[c ? c.name : '/'];
    if (!cw) return;

    for (var ref in cw) {
      var ws = cw[ref];

      for (var w in ws) {
        if (!args || !args.levels || args.levels.indexOf(ws[w].warning.level) !== -1) {
          callback(ws[w]);
        }
      }
    }
  }

  public getAllWarningsForComponent(c, args) {
    var warnings = [];
    this.forEachWarningInComponent(
      c,
      function (warning) {
        warnings.push(warning);
      },
      args
    );
    return warnings;
  }

  public getNumberOfWarningsForComponent(c: ComponentModel | { name: string }, args) {
    const cw = this.warnings[c ? c.name : '/'];
    if (cw) {
      let warnings = 0;
      for (const i in cw) {
        const ws = cw[i];
        for (const w in ws) {
          const matchesLevel = !args || !args.levels || args.levels.indexOf(ws[w].warning.level) !== -1;
          const excludeGlobal = args && args.excludeGlobal && ws[w].warning.showGlobally;
          if (matchesLevel && !excludeGlobal) {
            warnings++;
          }
        }
      }
      return warnings;
    }
    return 0;
  }

  public getTotalNumberOfWarnings(args) {
    var total = 0;
    for (var key in this.warnings) {
      total += this.getNumberOfWarningsForComponent({ name: key }, args);
    }
    return total;
  }

  public getTotalNumberOfWarningsMatching(matchCb) {
    var total = 0;
    this.forEachWarning((c, ref, key, warning) => {
      if (matchCb(key, ref, warning)) total++;
    });
    return total;
  }

  public forEachWarning(callback: (c: string, ref, key, warning) => void) {
    var w = this.warnings;
    for (const c in w) {
      // Loop over all components
      var _w = w[c];
      for (const ref in _w) {
        // Loop over all refs
        var __w = _w[ref];
        for (const key in __w) {
          // Loop over all keys
          var warning = __w[key];

          callback(c, ref, key, warning);
        }
      }
    }
  }

  public hasComponentWarnings(c, args?) {
    return this.getNumberOfWarningsForComponent(c, args) > 0;
  }

  // Warnings references MUST contain component and key
  // Can optionally contain node and connection (but need one of them)
  // {component: componentRef,
  //    node: nodeRef,
  //    connection: connectionRef,
  //    key: key of warning as string}
  private getWarningsForRef(ref, create?) {
    var componentName = ref.component ? ref.component.name : '/';
    if (!this.warnings[componentName]) this.warnings[componentName] = {};
    var cw = this.warnings[componentName];

    var key;
    if (ref.node) key = 'node/' + ref.node.id;
    else if (ref.connection)
      key =
        'con/' +
        ref.connection.fromId +
        ':' +
        ref.connection.fromProperty +
        ':' +
        ref.connection.toId +
        ':' +
        ref.connection.toProperty;
    else key = '/'; // Component wide warnings is filed under /

    if (!cw[key] && create) cw[key] = {};
    return cw[key];
  }

  /** Batch changed notifications so listeners don't get peppered */
  private scheduleNotifyChanged() {
    var _this = this;

    if (this.notifyChangedScheduled) return;
    this.notifyChangedScheduled = true;

    setTimeout(function () {
      _this.notifyChangedScheduled && _this.notifyListeners('warningsChanged');
      _this.notifyChangedScheduled = false;
    }, 1);
  }
}
