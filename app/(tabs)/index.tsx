// app/(tabs)/index.tsx - Enhanced Version with Waiter Calls Integration
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../../context/ApiContext';
import { useAuth } from '../../context/AuthContext';

// TypeScript Interfaces
interface Item {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  price: string;
  status: string;
}

interface OrderItem {
  id: number;
  uuid: string;
  table_id: number;
  item_id: number;
  status: string;
  price: string;
  quantity: string;
  subtotal: string;
  is_ready: number;
  note?: string;
  configurations?: any;
  is_added_by_staff: number;
  created_at: string;
  item: Item;
}

interface Order {
  id: number;
  uuid: string;
  company_id: number;
  status: string;
  subtotal: string;
  total_items: number;
  note?: string;
  created_at: string;
  order_source: 'guest' | 'staff';
  order_items: OrderItem[];
}

interface WaiterCall {
  id: number;
  table_id: number;
  table_name: string;
  table_code: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
  time_ago: string;
}

export default function IndexScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [tables, setTables] = useState<{[key: number]: string}>({});
  const [showWaiterCallsModal, setShowWaiterCallsModal] = useState(false);
  const previousOrderCount = useRef(0);
  const refreshIntervalRef = useRef<number | null>(null);
  const waiterCallsIntervalRef = useRef<number | null>(null);

  // Animation für Badge
  const badgeScale = useRef(new Animated.Value(1)).current;

  const { 
    getOrders, 
    toggleItemReady, 
    cancelOrderItem, 
    completeOrderByStaff, 
    getAllTables,
    getWaiterCalls,
    confirmWaiterCall
  } = useApi();
  const { user, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();

  // Auth-Guard & Load Tables
  useEffect(() => {
    if (!isAuthenticated && !user) {
      console.log('❌ Index: Nicht eingeloggt - Umleitung zur Login-Seite');
      router.replace('/login');
      return;
    }

    if (!hasPermission('show_order')) {
      console.log('❌ Keine Berechtigung für Orders');
      Alert.alert(
        'Keine Berechtigung',
        'Sie haben keine Berechtigung, Bestellungen anzuzeigen.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/kellner') }]
      );
      return;
    }
    
    // Load tables for name mapping
    loadTableNames();
  }, [isAuthenticated, user]);

  // Function to load table names
  const loadTableNames = async () => {
    try {
      const response = await getAllTables();
      if (response && response.success && response.data) {
        const tableMap: {[key: number]: string} = {};
        response.data.forEach((table: any) => {
          tableMap[parseInt(table.id)] = table.name;
        });
        setTables(tableMap);
        console.log('📋 Tischnamen geladen:', tableMap);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Tischnamen:', error);
    }
  };

  // Funktion für lokale Push-Notification
  const sendNewOrderNotification = async (newOrdersCount: number) => {
    try {
      console.log('📱 Sende Push-Notification...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Neue Bestellung!",
          body: `${newOrdersCount} neue ${newOrdersCount === 1 ? 'Bestellung' : 'Bestellungen'} erhalten`,
          data: { screen: 'orders' },
          sound: true,
        },
        trigger: null,
      });
      console.log(`✅ Push-Notification erfolgreich gesendet für ${newOrdersCount} neue Bestellung(en)`);
    } catch (error) {
      console.error('❌ Fehler beim Senden der Notification:', error);
    }
  };

  // Test-Funktion für Waiter Calls (temporär für Debugging)
  const testWaiterCallsAPI = async () => {
    try {
      console.log('🧪 === MANUAL WAITER CALLS TEST ===');
      console.log('🧪 Triggering manual test...');
      await handleLoadWaiterCalls();
    } catch (error) {
      console.error('🧪 Manual test failed:', error);
    }
  };

  // Füge einen Debug-Button temporär hinzu (später entfernen)
  const showDebugButton = __DEV__; // Nur in Development
  const animateBadge = () => {
    Animated.sequence([
      Animated.timing(badgeScale, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(badgeScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Waiter Calls laden - MIT DEBUGGING
  const handleLoadWaiterCalls = async () => {
    try {
      console.log('🔔 === WAITER CALLS DEBUG START ===');
      console.log('🔔 User authenticated:', isAuthenticated);
      console.log('🔔 User data:', user);
      console.log('🔔 About to test simple route first...');
      
      // Test 1: Einfache Test-Route
      try {
        const testResponse = await fetch('https://staging.orderq.de/api/test-waiter-calls', {
          headers: {
            'Authorization': `Bearer ${user?.token || 'missing'}`,
            'Accept': 'application/json',
          }
        });
        console.log('🔔 Test route status:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('🔔 Test route success:', testData);
        } else {
          console.log('🔔 Test route failed');
        }
      } catch (testError) {
        console.log('🔔 Test route error:', testError);
      }
      
      console.log('🔔 Now trying actual waiter calls...');
      const response = await getWaiterCalls();
      
      console.log('🔔 Raw API Response:', response);
      console.log('🔔 Response success:', response?.success);
      console.log('🔔 Response data:', response?.data);
      console.log('🔔 Data is array:', Array.isArray(response?.data));

      if (response && response.success) {
        const newCalls = Array.isArray(response.data) ? response.data : [];
        const previousCallCount = waiterCalls.length;
        
        console.log('🔔 Previous call count:', previousCallCount);
        console.log('🔔 New calls count:', newCalls.length);
        console.log('🔔 New calls data:', newCalls);
        
        // Animiere Badge wenn neue Calls da sind
        if (newCalls.length > previousCallCount && previousCallCount > 0) {
          console.log('🔔 Animating badge - new calls detected!');
          animateBadge();
        }
        
        setWaiterCalls(newCalls);
        console.log(`🔔 ✅ ${newCalls.length} Waiter Calls erfolgreich geladen`);
      } else {
        console.log('🔔 ❌ Response not successful or no response');
        console.log('🔔 Full response object:', JSON.stringify(response, null, 2));
      }
      
      console.log('🔔 === WAITER CALLS DEBUG END ===');
    } catch (error: any) {
      console.error('🔔 ❌ ERROR loading waiter calls:', error);
      console.error('🔔 Error message:', error.message);
      console.error('🔔 Error stack:', error.stack);
    }
  };

  // Auto-Refresh für Waiter Calls
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('🔔 Auto-Refresh für Waiter Calls gestartet');
    
    const startWaiterCallsInterval = () => {
      handleLoadWaiterCalls();
      
      waiterCallsIntervalRef.current = setInterval(() => {
        handleLoadWaiterCalls();
      }, 3000); // Alle 3 Sekunden
    };

    startWaiterCallsInterval();

    return () => {
      if (waiterCallsIntervalRef.current) {
        clearInterval(waiterCallsIntervalRef.current);
      }
    };
  }, [isAuthenticated, user]);

  // Auto-Refresh für Bestellungen mit intelligenter Pause
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('🚀 Auto-Refresh gestartet');
    
    const startRefreshInterval = () => {
      handleLoadOrders();
      
      refreshIntervalRef.current = setInterval(() => {
        // Pause Auto-Refresh wenn Actions pending sind
        if (pendingActions.size === 0) {
          handleLoadOrders();
        } else {
          console.log('⏸️ Auto-Refresh pausiert - Actions pending:', pendingActions.size);
        }
      }, 2000);
    };

    startRefreshInterval();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, user, pendingActions]);

  const handleLoadOrders = async () => {
    try {
      console.log('🔄 Lade Bestellungen...');
      const response = await getOrders();

      if (response && response.success) {
        const newOrders = Array.isArray(response.data) ? response.data : [];

        console.log(`📊 Vorherige Anzahl: ${previousOrderCount.current}`);
        console.log(`📊 Aktuelle Anzahl: ${newOrders.length}`);

        // Prüfen ob neue Bestellungen da sind
        if (previousOrderCount.current > 0 && newOrders.length > previousOrderCount.current) {
          const newOrdersCount = newOrders.length - previousOrderCount.current;
          console.log(`🔔 ${newOrdersCount} neue Bestellung(en) erkannt!`);
          await sendNewOrderNotification(newOrdersCount);
        } else {
          console.log('ℹ️ Keine neuen Bestellungen');
        }

        previousOrderCount.current = newOrders.length;
        setOrders(newOrders);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
    }
  };

  // Waiter Call bestätigen
  const handleConfirmWaiterCall = async (callId: number) => {
    try {
      console.log('✅ Bestätige Waiter Call:', callId);
      
      // Optimistisches Update - entferne Call aus UI
      setWaiterCalls(prevCalls => prevCalls.filter(call => call.id !== callId));
      
      // API Call
      await confirmWaiterCall(callId);
      console.log('✅ Waiter Call erfolgreich bestätigt');
      
    } catch (error) {
      console.error('❌ Fehler beim Bestätigen des Waiter Calls:', error);
      // Reload bei Fehler
      handleLoadWaiterCalls();
    }
  };

  // Item als fertig markieren - Verbesserte UX
  const toggleItemReadyStatus = async (orderItem: OrderItem) => {
    const actionKey = `toggle-${orderItem.uuid}`;
    
    try {
      console.log('🔄 Toggle item ready status:', orderItem.id);
      
      // Action als pending markieren
      setPendingActions(prev => new Set(prev).add(actionKey));
      
      // Optimistisches Update in der UI
      setOrders(prevOrders => 
        prevOrders.map(order => ({
          ...order,
          order_items: order.order_items.map(item => 
            item.uuid === orderItem.uuid 
              ? { ...item, is_ready: item.is_ready ? 0 : 1 }
              : item
          )
        }))
      );

      // Echter API-Call mit ID
      await toggleItemReady(orderItem.id);
      console.log('✅ Item status erfolgreich geändert');
      
      // Nach erfolgreichem API-Call nochmal die aktuellen Daten laden
      setTimeout(() => {
        handleLoadOrders();
      }, 500); // Kurze Verzögerung für Server-Sync
      
    } catch (error) {
      console.error('❌ Fehler beim Umschalten des Item-Status:', error);
      // Rollback bei Fehler - lade Daten neu
      handleLoadOrders();
    } finally {
      // Action als abgeschlossen markieren
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  // Item stornieren - Mit Bestätigungsabfrage
const cancelItem = async (orderItem: OrderItem) => {
  // Zeige Bestätigungsabfrage
  Alert.alert(
    'Item stornieren',
    `Möchten Sie "${orderItem.item.title}" wirklich stornieren?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`,
    [
      {
        text: 'Abbrechen',
        style: 'cancel',
      },
      {
        text: 'Stornieren',
        style: 'destructive',
        onPress: async () => {
          const actionKey = `cancel-${orderItem.uuid}`;
          
          try {
            console.log('❌ Storniere Item:', orderItem.id);
            
            // Action als pending markieren
            setPendingActions(prev => new Set(prev).add(actionKey));
            
            // Optimistisches Update - entferne Item aus UI
            setOrders(prevOrders => 
              prevOrders.map(order => ({
                ...order,
                order_items: order.order_items.filter(item => item.uuid !== orderItem.uuid)
              })).filter(order => order.order_items.length > 0)
            );

            // Echter API-Call mit ID
            await cancelOrderItem(orderItem.id);
            console.log('✅ Item erfolgreich storniert');
            
            // Nach erfolgreichem API-Call aktuelle Daten laden
            setTimeout(() => {
              handleLoadOrders();
            }, 500);
            
          } catch (error) {
            console.error('❌ Fehler beim Stornieren:', error);
            // Rollback bei Fehler
            handleLoadOrders();
          } finally {
            // Action als abgeschlossen markieren
            setPendingActions(prev => {
              const newSet = new Set(prev);
              newSet.delete(actionKey);
              return newSet;
            });
          }
        }
      }
    ]
  );
};

  // Bestellung abschließen
  const completeOrder = async (order: Order) => {
    try {
      console.log('✅ Schließe Bestellung ab:', order.id);
      
      // Optimistisches Update - entferne Bestellung aus Liste
      setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));

      // Echter API-Call
      await completeOrderByStaff(order.id);
      console.log('✅ Bestellung erfolgreich abgeschlossen');
      
    } catch (error) {
      console.error('❌ Fehler beim Abschließen:', error);
      // Rollback bei Fehler
      handleLoadOrders();
    }
  };

  // Helper: Tisch-ID aus Order Items extrahieren
  const getTableId = (order: Order): number | null => {
    return order.order_items.length > 0 ? order.order_items[0].table_id : null;
  };

  // Helper: Tischname basierend auf ID abrufen
  const getTableName = (tableId: number | null): string => {
    if (!tableId) return 'Unbekannter Tisch';
    return tables[tableId] || `Tisch ${tableId}`;
  };

  // Helper: Bestellungen nach Tisch gruppieren
  const groupOrdersByTable = (orders: Order[]) => {
    const grouped = orders.reduce((acc, order) => {
      const tableId = getTableId(order);
      if (tableId !== null) {
        if (!acc[tableId]) {
          acc[tableId] = [];
        }
        acc[tableId].push(order);
      }
      return acc;
    }, {} as Record<number, Order[]>);

    // Sortiere Bestellungen innerhalb jeder Tischgruppe nach Erstellungszeit (ÄLTESTE ZUERST)
    Object.keys(grouped).forEach(tableId => {
      grouped[parseInt(tableId)].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return grouped;
  };

  // Helper: Gesamtsumme für Tisch berechnen
  const getTableTotal = (tableOrders: Order[]): number => {
    return tableOrders.reduce((sum, order) => sum + parseFloat(order.subtotal), 0);
  };

  // Helper: Prüfen ob alle Items eines Tisches fertig sind
  const areAllTableItemsReady = (tableOrders: Order[]): boolean => {
    return tableOrders.every(order => 
      order.order_items.every(item => item.is_ready === 1)
    );
  };

  // Helper: Status-Icon für Items
  const getStatusIcon = (orderItem: OrderItem) => {
    if (orderItem.is_ready === 1) {
      return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
    }
    return <Ionicons name="time-outline" size={24} color="#f59e0b" />;
  };

  // Helper: Bestellungszeit formatieren
  const formatOrderTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

 const getOrderSourceIcon = (order: Order) => {
  return order.order_source === 'staff' 
    ? <Ionicons name="briefcase" size={18} color="#625bff" />
    : <Ionicons name="people" size={18} color="#10b981" />;
};

  // Helper: Konfigurationen formatieren (wie in kellner.tsx)
  const renderItemConfigurations = (configurations: any) => {
    if (!configurations) return null;

    return (
      <View style={styles.itemConfigurations}>
        <Ionicons name="settings-outline" size={12} color="#6b7280" />
        <View style={styles.configurationsContent}>
          {/* Singles Konfigurationen */}
          {configurations.singles && Object.entries(configurations.singles).map(([key, config]: [string, any]) => (
            <Text key={key} style={styles.configurationText}>
              {key}: {config.value}
            </Text>
          ))}
          
          {/* Multiples Konfigurationen */}
          {configurations.multiples && Object.entries(configurations.multiples).map(([key, configs]: [string, any]) => (
            <View key={key}>
              <Text style={styles.configurationText}>
                {key}: {Array.isArray(configs) ? configs.map((c: any) => c.title).join(', ') : configs}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render nur wenn eingeloggt
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Wird geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Gruppiere Bestellungen nach Tisch
  const groupedOrders = groupOrdersByTable(orders);
  const tableIds = Object.keys(groupedOrders).map(Number).sort((a, b) => a - b);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header mit Waiter Calls Badge */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bestellungen</Text>
          <Text style={styles.headerSubtitle}>
            {tableIds.length} {tableIds.length === 1 ? 'Tisch' : 'Tische'} • {orders.length} {orders.length === 1 ? 'Bestellung' : 'Bestellungen'}
          </Text>
        </View>
        
        
     {/* Waiter Calls Badge - immer sichtbar */}
   <TouchableOpacity 
     style={styles.waiterCallsBadge}
     onPress={() => setShowWaiterCallsModal(true)}
   >
     <Ionicons name="notifications" size={24} color={waiterCalls.length > 0 ? "#ef4444" : "#94a3b8"} />
     {waiterCalls.length > 0 && (
       <Animated.View 
         style={[
           styles.badgeCounter,
           { transform: [{ scale: badgeScale }] }
         ]}
       >
         <Text style={styles.badgeCounterText}>{waiterCalls.length}</Text>
       </Animated.View>
     )}
   </TouchableOpacity>
      </View>

      {/* Waiter Calls Modal */}
      <Modal
        visible={showWaiterCallsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWaiterCallsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kellnerrufe</Text>
            <TouchableOpacity 
              onPress={() => setShowWaiterCallsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Waiter Calls Liste */}
          <ScrollView style={styles.modalContent}>
            {waiterCalls.length > 0 ? (
              waiterCalls.map((call) => (
                <View key={call.id} style={styles.waiterCallCard}>
                  <View style={styles.waiterCallHeader}>
                    <View style={styles.waiterCallInfo}>
                      <Text style={styles.waiterCallTable}>{call.table_name}</Text>
                      <Text style={styles.waiterCallTime}>{call.time_ago}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.confirmCallButton}
                      onPress={() => handleConfirmWaiterCall(call.id)}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                  {call.message && (
                    <Text style={styles.waiterCallMessage}>{call.message}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyCallsContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyCallsTitle}>Keine Kellnerrufe</Text>
                <Text style={styles.emptyCallsText}>Alle Rufe wurden bearbeitet</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {orders.length > 0 ? (
          <View style={styles.ordersContainer}>
            {tableIds.map((tableId) => {
              const tableOrders = groupedOrders[tableId];
              const tableTotal = getTableTotal(tableOrders);
              const allTableItemsReady = areAllTableItemsReady(tableOrders);

              return (
                <View key={tableId} style={styles.tableCard}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={styles.tableInfo}>
                      <Text style={styles.tableTitle}>{getTableName(tableId)}</Text>
                      <Text style={styles.tableSubtitle}>
                        {tableOrders.length} {tableOrders.length === 1 ? 'Bestellung' : 'Bestellungen'}
                      </Text>
                    </View>
                    <View style={styles.tableStatus}>
                      <Text style={styles.tableTotal}>€{tableTotal.toFixed(2)}</Text>
                      <Text style={[
                        styles.statusBadge,
                        { backgroundColor: allTableItemsReady ? '#10b981' : '#f59e0b' }
                      ]}>
                        {allTableItemsReady ? 'Fertig' : 'In Arbeit'}
                      </Text>
                    </View>
                  </View>

                  {/* Table Orders */}
                  <View style={styles.tableOrdersList}>
                    {tableOrders.map((order, orderIndex) => {
                      const orderTime = formatOrderTime(order.created_at);
                      const allItemsReady = order.order_items.every(item => item.is_ready === 1);

                      return (
<View key={order.id} style={order.order_source === 'staff' ? styles.orderCardStaff : styles.orderCardGuest}>
                          {/* Order Header */}
                          <View style={styles.orderHeader}>
                            <View style={styles.orderInfo}>
                             <View style={styles.orderSourceContainer}>
  {getOrderSourceIcon(order)}
  <Text style={styles.orderSubtitle}>{orderTime}</Text>
  <View style={[
    styles.orderSourceBadge,
    order.order_source === 'staff' ? styles.orderSourceBadgeStaff : styles.orderSourceBadgeGuest
  ]}>
    <Text style={[
      styles.orderSourceText,
      order.order_source === 'staff' ? styles.orderSourceTextStaff : styles.orderSourceTextGuest
    ]}>
      {order.order_source === 'staff' ? 'Personal' : 'Gast'}
    </Text>
  </View>
</View>
                            </View>
                            <View style={styles.orderStatus}>
                              <Text style={styles.orderTotal}>€{parseFloat(order.subtotal).toFixed(2)}</Text>
                              <Text style={[
                                styles.statusBadge,
                                { backgroundColor: allItemsReady ? '#10b981' : '#f59e0b' }
                              ]}>
                                {allItemsReady ? 'Fertig' : 'In Arbeit'}
                              </Text>
                            </View>
                          </View>

                          {/* Order Note */}
                          {order.note && (
                            <View style={styles.orderNote}>
                              <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
                              <Text style={styles.orderNoteText}>{order.note}</Text>
                            </View>
                          )}

                          {/* Order Items */}
                          <View style={styles.itemsList}>
                            {order.order_items.map((orderItem) => (
                              <View key={orderItem.id} style={styles.itemRow}>
                                <View style={styles.itemInfo}>
                                  <View style={styles.itemHeader}>
                                    <Text style={styles.itemName}>{orderItem.item.title}</Text>
                                  </View>
                                  
                                 
                                  {orderItem.note && (
                                    <View style={styles.itemNote}>
                                      <Ionicons name="chatbubble-outline" size={12} color="#6b7280" />
                                      <Text style={styles.itemNoteText}>{orderItem.note}</Text>
                                    </View>
                                  )}
                                  
                                  {/* Verbesserte Konfigurationsdarstellung */}
                                  {orderItem.configurations && renderItemConfigurations(orderItem.configurations)}
                                  
                                  <Text style={styles.itemPrice}>€{parseFloat(orderItem.subtotal).toFixed(2)}</Text>
                                </View>

                                <View style={styles.itemActions}>
                                  {/* Status Icon */}
                                  {getStatusIcon(orderItem)}
                                  
                                  {/* Ready Toggle Button mit Pending-Indikator */}
                                  <TouchableOpacity
                                    style={[
                                      styles.actionButton,
                                      { backgroundColor: orderItem.is_ready ? '#dc2626' : '#10b981' },
                                      pendingActions.has(`toggle-${orderItem.uuid}`) && styles.actionButtonPending
                                    ]}
                                    onPress={() => toggleItemReadyStatus(orderItem)}
                                    disabled={pendingActions.has(`toggle-${orderItem.uuid}`)}
                                  >
                                    {pendingActions.has(`toggle-${orderItem.uuid}`) ? (
                                      <View style={styles.pendingSpinner}>
                                        <Text style={styles.pendingDot}>⋯</Text>
                                      </View>
                                    ) : (
                                      <Ionicons 
                                        name={orderItem.is_ready ? "arrow-undo" : "checkmark"} 
                                        size={16} 
                                        color="white" 
                                      />
                                    )}
                                  </TouchableOpacity>

                                 {/* Cancel Button mit Pending-Indikator */}
                                  {hasPermission('cancel_order_item') && (
                                    <TouchableOpacity
                                      style={[
                                        styles.actionButton, 
                                        { backgroundColor: '#ef4444' },
                                        pendingActions.has(`cancel-${orderItem.uuid}`) && styles.actionButtonPending
                                      ]}
                                      onPress={() => cancelItem(orderItem)}
                                      disabled={pendingActions.has(`cancel-${orderItem.uuid}`)}
                                    >
                                      {pendingActions.has(`cancel-${orderItem.uuid}`) ? (
                                        <View style={styles.pendingSpinner}>
                                          <Text style={styles.pendingDot}>⋯</Text>
                                        </View>
                                      ) : (
                                        <Ionicons name="close" size={16} color="white" />
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>

                          {/* Order Actions - Einzelne Bestellung abschließen */}
                          <View style={styles.orderActions}>
                            <TouchableOpacity
                              style={[
                                styles.completeButton,
                                { backgroundColor: allItemsReady ? '#10b981' : '#f59e0b' }
                              ]}
                              onPress={() => completeOrder(order)}
                            >
                              <Ionicons name="checkmark-circle" size={20} color="white" />
                              <Text style={styles.completeButtonText}>
                                {allItemsReady ? 'Teilbestellung abschließen' : 'Trotzdem abschließen'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={80} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Keine neuen Bestellungen</Text>
            <Text style={styles.emptySubtext}>
              Alle Bestellungen sind abgearbeitet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  // Waiter Calls Badge Styles
  waiterCallsBadge: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
  },
  badgeCounter: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeCounterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // Waiter Call Card Styles
  waiterCallCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  waiterCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waiterCallInfo: {
    flex: 1,
  },
  waiterCallTable: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  waiterCallTime: {
    fontSize: 14,
    color: '#64748b',
  },
  waiterCallMessage: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    fontStyle: 'italic',
  },
  confirmCallButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty States
  emptyCallsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyCallsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyCallsText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ordersContainer: {
    gap: 24,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#625bff',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableInfo: {
    flex: 1,
  },
  tableTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  tableSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  tableStatus: {
    alignItems: 'flex-end',
  },
  tableTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  tableOrdersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#94a3b8',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderSourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    minWidth: 60,
  },
  orderNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  orderNoteText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  itemsList: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#625bff',
    marginLeft: 8,
  },
  itemDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  itemNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  itemNoteText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  itemConfigurations: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  configurationsContent: {
    flex: 1,
  },
  configurationText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonPending: {
    opacity: 0.7,
  },
  pendingSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingDot: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 24,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },


orderCardStaff: {
  backgroundColor: '#f0f4ff', 
  borderRadius: 12,
  padding: 16,
  borderLeftWidth: 3,
  borderLeftColor: '#625bff', 
},
orderCardGuest: {
  backgroundColor: '#f0fdf4', 
  borderRadius: 12,
  padding: 16,
  borderLeftWidth: 3,
  borderLeftColor: '#10b981', 
},
orderSourceBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  gap: 4,
  marginLeft: 8,
},
orderSourceBadgeStaff: {
  backgroundColor: '#e0e7ff',
},
orderSourceBadgeGuest: {
  backgroundColor: '#dcfce7',
},
orderSourceText: {
  fontSize: 11,
  fontWeight: '600',
  textTransform: 'uppercase',
},
orderSourceTextStaff: {
  color: '#625bff',
},
orderSourceTextGuest: {
  color: '#10b981',
},
});