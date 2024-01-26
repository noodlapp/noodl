import React, { createContext, useContext, useState } from 'react';

export interface ISideNavigationContext {
  isShowingTooltips: boolean;
  setIsShowingTooltips: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideNavigationContext = createContext<ISideNavigationContext>({
  isShowingTooltips: null,
  setIsShowingTooltips: null
});

export function SideNavigationContextProvider({ children }) {
  const [isShowingTooltips, setIsShowingTooltips] = useState(false);

  return (
    <SideNavigationContext.Provider
      value={{
        isShowingTooltips,
        setIsShowingTooltips
      }}
    >
      {children}
    </SideNavigationContext.Provider>
  );
}

export function useSideNavigationContext() {
  const context = useContext(SideNavigationContext);

  if (context === undefined) {
    throw new Error('useSideNavigationContext must be a child of SideNavigationContextProvider');
  }

  return context;
}
