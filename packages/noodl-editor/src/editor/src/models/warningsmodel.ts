import { toArray } from 'underscore';

import type { ComponentModel } from '@noodl-models/componentmodel';

import Model from '../../../shared/model';
import type { NodeGraphNode } from './nodegraphmodel';
import { NodeLibrary } from './nodelibrary';

export type WarningLabel = 'warning' | 'error';

export type Warning =
  | {
      type?: string;
      level?: WarningLabel;
      message: string;
      showGlobally?: boolean;
    }
  | {
      type: 'conflict' | 'conflict-source-code';
      level?: WarningLabel;
      message: string;
      showGlobally?: boolean;
      conflictMetadata: {
        parameter: string;
        ours: string;
        theirs: string;
      };
      onDismiss: () => void;
      onUseTheirs: () => void;
    };

export type WarningRef = {
  key?: string;
  component?: ComponentModel;
  connection?: TSFixme;
  node?: NodeGraphNode;
  isFromViewer?: boolean;
};

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
        warning: Warning;
      };
    };
  };
}

export class WarningsModel extends Model {
  public static instance = new WarningsModel();

  private warnings: Warnings = {};
  private notifyChangedScheduled = false;

  constructor() {
    super();

    // Clear all warnings if a new module (e.g. project) is loaded or unloaded
    NodeLibrary.instance.on(['moduleRegistered', 'moduleUnregistered'], () => {
      this.clearAllWarnings();
    });
  }

  public setWarning(ref: WarningRef, warning: Warning) {
    const w = this.getWarningsForRef(ref, warning !== undefined);
    if (!warning) {
      if (w) {
        delete w[ref.key];
      }
    } else {
      warning.level = warning.level || 'warning';
      w[ref.key] = { ref: ref, warning: warning };
    }

    this.scheduleNotifyChanged();
  }

  public clearWarningsForRef(ref: WarningRef) {
    const w = this.getWarningsForRef(ref);
    if (!w) return;

    for (const i in w) {
      delete w[i];
    }

    this.scheduleNotifyChanged();
  }

  public clearAllWarningsForComponent(component: ComponentModel) {
    const warnings = this.warnings[component.name];
    if (!warnings) return;

    for (const i in warnings) {
      delete warnings[i];
    }

    this.scheduleNotifyChanged();
  }

  public clearWarningsForRefMatching(matchFn: (ref: TSFixme) => boolean) {
    for (const cw of Object.values(this.warnings)) {
      for (const ws of Object.values(cw)) {
        for (const key in ws) {
          const w = ws[key];
          if (matchFn(w.ref)) {
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

  public getWarnings(ref: WarningRef) {
    const w = this.getWarningsForRef(ref);
    if (!w) return;
    if (Object.keys(w).length === 0) return;

    // Create short message for hover
    const messages = [];
    for (const k in w) {
      if (w[k].warning) messages.push(w[k].warning.message);
    }

    return {
      shortMessage: messages.join('<br>'),
      warnings: toArray(w)
    };
  }

  public forEachWarningInComponent(c, callback, args) {
    const cw = this.warnings[c ? c.name : '/'];
    if (!cw) return;

    for (const ref in cw) {
      const ws = cw[ref];

      for (const w in ws) {
        if (!args || !args.levels || args.levels.indexOf(ws[w].warning.level) !== -1) {
          callback(ws[w]);
        }
      }
    }
  }

  public getAllWarningsForComponent(c, args) {
    const warnings = [];
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
    let total = 0;
    for (const key in this.warnings) {
      total += this.getNumberOfWarningsForComponent({ name: key }, args);
    }
    return total;
  }

  public getTotalNumberOfWarningsMatching(matchCb) {
    let total = 0;
    this.forEachWarning((c, ref, key, warning) => {
      if (matchCb(key, ref, warning)) total++;
    });
    return total;
  }

  public forEachWarning(callback: (c: string, ref, key, warning) => void) {
    const w = this.warnings;
    for (const c in w) {
      // Loop over all components
      const _w = w[c];
      for (const ref in _w) {
        // Loop over all refs
        const __w = _w[ref];
        for (const key in __w) {
          // Loop over all keys
          const warning = __w[key];

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
  private getWarningsForRef(ref: WarningRef, create?) {
    const componentName = ref.component ? ref.component.name : '/';
    if (!this.warnings[componentName]) this.warnings[componentName] = {};
    const cw = this.warnings[componentName];

    let key;
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    if (this.notifyChangedScheduled) return;
    this.notifyChangedScheduled = true;

    setTimeout(function () {
      _this.notifyChangedScheduled && _this.notifyListeners('warningsChanged');
      _this.notifyChangedScheduled = false;
    }, 1);
  }
}
