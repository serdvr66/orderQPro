// context/AuthContext.js - Mit AsyncStorage Persistence
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

// Storage Keys
const STORAGE_KEYS = {
  USER: '@auth_user',
  TOKEN: '@auth_token',
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // TRUE beim Start
  const apiContextRef = useRef(null);

  // Bei App-Start: Gespeicherte Session laden
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('📱 Loading stored auth...');
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (storedToken && storedUser) {
        console.log('✅ Found stored session');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        console.log('ℹ️ No stored session found');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, authToken) => {
    console.log('🔐 Login called:', userData.email);
    
    try {
      // State setzen
      setToken(authToken);
      setUser(userData);
      
      // In AsyncStorage speichern
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData)),
      ]);
      
      console.log('✅ Session saved to storage');
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  };

  const logout = async () => {
    console.log('🚪 Logout called');
    
    // Push-Token vom Backend entfernen
    if (apiContextRef.current && user?.company_id) {
      try {
        console.log('🔄 Unregistering push token on logout...');
        await apiContextRef.current.unregisterPushToken();
        console.log('✅ Push token unregistered');
      } catch (error) {
        console.log('⚠️ Failed to unregister push token:', error);
      }
    }
    
    try {
      // State leeren
      setToken(null);
      setUser(null);
      
      // AsyncStorage leeren
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
      
      console.log('✅ Session cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  };

  const setApiContextForLogout = (api) => {
    apiContextRef.current = api;
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    setApiContextForLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};