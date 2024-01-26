import { Slot } from '@noodl-core-ui/types/global';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: Slot;
  portalRoot: Element;
}

export function Portal({ children, portalRoot }: PortalProps) {
  const elementRoot = document.createElement('div');

  useEffect(() => {
    portalRoot.appendChild(elementRoot);

    return () => {
      portalRoot.removeChild(elementRoot);
    };
  }, [portalRoot, elementRoot]);

  return createPortal(children, portalRoot);
}
