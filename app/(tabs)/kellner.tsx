// app/(tabs)/kellner.tsx - Mit korrekten TypeScript-Typen
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../../context/ApiContext';
import { useAuth } from '../../context/AuthContext';

// TypeScript Interfaces
interface Table {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  status: 'free' | 'occupied';
  session_count: number;
  pending_revenue: number;
  current_session?: any;
}

export default function KellnerScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // API Hooks
  const { getAllTables } = useApi();
  const { isAuthenticated, user } = useAuth();

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    loadTables();
  }, [isAuthenticated]);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      console.log('🍽️ Loading tables for kellner screen...');
      const response = await getAllTables();
      
      if (response && response.success) {
        console.log('✅ Tables loaded:', response.data?.length || 0);
        setTables(response.data || []);
      } else {
        console.log('⚠️ No tables data received');
        setTables([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading tables:', error);
      Alert.alert('Fehler', 'Tische konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = (table: Table) => {
    console.log('🏷️ Table selected:', table.name);
    setSelectedTable(table);
    // Hier später die Order-Funktionalität implementieren
    Alert.alert('Tisch gewählt', `Sie haben ${table.name} ausgewählt`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kellner</Text>
          <Text style={styles.headerSubtitle}>
            {tables.length} {tables.length === 1 ? 'Tisch verfügbar' : 'Tische verfügbar'}
          </Text>
        </View>
        
        {selectedTable && (
          <View style={styles.selectedTableIndicator}>
            <Text style={styles.selectedTableText}>{selectedTable.name}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#625BFF" />
          <Text style={styles.loadingText}>Lade Tische...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {tables.length > 0 ? (
            <View style={styles.tablesContainer}>
              <Text style={styles.sectionTitle}>Tische auswählen</Text>
              
              <View style={styles.tablesGrid}>
                {tables.map((table) => (
                  <TouchableOpacity
                    key={table.id || table.code}
                    style={[
                      styles.tableCard,
                      selectedTable?.id === table.id && styles.tableCardSelected
                    ]}
                    onPress={() => handleTableSelect(table)}
                  >
                    <Text style={styles.tableCardName}>{table.name}</Text>
                    
                    <View style={styles.tableCardStatus}>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: table.status === 'free' ? '#10b981' : '#f59e0b' }
                      ]} />
                      <Text style={styles.statusText}>
                        {table.status === 'free' ? 'Frei' : 'Belegt'}
                      </Text>
                    </View>
                    
                    {table.status === 'occupied' && (
                      <Text style={styles.tableCardRevenue}>
                        €{table.pending_revenue?.toFixed(2) || '0.00'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={80} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>Keine Tische verfügbar</Text>
              <Text style={styles.emptyStateText}>
                Momentan sind keine Tische verfügbar
              </Text>
              
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadTables}
              >
                <Ionicons name="refresh" size={20} color="#625BFF" />
                <Text style={styles.refreshButtonText}>Aktualisieren</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  selectedTableIndicator: {
    backgroundColor: '#625BFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedTableText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tablesContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    minHeight: 100,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableCardSelected: {
    borderColor: '#625BFF',
    backgroundColor: '#f8f9ff',
  },
  tableCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  tableCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tableCardRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#625BFF',
    fontWeight: '500',
  },
});