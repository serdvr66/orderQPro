// context/ApiContext.js - Erweitert um Kellner-Funktionen und Abrechnung
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
//  const BASE_URL = 'https://www.orderq.de/api';
const BASE_URL = 'https://staging.orderq.de/api'

  const apiCall = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
    }

    try {
   
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

   

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!response.ok) {
        console.error('💥 API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        throw new Error(data.message || data.error || 'API Error');
      }

      console.log('✅ === API CALL SUCCESS ===');
      return data;
      
    } catch (error) {
  
      
      console.log('Network Error: API call failed:', error.message);
      throw error;
    }
  };

  // ========== BESTEHENDE METHODEN ==========
  const login = async (email, password) => {
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

  // ========== KELLNER METHODEN ==========
  
  // Alle Tische für Kellner abrufen
  const getAllTables = async () => {
    console.log('🍽️ Fetching all tables for waiter...');
    return apiCall('/tables');
  };

  // Menü mit Kategorien und Items abrufen
  const getMenuForWaiter = async () => {
    console.log('📋 Fetching menu for waiter...');
    return apiCall('/menu');
  };

  // Details eines spezifischen Tisches
  const getTableDetails = async (tableCode) => {
    console.log('🏷️ Fetching table details for:', tableCode);
    return apiCall(`/table/${tableCode}/details`);
  };

  // Neue Table Session starten
  const startTableSession = async (tableCode) => {
    console.log('🚀 Starting table session for:', tableCode);
    return apiCall('/table/start-session', {
      method: 'POST',
      body: JSON.stringify({ table_code: tableCode }),
    });
  };

  // Bestellung aufgeben (Kellner-Version)
  const placeWaiterOrder = async (tableCode, cartData, note = null) => {
    console.log('🛎️ Placing waiter order for table:', tableCode);
    console.log('🛒 Cart data:', cartData);
    console.log('📝 Note:', note);
    
    return apiCall('/order/place', {
      method: 'POST',
      body: JSON.stringify({
        table_code: tableCode,
        cart: cartData,
        note: note,
        placed_by_staff: true // Markierung als Staff-Bestellung
      }),
    });
  };

  // ========== NEUE ABRECHNUNGS-METHODEN ==========
  
  // Abrechnungsdaten für einen Tisch abrufen
  const getTableBilling = async (tableCode) => {
    console.log('💰 Fetching billing data for table:', tableCode);
    return apiCall(`/table/${tableCode}/billing`);
  };

  // Item Bezahlstatus umschalten (bezahlt <-> unbezahlt)
  const toggleItemPaid = async (itemUuid) => {
    console.log('💳 Toggling payment status for item:', itemUuid);
    return apiCall(`/item/${itemUuid}/toggle-paid`, {
      method: 'POST',
    });
  };

  // Item stornieren
  const cancelItem = async (itemUuid) => {
    console.log('❌ Cancelling item:', itemUuid);
    return apiCall(`/item/${itemUuid}/cancel`, {
      method: 'POST',
    });
  };

  // Komplette Session bezahlen
  const paySession = async (tableCode) => {
    console.log('💰 Processing payment for table session:', tableCode);
    return apiCall(`/session/${tableCode}/pay`, {
      method: 'POST',
    });
  };

  // Session beenden
  const endSession = async (tableCode) => {
    console.log('🔚 Ending table session:', tableCode);
    return apiCall(`/session/${tableCode}/end`, {
      method: 'POST',
    });
  };

  // Mehrere Items auf einmal bezahlen
  const bulkPayItems = async (itemIds) => {
    console.log('💳 Bulk paying items:', itemIds);
    return apiCall('/items/bulk-pay', {
      method: 'POST',
      body: JSON.stringify({
        item_ids: itemIds,
      }),
    });
  };

  // Bestellung zu anderem Tisch verschieben
  const moveOrder = async (sourceTableCode, targetTableCode, itemIds = null) => {
    console.log('🚚 Moving order from', sourceTableCode, 'to', targetTableCode);
    return apiCall(`/orders/${sourceTableCode}/move`, {
      method: 'POST',
      body: JSON.stringify({
        table_code: targetTableCode,
        item_ids: itemIds, // Optional: nur bestimmte Items verschieben
      }),
    });
  };

  // ========== PUSH-TOKEN METHODEN ==========
  
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


  // ========== ORDER MANAGEMENT METHODEN ==========

// Item Ready Status umschalten (verwende UUID statt ID)
const toggleItemReady = async (itemUuid) => {
  console.log('🔄 Toggling item ready status:', itemUuid);
  return apiCall(`/item/${itemUuid}/toggle-ready`, {
    method: 'POST',
  });
};

// Item stornieren für Bestellseite (verwendet ID)
const cancelOrderItem = async (itemId) => {  // ← Parameter umbenennen für Klarheit
  console.log('❌ Cancelling order item:', itemId);
  return apiCall(`/order-item/${itemId}/cancel`, {  // ← Neue Route verwenden!
    method: 'POST',
  });
};

// Bestellung durch Staff abschließen (neue Route erforderlich)
const completeOrderByStaff = async (orderId) => {
  console.log('✅ Completing order by staff:', orderId);
  return apiCall(`/order/${orderId}/complete`, {
    method: 'POST',
  });
};

// Alle Bestellungen eines Tisches abschließen
const completeAllTableOrders = async (tableCode) => {
  console.log('✅ Completing all orders for table:', tableCode);
  return apiCall(`/completeAllOrder/${tableCode}`);
};

// ========== WAITER CALLS METHODEN ==========

// Alle Waiter Calls abrufen
const getWaiterCalls = async () => {
  console.log('🔔 Fetching waiter calls...');
  return apiCall('/waiter-calls');
};

// Waiter Call bestätigen
const confirmWaiterCall = async (callId) => {
  console.log('✅ Confirming waiter call:', callId);
  return apiCall(`/waiter-call/${callId}/confirm`, {
    method: 'POST',
  });
};
  const value = {
    // Bestehende Methoden
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
    
    // Kellner-Methoden
    getAllTables,
    getMenuForWaiter,
    getTableDetails,
    startTableSession,
    placeWaiterOrder,
    
    // Neue Abrechnungs-Methoden
    getTableBilling,
    toggleItemPaid,
    cancelItem,
    paySession,
    endSession,
    bulkPayItems,
    moveOrder,
  toggleItemReady,
  cancelOrderItem,
  completeOrderByStaff,
  completeAllTableOrders,
    getWaiterCalls,
  confirmWaiterCall,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};