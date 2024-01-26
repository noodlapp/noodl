import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import { NodeLibrary } from '@noodl-models/nodelibrary';

import PopupLayer from '../../popuplayer';
import css from '../ConnectionPopup.module.scss';
import { docsParser } from '../DocsParser';
import { DocsPopup } from './DocsPopup';

const _shouldShowDocsForPort = {}; // Ugly fix for not showing duplicate docs on ports

export function PortItem(props: TSFixme) {
  const ref = useRef(null);
  const [showDocs, setShowDocs] = useState(false);
  const [docs, setDocs] = useState();

  let tooltipTimeout;
  const onMouseOver = () => {
    if (props.port.message) {
      const bounds = ref.current.getBoundingClientRect();
      tooltipTimeout = setTimeout(() => {
        PopupLayer.instance.showTooltip({
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height,
          position: 'bottom',
          content: props.port.message
        });
      }, 1000);
    }

    const p = props.port;
    _shouldShowDocsForPort[p.name] = true;

    if (p.parent.type.docs) {
      docsParser.getDocsForType(p.parent.type, (docs) => {
        if (!_shouldShowDocsForPort[p.name]) return; // Make sure we should still show docs for port
        const ports = p.section === 'from' ? docs.outputs : docs.inputs;

        const name = (p.displayName || p.name).toLowerCase();
        let d = ports[name];

        if (d === undefined) {
          // No docs found, try only the port name (not display name)
          d = ports[p.name];
        }

        if (d === undefined) {
          // Still no docs found, try using regexp
          const keys = Object.keys(ports);
          keys.sort((a, b) => b.length - a.length); // Match "longest" regexp first, so "*" becomes the last to match
          const matchingPort = keys.find((key) => p.name.match(new RegExp(key)));
          if (matchingPort) d = ports[matchingPort];
        }

        if (d) {
          // There is documentation for this port
          setDocs(d);
          setShowDocs(true);
        }
      });
    }
  };

  const onMouseOut = () => {
    _shouldShowDocsForPort[props.port.name] = false;
    PopupLayer.instance.hideTooltip();
    clearTimeout(tooltipTimeout);
    setDocs(undefined);
    setShowDocs(false);
  };

  const p = props.port;
  const state = (props.isSelected && 'selected') || (p.disabled && 'disabled') || 'enabled';

  useEffect(() => {
    if (props.isSelected) {
      ref?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [props.isSelected]);

  return (
    <div>
      <div
        ref={ref}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        className={classNames(css.listElementPort, css[state])}
        onClick={props.onClick}
      >
        {NodeLibrary.nameForPortType(p.type) === 'signal' ? <div className={css.signalIcon} /> : null}
        {p.annotatedName !== undefined ? (
          <span dangerouslySetInnerHTML={{ __html: p.annotatedName }} />
        ) : (
          <span>{p.displayName}</span>
        )}
        {showDocs ? <DocsPopup name={p.displayName} type={p.type} body={docs} /> : null}
      </div>
    </div>
  );
}
