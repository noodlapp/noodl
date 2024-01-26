import classNames from 'classnames';
import React from 'react';

import css from '../ConnectionPopup.module.scss';
import { PortItem } from './PortItem';

export function PortGroup(props: TSFixme) {
  // comments in this component is to remove the group folding.
  // delete the commented code if no-one misses the foldability
  //const [expanded, setExpanded] = useState(props.expanded);

  const colors = props.colors;

  return (
    <div>
      <div
        style={{ backgroundColor: colors.header, borderBottom: `1px solid ${colors.base}` }}
        className={classNames(css.listElementGroup, css.enabled)}
        //onClick={() => !allPortsDisabled && setExpanded(!expanded)}
      >
        <div className={css.groupLabel}>{props.group.name}</div>
        {/* <div>
          <i className={`fa ${expanded ? 'fa-caret-up' : 'fa-caret-down'}`} />
        </div> */}
      </div>
      {props.group.ports.map((p) => (
        <PortItem
          key={p.name}
          colors={colors}
          onClick={() => props.onItemClicked(p)}
          isSelected={props.selectedPort === p.name || p.name === props.highlightedPort}
          port={p}
        />
      ))}
    </div>
  );
}
