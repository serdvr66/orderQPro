// app/(tabs)/index.tsx - Enhanced Version with Item Details
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
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
  order_items: OrderItem[];
}

export default function IndexScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const previousOrderCount = useRef(0);

  const { getOrders, toggleItemReady, cancelOrderItem, completeOrderByStaff } = useApi();
  const { user, isAuthenticated } = useAuth();

  // Auth-Guard
  useEffect(() => {
    if (!isAuthenticated && !user) {
      console.log('❌ Index: Nicht eingeloggt - Umleitung zur Login-Seite');
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, user]);

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

  // Auto-Refresh für Bestellungen
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('🚀 Auto-Refresh gestartet');
    handleLoadOrders();

    const interval = setInterval(() => {
      handleLoadOrders();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

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

  // Item als fertig markieren
  const toggleItemReadyStatus = async (orderItem: OrderItem) => {
    try {
      console.log('🔄 Toggle item ready status:', orderItem.id);
      
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
      
    } catch (error) {
      console.error('❌ Fehler beim Umschalten des Item-Status:', error);
      // Rollback bei Fehler - lade Daten neu
      handleLoadOrders();
    }
  };

  // Item stornieren
  const cancelItem = async (orderItem: OrderItem) => {
    try {
      console.log('❌ Storniere Item:', orderItem.id);
      
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
      
    } catch (error) {
      console.error('❌ Fehler beim Stornieren:', error);
      // Rollback bei Fehler
      handleLoadOrders();
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bestellungen</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} {orders.length === 1 ? 'neue Bestellung' : 'neue Bestellungen'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {orders.length > 0 ? (
          <View style={styles.ordersContainer}>
            {orders.map((order) => {
              const tableId = getTableId(order);
              const orderTime = formatOrderTime(order.created_at);
              const allItemsReady = order.order_items.every(item => item.is_ready === 1);

              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderTitle}>
                        Bestellung #{order.id}
                      </Text>
                      <Text style={styles.orderSubtitle}>
                        {tableId ? `Tisch ${tableId}` : 'Unbekannter Tisch'} • {orderTime}
                      </Text>
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
                            <Text style={styles.itemQuantity}>×{parseFloat(orderItem.quantity)}</Text>
                          </View>
                          
                          {orderItem.item.description && (
                            <Text style={styles.itemDescription} numberOfLines={1}>
                              {orderItem.item.description}
                            </Text>
                          )}
                          
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
                          
                          {/* Ready Toggle Button */}
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              { backgroundColor: orderItem.is_ready ? '#dc2626' : '#10b981' }
                            ]}
                            onPress={() => toggleItemReadyStatus(orderItem)}
                          >
                            <Ionicons 
                              name={orderItem.is_ready ? "arrow-undo" : "checkmark"} 
                              size={16} 
                              color="white" 
                            />
                          </TouchableOpacity>

                          {/* Cancel Button */}
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                            onPress={() => cancelItem(orderItem)}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Order Actions */}
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
                        {allItemsReady ? 'Bestellung abschließen' : 'Trotzdem abschließen'}
                      </Text>
                    </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  ordersContainer: {
    gap: 20,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 18,
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
});