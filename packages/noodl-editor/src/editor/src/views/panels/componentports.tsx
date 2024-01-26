/* eslint-disable @typescript-eslint/no-this-alias */
import { filter as _filter } from 'underscore';
import React, { useEffect, useState } from 'react';

import { UndoQueue, UndoActionGroup } from '@noodl-models/undo-queue-model';

import View from '../../../../shared/view';
import { Frame } from '../common/Frame';
import PopupLayer, { StringInputPopup } from '../popuplayer';
import { ToastLayer } from '../ToastLayer/ToastLayer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ComponentPortsTemplate = require('../../templates/componentports.html');

export class ComponentPorts extends View {
  parent: TSFixme;
  model: TSFixme;
  type: TSFixme;
  plug: TSFixme;
  title: TSFixme;
  group: TSFixme;
  lastIndex: number;
  lastGroup: TSFixme;
  canArrangeInGroups: TSFixme;
  items: TSFixme;
  refreshItemsScheduled: boolean;
  renderScheduled: TSFixme;
  item: TSFixme[];

  constructor(args) {
    super();

    this.parent = args.parent;
    this.model = args.model;
    this.type = args.type;
    this.plug = args.plug;
    this.title = args.title ? args.title : 'Ports';
    this.group = args.group;
    this.lastIndex = 0;
    this.lastGroup = undefined;
    this.canArrangeInGroups = args.canArrangeInGroups;
  }

  render() {
    // Component inputs will have output ports, and vice versa
    this.el = this.bindView($(ComponentPortsTemplate), this);
    if (!this.canArrangeInGroups) this.$('.add-group-button').hide();

    this.bindModel();

    this.renderPorts(true);

    this.parent && this.parent.append(this.el);

    return this.el;
  }

  resize(layout: TSFixme) {
    this.el.css({
      position: 'absolute',
      left: layout.x,
      top: layout.y,
      width: layout.width,
      height: layout.height
    });
  }

  bindModel() {
    const _this = this;

    this.model.on(['portAdded', 'portRemoved', 'portRenamed', 'portRearranged'], function () {
      _this.scheduleRender(true);
    });
  }

  getPorts(filter) {
    // We must explicitly get node instance ports only
    const ports = _filter(this.model.ports, function (p) {
      return !filter || p.plug === filter;
    });
    ports.sort(function (a, b) {
      return a.index > b.index ? 1 : -1;
    });
    return ports;
  }

  getItemsWithGroups() {
    const groups = [
      {
        name: undefined,
        ports: []
      }
    ];

    function addToGroup(name, p) {
      for (let i = 0; i < groups.length; i++)
        if (groups[i].name === name) {
          groups[i].ports.push(p);
          return;
        }

      groups.push({ name: name, ports: [p] });
    }

    const ports = this.getPorts(this.plug);
    for (let i = 0; i < ports.length; i++) {
      const p = ports[i];
      addToGroup(p.group, p);
    }

    const items = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (g.name !== undefined) items.push({ type: 'group', label: g.name });
      for (let j = 0; j < g.ports.length; j++) {
        const p = g.ports[j];
        items.push({ type: 'port', label: p.name, port: p });
      }
    }

    this.lastIndex = items.length > 0 ? items[items.length - 1].port.index : 0;
    this.lastGroup = groups[groups.length - 1].name;

