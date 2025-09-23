// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../../context/ApiContext';
import { useAuth } from '../../context/AuthContext';

export default function IndexScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const previousOrderCount = useRef(0); // Für Vergleich neuer Bestellungen

  const { getOrders } = useApi();
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
        trigger: null, // Sofort senden
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
    }, 2000); // Alle 2 Sekunden prüfen

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

        // Aktuelle Anzahl für nächsten Vergleich speichern
        previousOrderCount.current = newOrders.length;
        setOrders(newOrders);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
    }
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
              const orderTime = new Date(order.created_at).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <View key={order.id} style={styles.orderCard}>
                  <Text style={styles.orderText}>neue bestellung</Text>
                  <Text style={styles.timeText}>{orderTime}</Text>
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
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 6,
    borderLeftColor: '#625bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
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