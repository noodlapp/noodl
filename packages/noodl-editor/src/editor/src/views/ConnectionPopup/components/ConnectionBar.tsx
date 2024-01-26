import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import { KeyCode } from '@noodl-constants/KeyCode';
import { NodeLibrary } from '@noodl-models/nodelibrary';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';

import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';
import css from '../ConnectionPopup.module.scss';
import { PortGroup } from './PortGroup';

function _getPorts(type, model /* NodeGraphNode */) {
  const ports = type === 'from' ? model.getPorts('output') : model.getPorts('input');
  const models = [];

  function isConnectable(p) {
    return !(typeof p.type === 'object' && p.type.allowEditOnly);
  }

  // Apply ports condition filter (only use extended filter, i.e. ones that should not be connectable if filtered)
  const portFilter = NodeLibrary.instance.applyPortConditionsFilterForNode(model, ['extended']);
  portFilter.forEach((portname) => {
    const idx = ports.findIndex((p) => p.name === portname);
    if (idx !== -1) ports.splice(idx, 1);
  });

  for (const i in ports) {
    const p = ports[i];

    if (isConnectable(p)) {
      models.push({
        name: p.name,
        group: p.group,
        displayName: (p.displayName || p.name) + (p.tab && p.tab.label ? '(' + p.tab.label + ')' : ''), // Show the tab label in the connection editor
        annotatedName: NodeLibrary.instance.getAnnotatedPortName(model, p),
        type: p.type,
        plug: p.plug,
        section: type,
        parent: model
      });
    }
  }

  return models;
}

export function ConnectionBar(props: TSFixme) {
  const ports = _getPorts(props.type, props.model);
  const [selectedPort, setSelectedPort] = useState();
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const portAmount = useRef(0);

  const disabled = props.type === 'to' && (props.fromNode === undefined || props.sourcePort === undefined);
  const colors = props.model.metadata?.colorOverride
    ? NodeLibrary.instance.colorSchemeForNodeColorName(props.model.metadata.colorOverride)
    : NodeLibrary.instance.colorSchemeForNodeType(props.model.type);

  function focusSearch() {
    if (searchRef?.current && props.isActive) {
      searchRef.current.focus();
    }
  }

  useEffect(() => {
    focusSearch();
  }, [searchRef.current, props.isActive]);

  useEffect(() => {
    const eventGroup = {};

    EventDispatcher.instance.on(
      'Model.connectionAdded',
      () => {
        setSelectedPort(undefined);
      },
      eventGroup
    );

    return () => EventDispatcher.instance.off(eventGroup);
  });

  function moveCursor(amt) {
    if (!props.isActive) return;
    setCursorPosition((current) => {
      let newPos = current + amt;

      if (newPos < 0) newPos = 0;
      if (newPos > portAmount.current) newPos = portAmount.current;

      return newPos;
    });
  }

  function handleEnter() {
    if (!cursorPosition) return;
    if (!props.isActive) return;
    onPortClicked(flatPorts[cursorPosition - 1]);
    setCursorPosition(0);
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.keyCode) {
        case KeyCode.Down:
          moveCursor(1);
          break;

        case KeyCode.Up:
          moveCursor(-1);
          break;

        case KeyCode.Enter:
          handleEnter();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cursorPosition, props.isActive]);

  // Update port state
  if (props.type === 'to' && props.fromNode !== undefined && props.sourcePort !== undefined) {
    const sourcePort = props.fromNode.getPort(props.sourcePort);
    if (sourcePort !== undefined)
      ports.forEach((p) => {
        const status = props.model.owner.getConnectionStatus({
          sourceNode: props.fromNode,
          sourcePort: props.sourcePort,
          targetNode: props.model,
          targetPort: p.name
        });

        p.disabled = !status.connectable;
        p.message = status.message;

        // Make sure signals only can connect to input signals
        const targetType = NodeLibrary.nameForPortType(p.type);
        if (
          NodeLibrary.nameForPortType(sourcePort.type) === 'signal' &&
          targetType !== '*' &&
          targetType !== 'signal'
        ) {
          p.disabled = true;
          p.message = 'Can only connect signal output to signal input';
        }
      });
  }

  // Group ports
  const groups = [];

  ports.forEach((p) => {
    if (p.disabled) return;

    if (searchTerm) {
      if (p.displayName.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return;
    }

    const name = p.group ? p.group : 'Other';
    const g = groups.find((_g) => _g.name === name);
    if (!g) groups.push({ name: name, ports: [p] });
    else g.ports.push(p);
  });

  // Move important groups to top
  const priorityGroups = (
    props.model.type.connectionPanel !== undefined && props.model.type.connectionPanel.groupPriority !== undefined
      ? props.model.type.connectionPanel.groupPriority
      : ['General', 'Events', 'Actions', 'States']
  )

    .slice()
    .reverse();

  priorityGroups.forEach((g) => {
    groups.sort(function (x, y) {
      return x.name === g ? -1 : y.name === g ? 1 : 0;
    });
  });

  // Move other to the bottom
  const otherIdx = groups.findIndex((g) => g.name === 'Other');
  if (otherIdx !== -1) {
    const otherGroup = groups.splice(otherIdx, 1);
    groups.push(otherGroup[0]);
  }

  const flatPorts = [];
  groups.forEach((g) => flatPorts.push(...g.ports));
  portAmount.current = flatPorts.length;

  const onPortClicked = (p) => {
    if (p.disabled) return;

    setSelectedPort(p.name);
    props.onPortSelected(p.name);
  };

  const hasPorts = groups.length > 0;

  return (
    <div
      style={{
        backgroundColor: colors.base,
        borderBottom: `1px solid ${colors.base}`,
        // @ts-expect-error CSS Variable
        '--local--port-hover-color': colors.baseHighlighted
      }}
      className={classNames([css.bar, disabled && css.disabled])}
    >
      <div
        className={css.searchContainer}
        style={{ borderBottom: `1px solid ${colors.base}`, backgroundColor: colors.header }}
        key="searchinput"
      >
        <Icon icon={IconName.Search} size={IconSize.Tiny} UNSAFE_className={css.searchIcon} />
        <input
          type="text"
          placeholder="Search"
          className={css.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setCursorPosition(0)}
          onBlur={() => setTimeout(() => setSearchTerm(''), 200)}
          ref={searchRef}
        />
      </div>

      {hasPorts ? (
        <div>
          {groups.map((g) => (
            <PortGroup
              key={g.name}
              colors={colors}
              expanded={true}
              onItemClicked={onPortClicked}
              group={g}
              selectedPort={selectedPort}
              highlightedPort={cursorPosition && flatPorts[cursorPosition - 1]?.name}
            />
          ))}
        </div>
      ) : (
        <div className={css.noPortsMessage}>
          {searchTerm ? (
            props.type === 'from' ? (
              <span>Can't find any outputs</span>
            ) : (
              <span>Can't find any inputs</span>
            )
          ) : props.type === 'from' ? (
            <span>This node has no outputs</span>
          ) : (
            <span>This node has no inputs</span>
          )}
        </div>
      )}
    </div>
  );
}
