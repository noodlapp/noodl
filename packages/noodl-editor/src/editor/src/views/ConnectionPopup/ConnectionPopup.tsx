import classNames from 'classnames';
import React from 'react';

import { ConnectionBar } from './components/ConnectionBar';
import css from './ConnectionPopup.module.scss';

export function ConnectionPopup(props: TSFixme) {
  return (
    <div className={classNames([css.popup, props.disabled && css.disabled])}>
      <div className={classNames([css.popupHeader, props.disabled && css.disabled])}>
        <span>{props.type === 'from' ? 'STEP 1 - Select output' : 'STEP 2 - Select input'}</span>
      </div>
      <div className={css.popupScroll}>
        {props.type === 'from' && (
          <ConnectionBar
            type="from"
            isActive={props.isPanelActive('from')}
            model={props.model}
            onPortSelected={(e) => {
              props.onPortSelected(e);
            }}
          />
        )}
        {props.type === 'to' && (
          <ConnectionBar
            type="to"
            isActive={props.isPanelActive('to')}
            model={props.model}
            fromNode={props.fromNode}
            sourcePort={props.sourcePort}
            onPortSelected={(e) => {
              props.onPortSelected(e);
            }}
          />
        )}
      </div>
    </div>
  );
}
