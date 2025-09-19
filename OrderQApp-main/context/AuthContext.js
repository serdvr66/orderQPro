// context/AuthContext.js - Mit Push-Token Integration (FIXED)
import React, { createContext, useContext, useRef, useState } from 'react';

const AuthContext = createContext();

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
  const [isLoading, setIsLoading] = useState(false); // Immer false für jetzt
  const apiContextRef = useRef(null); // useRef statt useState - verhindert Re-renders

  // KEINE useEffect! KEINE AsyncStorage-Checks!
  // Alles manuell für jetzt

  const login = async (userData, authToken) => {
    console.log('Login called:', userData);
    setToken(authToken);
    setUser(userData);
    // AsyncStorage später hinzufügen
  };

  const logout = async () => {
    console.log('Logout called');
    
    // Push-Token vom Backend entfernen bei Logout
    if (apiContextRef.current && user?.company_id) {
      try {
        console.log('🔄 Unregistering push token on logout...');
        await apiContextRef.current.unregisterPushToken();
        console.log('✅ Push token unregistered on logout');
      } catch (error) {
        console.log('⚠️ Failed to unregister push token:', error);
      }
    } else if (apiContextRef.current && user) {
      try {
        console.log('🔄 Attempting to unregister push token (fallback)...');
        await apiContextRef.current.unregisterPushToken();
        console.log('✅ Push token unregistered on logout (fallback)');
      } catch (error) {
        console.log('⚠️ Failed to unregister push token (fallback):', error);
      }
    }
    
    setToken(null);
    setUser(null);
    // AsyncStorage später hinzufügen
  };

  // Methode um API Context zu setzen (wird vom PushTokenManager aufgerufen)
  const setApiContextForLogout = (api) => {
    apiContextRef.current = api; // Direkt in ref setzen - kein Re-render
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading, // Immer false
    login,
    logout,
    setApiContextForLogout, // Neue Methode
  };

  console.log('Auth state:', { isAuthenticated: !!token, isLoading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};