import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    theme: 'light',
    currency: 'USD',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    notifications: {
      email: true,
      push: true,
      desktop: true,
      expenseApproval: true,
      expenseRejection: true,
      newExpense: true,
      monthlyReport: true,
    },
    privacy: {
      showProfile: true,
      showActivity: false,
    },
    display: {
      density: 'standard',
      sidebarCollapsed: false,
      showWelcomeMessage: true,
    },
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const updateNestedSettings = (category, newSettings) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...newSettings,
      },
    }));
  };

  const resetSettings = () => {
    setSettings({
      theme: 'light',
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notifications: {
        email: true,
        push: true,
        desktop: true,
        expenseApproval: true,
        expenseRejection: true,
        newExpense: true,
        monthlyReport: true,
      },
      privacy: {
        showProfile: true,
        showActivity: false,
      },
      display: {
        density: 'standard',
        sidebarCollapsed: false,
        showWelcomeMessage: true,
      },
    });
    localStorage.removeItem('userSettings');
  };

  const value = {
    settings,
    updateSettings,
    updateNestedSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};