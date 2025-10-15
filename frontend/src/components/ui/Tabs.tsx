import React, { useState, useCallback, useMemo, createContext, useContext, ReactNode, Children, isValidElement } from 'react';

// --- Types and Interfaces ---

interface TabProps {
  /** The unique identifier for the tab. */
  id: string;
  /** The label displayed on the tab button. */
  label: string;
  /** The content to be displayed when this tab is active. */
  children: ReactNode;
}

interface TabsContextType {
  activeTabId: string;
  setActiveTabId: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a Tabs component');
  }
  return context;
};

interface TabsProps {
  /** The children should be a list of Tab components. */
  children: ReactNode;
  /** The initial active tab ID. Defaults to the first tab's ID. */
  initialActiveTabId?: string;
  /** Optional class name for the main container. */
  className?: string;
}

// --- Helper Components ---

/**
 * A helper component to render the tab buttons.
 */
const TabButton: React.FC<{ id: string; label: string; index: number }> = ({ id, label, index }) => {
  const { activeTabId, setActiveTabId } = useTabsContext();
  const isActive = activeTabId === id;

  // Tailwind classes for styling, using custom colors 'sevensa-primary' (#00A896) and 'sevensa-dark' (#2D3A45)
  const baseClasses = 'px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none';
  const activeClasses = 'text-sevensa-primary border-b-2 border-sevensa-primary';
  const inactiveClasses = 'text-sevensa-dark hover:text-sevensa-primary hover:border-b-2 hover:border-sevensa-primary/50';

  const handleClick = useCallback(() => {
    setActiveTabId(id);
  }, [id, setActiveTabId]);

  return (
    <button
      id={`tab-${id}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
};

/**
 * A helper component to render the content panel for a tab.
 */
const TabPanel: React.FC<{ id: string; children: ReactNode }> = ({ id, children }) => {
  const { activeTabId } = useTabsContext();
  const isActive = activeTabId === id;

  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      hidden={!isActive}
      className="p-4 border border-t-0 border-gray-200 rounded-b-lg"
    >
      {children}
    </div>
  );
};

// --- Main Components ---

/**
 * Individual Tab component. It is primarily a container for props and content.
 * It should only be used as a child of the Tabs component.
 */
export const Tab: React.FC<TabProps> = ({ children }) => {
  // This component is only used to define the structure and props for its parent (Tabs).
  // Its children will be rendered inside TabPanel by the Tabs component.
  return <>{children}</>;
};

/**
 * A responsive and accessible Tabs component for navigation.
 *
 * @param {TabsProps} props - The component props.
 * @returns {JSX.Element} The Tabs component.
 */
const Tabs: React.FC<TabsProps> = ({ children, initialActiveTabId, className = '' }) => {
  const tabs = useMemo(() => {
    return Children.toArray(children)
      .filter(isValidElement)
      .map((child) => {
        if (child.type === Tab) {
          return child.props as TabProps;
        }
        return null;
      })
      .filter((props): props is TabProps => props !== null);
  }, [children]);

  const defaultActiveId = tabs.length > 0 ? tabs[0].id : '';
  const [activeTabId, setActiveTabId] = useState<string>(initialActiveTabId || defaultActiveId);

  // Ensure activeTabId is always a valid tab ID if the initial one is removed
  React.useEffect(() => {
    if (activeTabId && !tabs.some(tab => tab.id === activeTabId)) {
      setActiveTabId(defaultActiveId);
    }
  }, [tabs, activeTabId, defaultActiveId]);

  const activeTabContent = useMemo(() => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    return activeTab ? activeTab.children : null;
  }, [tabs, activeTabId]);

  const contextValue = useMemo(() => ({ activeTabId, setActiveTabId }), [activeTabId]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`w-full ${className}`}>
        {/* Tab List */}
        {/* flex-wrap ensures responsiveness by allowing tabs to wrap on smaller screens */}
        <div role="tablist" aria-label="Tab navigation" className="flex flex-wrap border-b border-gray-200">
          {tabs.map((tab, index) => (
            <TabButton key={tab.id} id={tab.id} label={tab.label} index={index} />
          ))}
        </div>

        {/* Tab Panel */}
        <TabPanel id={activeTabId} children={activeTabContent} />
      </div>
    </TabsContext.Provider>
  );
};

export default Tabs;

// NOTE: For the styling to work, the user must configure the following colors in their tailwind.config.js:
/*
module.exports = {
  theme: {
    extend: {
      colors: {
        'sevensa-primary': '#00A896', // Teal
        'sevensa-dark': '#2D3A45',    // Dark Slate
      },
    },
  },
  plugins: [],
}
*/