    return items;
  }

  getItems() {
    if (this.canArrangeInGroups) return this.getItemsWithGroups();
    else {
      const ports = this.getPorts(this.plug);
      return ports.map(function (p) {
        return { type: 'port', label: p.name, port: p };
      });
    }
  }

  makeDraggable(el, item) {
    const _this = this;
    let mouseDownOnItem = false;

    el.find('.drag-handle').on('mousedown', function (e) {
      mouseDownOnItem = true;
    });
    el.find('.drag-handle').on('mouseup', function (e) {
      mouseDownOnItem = false;
    });
    el.find('.drag-handle').on('mousemove', function (e) {
      if (mouseDownOnItem) {
        PopupLayer.instance.startDragging({ label: item.label, item: item });
        mouseDownOnItem = false;
      }
    });
  }

  makeDroppable(el, item) {
    const _this = this;

    el.find('.drop-target').on('mouseover', (e) => {
      if (PopupLayer.instance.isDragging()) {
        const dragItem = PopupLayer.instance.dragItem;

        const sourceIdx = this.items.indexOf(dragItem.item);
        const targetIdx = this.items.indexOf(item);

        const renderTop = targetIdx < sourceIdx;
        el.find('.drop-indicator')
          .show()
          .css(renderTop ? { top: 0, bottom: '' } : { top: '', bottom: 0 });
        PopupLayer.instance.indicateDropType('move');
      }
    });
    el.find('.drop-target').on('mouseout', function (e) {
      el.find('.drop-indicator').hide();
      PopupLayer.instance.indicateDropType('none');
    });
    el.find('.drop-target').on('mouseup', function (e) {
      const dragItem = PopupLayer.instance.dragItem;

      if (dragItem) {
        _this.dropOnItem({ target: item, source: dragItem.item });

        PopupLayer.instance.dragCompleted();
      }
    });
  }

  arrangePorts(args?: TSFixme) {
    const items = this.items;
    const undo = new UndoActionGroup({ label: args && args.label ? args.label : 'rearrange ports' });

    // Update groups and index for all ports
    let group = undefined;
    let index = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === 'group') group = item.label;
      else if (item.type === 'port') {
        this.model.arrangePort(item.port.name, index, group, { undo: undo });
        index++;
      }
    }

    UndoQueue.instance.push(undo);
  }

  dropOnItem(args: TSFixme) {
    if (args.target === args.source) return;

    // Reorder items
    const sourceIdx = this.items.indexOf(args.source);
    const targetIdx = this.items.indexOf(args.target);

    this.items.splice(sourceIdx, 1);

    const newIdx = targetIdx;
    // if(sourceIdx > targetIdx) newIdx++;
    this.items.splice(newIdx, 0, args.source);

    this.arrangePorts();
  }

  scheduleRender(refresh?: TSFixme) {
    const _this = this;

    if (refresh) this.refreshItemsScheduled = true;
    if (this.renderScheduled) return;
    this.renderScheduled = true;

    setTimeout(function () {
      if (_this.renderScheduled) {
        _this.renderPorts(_this.refreshItemsScheduled);
      }
      _this.renderScheduled = false;
      _this.refreshItemsScheduled = false;
    }, 1);
  }

  renderPorts(refresh?: TSFixme) {
    this.$('.ports').html('');

    if (refresh) this.items = this.getItems();
    const items = this.items;
    for (const i in items) {
      const item = items[i];

      let itemEl: TSFixme = null;
      if (item.type === 'port') {
        itemEl = this.bindView(this.cloneTemplate('item'), { port: item.port, label: item.label });
      } else if (item.type === 'group') {
        itemEl = this.bindView(this.cloneTemplate('group'), { label: item.label, item: item });
      }

      this.makeDraggable(itemEl, item);
      this.makeDroppable(itemEl, item);
      this.$('.ports').append(itemEl);
    }
  }

  // Add port
  onAddPortClicked(scope: TSFixme, el: TSFixme, evt: TSFixme) {
    const _this = this;

    const popup = new StringInputPopup({
      label: 'New port name',
      okLabel: 'Add',
      cancelLabel: 'Cancel',
      onOk: function (portName) {
        const result = _this.performAdd(portName);
        if (!result.success) {
          ToastLayer.showError(result.message);
        }

        _this.notifyListeners('panelResized');
      }
    });
    popup.render();

    PopupLayer.instance.showPopup({
      content: popup,
      attachTo: el,
      position: 'top'
    });

    evt.stopPropagation();
  }

  performAdd(portNames: TSFixme) {
    if (portNames === '') {
      return { success: false, message: 'Port name cannot be empty' };
    } else {
      const result = portNames.split(',').map((port) => {
        const portName = port.trim();
        if (this.model.findPortWithName(portName)) {
          return { success: false, message: 'Cannot create a port with the same name as an existing one.' };
        } else {
          const port = {
            name: portName,
            plug: this.plug,
            type: this.type,
            group: this.group !== undefined ? this.group : this.lastGroup,
            index: ++this.lastIndex
          };

          this.model.addPort(port, { undo: true, label: 'add port' });

          return { success: true };
        }
      });

      const failed = result.find((r) => !r.success);
      return failed ? failed : { success: true };
    }
  }

  // Rename port
  performRename(args: TSFixme) {
    if (args.newName === '') {
      return { success: false, message: 'Port name cannot be empty' };
    } else if (this.model.findPortWithName(args.newName)) {
      // Show alert that component cannot have same name as an
      // existing component
      return { success: false, message: 'Cannot rename a port to the same name as an existing one.' };
    } else {
      this.model.renamePortWithName(args.oldName, args.newName, { undo: true, label: 'rename port' });

      return { success: true };
    }
  }

  onRenameClicked(scope: TSFixme, el: TSFixme, evt: TSFixme) {
    const _this = this;

    const parent = el.parents('.component-ports-item');
    parent.find('.show-on-edit').show();
    parent.find('.hide-on-edit').hide();

    function rename() {
      const newName = input.val();
      if (newName !== scope.port.name) {
        const result = _this.performRename({ newName: newName, oldName: scope.port.name });

        if (!result.success) {
          ToastLayer.showError(result.message);
        }
      }

      parent.find('.show-on-edit').hide();
      parent.find('.hide-on-edit').show();
      input.off('blur').off('keypress'); // Make sure rename doesn't get called twice
    }

    const input = parent.find('input');
    input
      .focus()
      .off('blur')
      .on('blur', function () {
        rename();
      })
      .off('keypress')
      .on('keypress', function (e) {
        if (e.which == 13) rename();
      });

    evt.stopPropagation();
  }

  // Delete port
  performDelete(portname: TSFixme) {
    if (this.model.isPortConnected(portname)) {
      return { success: false, message: 'Cannot remove port, does it have active connections?' };
    } else {
      this.model.removePortWithName(portname, { undo: true, label: 'delete port' });

      return { success: true };
    }
  }

  onDeleteClicked(scope: TSFixme, el: TSFixme, evt: TSFixme) {
    const result = this.performDelete(scope.port.name);

    if (!result.success) {
      ToastLayer.showError(result.message);
    }

    this.notifyListeners('panelResized');

    evt.stopPropagation();
  }

  // Add group
  onAddGroupClicked(scope: TSFixme, el: TSFixme, evt: TSFixme) {
    const _this = this;

    const popup = new StringInputPopup({
      label: 'New group name',
      okLabel: 'Add',
      cancelLabel: 'Cancel',
      onOk: function (groupName) {
        const result = _this.performAddGroup(groupName);
        if (!result.success) {
          ToastLayer.showError(result.message);
        }

        _this.notifyListeners('panelResized');
      }
    });
    popup.render();

    PopupLayer.instance.showPopup({
      content: popup,
      attachTo: el,
      position: 'top'
    });

    evt.stopPropagation();
  }

  findGroupWithName(groupName: TSFixme) {
    if (!this.items) this.item = this.getItems();

    const items = this.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.label === groupName && item.type === 'group') return item;
    }
  }

  performAddGroup(groupNames: TSFixme) {
    const _this = this;

    if (groupNames === '') {
      return { success: false, message: 'Group name cannot be empty' };
    } else {
      const result = groupNames.split(',').map((group) => {
        const groupName = group.trim();

        if (this.findGroupWithName(groupName)) {
          return { success: false, message: 'Group with that name already exist' };
        } else {
          const oldLastGroup = this.lastGroup;
          const newGroup = { type: 'group', label: groupName };

          // @ts-expect-error TODO: What?
          UndoQueue.instance.pushAndDo({
            label: 'add group',
            do: function () {
              _this.lastGroup = groupName;
              _this.items.push(newGroup);
              _this.scheduleRender();
            },
            undo: function () {
              _this.lastGroup = oldLastGroup;
              const idx = _this.items.indexOf(newGroup);
              idx !== -1 && _this.items.splice(idx, 1);
              _this.scheduleRender();
            }
          });

          return { success: true };
        }
      });

      const failed = result.find((r) => !r.success);
      return failed ? failed : { success: true };
    }
  }

  // Rename group
  performRenameGroup(args: TSFixme) {
    if (args.newName === '') {
      return { success: false, message: 'Group name cannot be empty' };
    } else {
      args.item.label = args.newName;
      this.arrangePorts({ label: 'rename group' });

      return { success: true };
    }
  }

  onRenameGroupClicked(scope: TSFixme, el: TSFixme, evt: TSFixme) {
    const _this = this;

    const parent = el.parents('.component-ports-group-item');
    parent.find('.show-on-edit').show();
    parent.find('.hide-on-edit').hide();

    function rename() {
      const newName = input.val();
      if (newName !== scope.item.label) {
        const result = _this.performRenameGroup({ newName: newName, item: scope.item });

        if (!result.success) {
          ToastLayer.showError(result.message);
        }
      }

      parent.find('.show-on-edit').hide();
      parent.find('.hide-on-edit').show();
      input.off('blur').off('keypress'); // Make sure rename doesn't get called twice
    }

    const input = parent.find('input');
    input
      .focus()
      .off('blur')
      .on('blur', function () {
        rename();
      })
      .off('keypress')
      .on('keypress', function (e) {
        if (e.which == 13) rename();
      });

    evt.stopPropagation();
  }

  // Delete group
  performDeleteGroup(item: TSFixme) {
    const idx = this.items.indexOf(item);
    this.items.splice(idx, 1);

    this.arrangePorts({ label: 'delete group' });
    return { success: true };
  }

  onDeleteGroupClicked(scope: TSFixme, el: TSFixme, evt: TSFixme) {
    const result = this.performDeleteGroup(scope.item);

    if (!result.success) {
      // @ts-expect-error TODO: What?
      ToastLayer.showError(result.message);
    }

    this.notifyListeners('panelResized');

    evt.stopPropagation();
  }
}

export function ComponentPortsComponent(props: unknown) {
  const [instance, setInstance] = useState(null);

  useEffect(() => {
    const instance = new ComponentPorts(props);
    instance.render();
    setInstance(instance);
  }, []);

  return <Frame instance={instance} isFitWidth />;
}
