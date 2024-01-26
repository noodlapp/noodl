import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import React, { useState, useEffect } from 'react';

/*
    TODO to reach parity with the popups in PopupLayer:
        - support arrows from more directions
        - align arrow with center of content
        - tooltips that expand and shows more content
        - optimization: don't render all the tooltip HTML if it's not showing (currently just hidden with opacity)
*/

function useShowThenHideWithTimeout(shouldShow) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (!shouldShow) {
      setIsShowing(false);
      return;
    }

    const timeoutId = setTimeout(() => setIsShowing(true), 500);
    return () => clearTimeout(timeoutId);
  }, [shouldShow]);

  return isShowing;
}

export interface TooltipProps {
  enabled?: boolean;
  text: string;

  children: TSFixme;
}

export default function Tooltip({ enabled, children, text }: TooltipProps) {
  if (enabled === false) {
    return children;
  }

  const [isHovering, setIsHovering] = useState(false);

  const show = useShowThenHideWithTimeout(isHovering);

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="popup-layer-tooltip"
        style={{ opacity: show ? 1 : 0, top: 'calc(100% + 5px)', whiteSpace: 'nowrap' }}
      >
        <Text textType={TextType.Proud}>{text}</Text>
        {/* hiding the arrow as no arrow is better than misplaced arrow */}
        {/* <span className="popup-layer-tooltip-arrow bottom" /> */}
      </div>
      <div onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        {children}
      </div>
    </div>
  );
}
