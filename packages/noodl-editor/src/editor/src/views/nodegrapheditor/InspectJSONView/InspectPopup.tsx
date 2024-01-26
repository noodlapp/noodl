import classNames from 'classnames';
import React from 'react';
import ReactJson from 'react-json-view';

import { ProjectModel } from '@noodl-models/projectmodel';

import { ToastLayer } from '../../ToastLayer/ToastLayer';
import css from './InspectPopup.module.scss';

type ValueType = 'text' | 'value' | 'image' | 'color';
type DebugObjectType = { type: ValueType; value: any };

type DebugValueType = string | DebugObjectType | [DebugObjectType];

type InspectPopupProps = {
  debugValue: DebugValueType;
  onPinClicked: () => void;
  pinned: boolean;
};

export function InspectPopup({ debugValue, onPinClicked, pinned }: InspectPopupProps) {
  if (debugValue === undefined) {
    return null;
  }

  if (typeof debugValue === 'string') {
    debugValue = { type: 'value', value: debugValue };
  }

  if (!Array.isArray(debugValue)) {
    debugValue = [debugValue];
  }

  const hasValuesToShow = debugValue.some((v) => v.value !== undefined);
  if (!hasValuesToShow) {
    return null;
  }

  return (
    <div className={css.Root}>
      <button onClick={onPinClicked} className={classNames(css.PinButton, pinned && css['is-pinned'])} />

      <div className={css.ValueContainer}>
        {debugValue.map((value: DebugObjectType, i: number) => {
          if (value.type === 'image') {
            return <ImageInspector source={value.value} key={i} />;
          } else if (value.type === 'color') {
            return <ColorInspector color={value.value} key={i} />;
          } else {
            return typeof value.value === 'object' && value.value !== null ? (
              <ObjectInspector value={value.value} key={i} />
            ) : (
              <ValueInspector value={value.value} key={i} />
            );
          }
        })}
      </div>
    </div>
  );
}

function ObjectInspector({ value }: { value: Record<string, unknown> | unknown[] }) {
  return (
    <>
      {Array.isArray(value) ? <ValueInspector value={'Count: ' + value.length} /> : null}
      <ReactJson
        src={value}
        theme={{
          base00: '#eaeaea',
          base01: '#eaeaea',
          base02: '#575757',
          base03: '#8b877f',
          base04: '#eaeaea',
          base05: '#eaeaea',
          base06: '#a0a0a0',
          base07: '#a0a0a0',
          base08: '#eaeaea',
          base09: '#f7c967',
          base0A: '#bcaffb',
          base0B: '#77C9D4',
          base0C: '#a0a0a0',
          base0D: '#a0a0a0',
          base0E: '#e5ae32', // copyToClipboardCheck (--base-color-yellow-300)
          base0F: '#b8b8b8' // copyToClipboard (--base-color-grey-300)
        }}
        enableClipboard={() => {
          ToastLayer.showInteraction('Copied');
        }}
        style={{ backgroundColor: 'transparent' }}
        name={false}
        indentWidth={2}
        displayObjectSize={false}
        displayDataTypes={false}
        quotesOnKeys={false}
        collapsed={1}
      />
    </>
  );
}

function ValueInspector({ value }) {
  return <div className={css.ValueInspector}>{String(value)}</div>;
}

function ColorInspector({ color }) {
  const c = ProjectModel.instance.resolveColor(color);

  return (
    <div className={css.ValueInspector} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ backgroundColor: c, width: '20px', height: '20px' }} />
      {color}
    </div>
  );
}

function ImageInspector({ source }: { source: string }) {
  let src: string;

  if (source.startsWith('http')) {
    src = source;
  } else {
    const protocol = process.env.ssl ? 'https' : 'http';
    const port = process.env.NOODLPORT || 8574;
    src = `${protocol}://localhost:${port}/${source}`;
  }

  return (
    <div className={css.ValueInspector}>
      <img src={src} />
    </div>
  );
}
