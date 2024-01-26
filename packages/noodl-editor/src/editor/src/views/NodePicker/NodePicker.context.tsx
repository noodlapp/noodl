import React, { useContext, createContext, useState } from 'react';

export interface INodePickerContext {
  isBlocked: boolean;
  doBlockPicker: () => void;
  doUnblockPicker: () => void;

  activeTab: string;
  setActiveTab: (value: string) => void;
}

const NodePickerContext = createContext<INodePickerContext>({
  isBlocked: false,
  doBlockPicker: null,
  doUnblockPicker: null,
  activeTab: null,
  setActiveTab: null
});

export function NodePickerContextProvider({ children }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('Nodes');

  return (
    <NodePickerContext.Provider
      value={{
        isBlocked: isBlocked,
        doBlockPicker: () => setIsBlocked(true),
        doUnblockPicker: () => setIsBlocked(false),
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </NodePickerContext.Provider>
  );
}

export function useNodePickerContext() {
  const context = useContext(NodePickerContext);

  if (context === undefined) {
    throw new Error('useNodePickerContext must be a child of WorkspaceContextProvider');
  }

  return context;
}
