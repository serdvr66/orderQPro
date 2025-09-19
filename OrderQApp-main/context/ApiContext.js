// context/ApiContext.js - Debug Version mit umfassendem Logging
import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const { token } = useAuth();
  const BASE_URL = 'https://www.orderq.de/api';
//const BASE_URL = 'https://staging.orderq.de/api'
  const apiCall = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Sending request with token to:', endpoint);
      console.log('🔑 Token preview:', `${token.substring(0, 20)}...`);
    } else {
      console.log('❌ No auth token available for:', endpoint);
      console.log('API Warning: No auth token for:', endpoint);
    }

    try {
      console.log('📡 === API CALL START ===');
      console.log('📡 URL:', url);
      console.log('📡 Method:', options.method || 'GET');
      console.log('📡 Headers:', headers);
      console.log('📡 Body:', options.body || 'No body');
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!response.ok) {
        console.error('💥 API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        console.log('API Error:', `${response.status}: ${data.message || data.error || 'Unknown error'}`);
        throw new Error(data.message || data.error || 'API Error');
      }

      console.log('✅ === API CALL SUCCESS ===');
      return data;
      
    } catch (error) {
      console.error('💥 === API CALL FAILED ===');
      console.error('💥 Error details:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      
      console.log('Network Error: API call failed:', error.message);
      throw error;
    }
  };

  const login = async (email, password) => {
    console.log('🔐 Login attempt for:', email);
    return apiCall('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  };

  const getOrders = async () => {
    return apiCall('/orders');
  };

  const fetchOrders = async () => {
    return apiCall('/orders/fetch');
  };

  const completeOrder = async (orderId) => {
    return apiCall(`/orders/${orderId}/complete`, {
      method: 'POST',
    });
  };

  const completeAllOrders = async (orderCode) => {
    return apiCall(`/orders/complete-all/${orderCode}`, {
      method: 'POST',
    });
  };

  const getTables = async () => {
    return apiCall('/tables');
  };

  const getDashboardStats = async () => {
    return apiCall('/dashboard/stats');
  };

  const getAllOrderHistories = async () => {
    return apiCall('/order-histories');
  };

  // ✅ PUSH-TOKEN METHODEN MIT UMFASSENDEM DEBUGGING
  
  const registerPushToken = async (token, companyId, platform = 'ios', deviceId = null) => {
    console.log('🔥 === REGISTER PUSH TOKEN START ===');
    console.log('🔥 Token preview:', token ? `${token.substring(0, 30)}...` : 'NULL');
    console.log('🔥 Company ID:', companyId);
    console.log('🔥 Platform:', platform);
    console.log('🔥 Device ID:', deviceId);
    console.log('🔥 Auth token available:', !!token);
    
    console.log('API Debug: registerPushToken called - Company:', companyId, 'Platform:', platform, 'Device:', deviceId);
    
    if (!token) {
      const error = 'Push token is required';
      console.error('❌ No push token provided');
      console.log('API Error:', error);
      throw new Error(error);
    }
    
    if (!companyId) {
      const error = 'Company ID is required';
      console.error('❌ No company ID provided');
      console.log('API Error:', error);
      throw new Error(error);
    }
    
    try {
      const payload = {
        token,
        device_id: deviceId,
        platform,
        company_id: companyId
      };
      
      console.log('📤 Request payload:', payload);
      console.log('API Payload: Sending to /push-tokens:', JSON.stringify(payload, null, 2));
      
      const result = await apiCall('/push-tokens', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      console.log('🎉 === REGISTER PUSH TOKEN SUCCESS ===');
      console.log('🎉 Result:', result);
      console.log('API Success: Token registered successfully! Response:', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('💥 === REGISTER PUSH TOKEN FAILED ===');
      console.error('💥 Error:', error);
      console.log('API Failed: Token registration failed:', error.message);
      throw error;
    }
  };

  const unregisterPushToken = async (token) => {
    console.log('🗑️ === UNREGISTER PUSH TOKEN START ===');
    console.log('🗑️ Token preview:', token ? `${token.substring(0, 30)}...` : 'NULL');
    
    if (!token) {
      console.log('⚠️ No token provided for unregistration');
      return { success: true, message: 'No token to unregister' };
    }
    
    try {
      const result = await apiCall('/push-tokens', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      });
      
      console.log('🎉 === UNREGISTER PUSH TOKEN SUCCESS ===');
      console.log('🎉 Result:', result);
      return result;
    } catch (error) {
      console.error('💥 === UNREGISTER PUSH TOKEN FAILED ===');
      console.error('💥 Error:', error);
      throw error;
    }
  };

  const testPushNotification = async (companyId) => {
    console.log('🧪 === TEST PUSH NOTIFICATION START ===');
    console.log('🧪 Company ID:', companyId);
    
    console.log('Test Notification: Sending test to company', companyId);
    
    if (!companyId) {
      const error = 'Company ID is required for test notification';
      console.error('❌ No company ID provided');
      console.log('Test Error:', error);
      throw new Error(error);
    }
    
    try {
      const result = await apiCall('/push-tokens/test', {
        method: 'POST',
        body: JSON.stringify({ company_id: companyId }),
      });
      
      console.log('🎉 === TEST PUSH NOTIFICATION SUCCESS ===');
      console.log('🎉 Result:', result);
      console.log('Test Success: Notification sent! Result:', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('💥 === TEST PUSH NOTIFICATION FAILED ===');
      console.error('💥 Error:', error);
      console.log('Test Failed: Test notification failed:', error.message);
      throw error;
    }
  };

  const getPushTokens = async (companyId) => {
    console.log('🔍 === GET PUSH TOKENS START ===');
    console.log('🔍 Company ID:', companyId);
    
    if (!companyId) {
      const error = 'Company ID is required';
      console.error('❌ No company ID provided');
      throw new Error(error);
    }
    
    try {
      const result = await apiCall(`/push-tokens?company_id=${companyId}`);
      console.log('🎉 === GET PUSH TOKENS SUCCESS ===');
      console.log('🎉 Found tokens:', result?.length || 0);
      console.log('🎉 Tokens:', result);
      return result;
    } catch (error) {
      console.error('💥 === GET PUSH TOKENS FAILED ===');
      console.error('💥 Error:', error);
      throw error;
    }
  };

  // Debug-Methode für komplette Systemdiagnose
  const debugPushTokenSystem = async (companyId) => {
    console.log('🔧 === COMPLETE SYSTEM DIAGNOSIS START ===');
    console.log('System Diagnosis: Starting complete push token system check...');
    
    try {
      // 1. Auth-Status prüfen
      console.log('🔧 Step 1: Checking auth status...');
      console.log('Step 1: Auth token available:', !!token ? 'YES' : 'NO');
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // 2. Company ID prüfen
      console.log('🔧 Step 2: Checking company ID...');
      console.log('Step 2: Company ID:', companyId || 'MISSING');
      
      if (!companyId) {
        throw new Error('No company ID provided');
      }
      
      // 3. Bestehende Tokens abrufen
      console.log('🔧 Step 3: Fetching existing tokens...');
      const existingTokens = await getPushTokens(companyId);
      console.log('Step 3: Found', existingTokens?.length || 0, 'existing tokens');
      
      // 4. Test-Notification senden
      console.log('🔧 Step 4: Sending test notification...');
      const testResult = await testPushNotification(companyId);
      console.log('Step 4: Test result:', testResult?.success ? 'SUCCESS' : 'FAILED');
      
      console.log('🔧 === SYSTEM DIAGNOSIS COMPLETED ===');
      console.log('Diagnosis Complete: All system checks completed successfully!');
      
      return {
        success: true,
        authToken: !!token,
        companyId: companyId,
        existingTokens: existingTokens?.length || 0,
        testResult: testResult?.success || false
      };
      
    } catch (error) {
      console.error('🔧 === SYSTEM DIAGNOSIS FAILED ===');
      console.error('🔧 Error:', error);
      console.log('Diagnosis Failed: System check failed:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  const value = {
    login,
    getOrders,
    fetchOrders,
    completeOrder,
    completeAllOrders,
    getTables,
    getDashboardStats,
    getAllOrderHistories,
    registerPushToken,
    unregisterPushToken,
    testPushNotification,
    getPushTokens,
    debugPushTokenSystem,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};