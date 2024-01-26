import { useThrottle } from '@noodl-hooks/useThrottleState';
import React, { useEffect, useRef, useState } from 'react';

import { PrimaryButton, PrimaryButtonSize } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { useTrackBounds } from '@noodl-core-ui/hooks/useTrackBounds';

import css from './VisualCanvas.module.scss';

export interface VisualCanvasProps {
  onWebView: (webview: Electron.WebviewTag) => void;
  deviceName?: string;
  zoom: number;
}

export function VisualCanvas({ onWebView, deviceName, zoom }: VisualCanvasProps) {
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const containerRef = useRef(null);

  const webviewBounds = useThrottle(useTrackBounds(webviewRef), 100);
  const containerBounds = useThrottle(useTrackBounds(containerRef), 100);

  const [crashed, setCrashed] = useState(false);
  const [style, setStyle] = useState({});
  const [showViewportSize, setShowViewportSize] = useState(false);

  useEffect(() => {
    onWebView(webviewRef.current);

    if (webviewRef.current) {
      webviewRef.current.addEventListener('crashed', () => {
        setCrashed(true);
      });
    }
  }, [webviewRef]);

  function restart() {
    if (webviewRef.current) {
      setCrashed(false);
      onWebView(webviewRef.current);
    }
  }

  useEffect(() => {
    if (!webviewBounds || !containerBounds) {
      return;
    }

    if (webviewBounds.width > containerBounds.width && webviewBounds.height > containerBounds.height) {
      setStyle({});
    } else if (webviewBounds.width > containerBounds.width) {
      setStyle({ flexDirection: 'row', alignItems: 'center' });
    } else if (webviewBounds.height > containerBounds.height) {
      setStyle({ flexDirection: 'column', alignItems: 'center' });
    } else {
      setStyle({ alignItems: 'center', justifyContent: 'center' });
    }
  }, [webviewBounds, containerBounds]);

  useEffect(() => {
    if (!webviewBounds) {
      return;
    }

    setShowViewportSize(true);

    const timeout = setTimeout(() => {
      setShowViewportSize(false);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [containerBounds, webviewBounds]);

  return (
    <div className={css.Background}>
      {showViewportSize && (
        <div className={css.ViewportInfo}>{`${deviceName ? deviceName + ' -' : ''} ${Math.floor(
          webviewBounds.width
        )}x${Math.floor(webviewBounds.height)}px - ${Math.floor(zoom * 100)}%`}</div>
      )}
      <div className={css.WebviewContainer} style={style} ref={containerRef}>
        <webview
          className={css.Webview}
          ref={webviewRef}
          // @ts-expect-error. Typings think this is a boolean. It's not, html attributes are strings.
          disablewebsecurity="true"
          webpreferences="allowRunningInsecureContent, enableRemoteModule"
        />
      </div>

      {Boolean(crashed) && (
        <div className={css.Crashed}>
          <div className={css.CrashedContent}>
            <Label size={LabelSize.Big} hasBottomSpacing>
              Aw, Snap!
            </Label>
            <Text>Something went wrong while displaying this web page.</Text>
            <Box hasTopSpacing>
              <PrimaryButton size={PrimaryButtonSize.Small} label="Try again." onClick={restart} />
            </Box>
          </div>
        </div>
      )}
    </div>
  );
}
