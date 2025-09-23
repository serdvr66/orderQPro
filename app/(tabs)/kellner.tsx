// app/(tabs)/kellner.tsx - Mit Menü-Loading erweitert
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

interface MenuItem {
  id: number;
  uuid: string;
  title: string;
  description: string;
  price: number;
  image: string | null;
  is_enabled: boolean;
}

interface MenuCategory {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  order: number;
  is_enabled: boolean;
  items: MenuItem[];
  subcategories: any[];
}

export default function KellnerScreen() {
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  
  // Data States
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  
  // UI States
  const [showMenu, setShowMenu] = useState(false);

  // API Hooks
  const { getAllTables, getMenuForWaiter } = useApi();
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

  const handleTableSelect = async (table: Table) => {
    console.log('🏷️ Table selected:', table.name);
    setSelectedTable(table);
    
    // Menü laden
    setIsLoadingMenu(true);
    try {
      console.log('📋 Loading menu for table:', table.name);
      const menuResponse = await getMenuForWaiter();
      console.log('📋 Menu loaded:', menuResponse);
      
      if (menuResponse && menuResponse.success && menuResponse.data) {
        // Nur aktive Kategorien mit Items anzeigen
        const activeCategories = menuResponse.data.filter((category: MenuCategory) => 
          category.is_enabled && category.items && category.items.length > 0
        );
        
        console.log('✅ Active categories found:', activeCategories.length);
        setMenuData(activeCategories);
        setShowMenu(true);
      } else {
        throw new Error('Keine Menü-Daten erhalten');
      }
    } catch (error: any) {
      console.error('❌ Menu loading failed:', error);
      Alert.alert('Fehler', 'Menü konnte nicht geladen werden: ' + error.message);
      setSelectedTable(null);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const handleBackToTables = () => {
    console.log('⬅️ Going back to table selection');
    setShowMenu(false);
    setSelectedTable(null);
    setMenuData([]);
  };

  if (!isAuthenticated) {
    return null;
  }

  // Menü-Ansicht
  if (showMenu && selectedTable && menuData.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Menü Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToTables}
          >
            <Ionicons name="arrow-back" size={24} color="#625BFF" />
            <Text style={styles.backButtonText}>Zurück</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Menü</Text>
            <Text style={styles.headerSubtitle}>Tisch: {selectedTable.name}</Text>
          </View>
          
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="basket-outline" size={24} color="#625BFF" />
            <Text style={styles.cartButtonText}>0</Text>
          </TouchableOpacity>
        </View>

        {/* Menü Content */}
        {isLoadingMenu ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#625BFF" />
            <Text style={styles.loadingText}>Lade Menü...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.menuTitle}>Menü-Kategorien</Text>
            
            {menuData.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryItemCount}>
                    {category.items.length} {category.items.length === 1 ? 'Artikel' : 'Artikel'}
                  </Text>
                </View>
                
                {category.description && (
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                )}
                
                {/* Vorschau der ersten 3 Items */}
                {category.items.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.menuItemPreview}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.itemDescription} numberOfLines={1}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                   <Text style={styles.itemPrice}>
{item.price ? `${Number(item.price).toFixed(2)} €` : 'Preis auf Anfrage'}
</Text>
                  </View>
                ))}
                
                {category.items.length > 3 && (
                  <Text style={styles.moreItemsText}>
                    +{category.items.length - 3} weitere Artikel...
                  </Text>
                )}
                
                <TouchableOpacity 
                  style={styles.viewCategoryButton}
                  onPress={() => {
                    console.log('📂 Opening category:', category.title);
                    // Hier später die Kategorie-Detailansicht öffnen
                    Alert.alert('Info', `Kategorie "${category.title}" wird geöffnet`);
                  }}
                >
                  <Text style={styles.viewCategoryButtonText}>Kategorie öffnen</Text>
                  <Ionicons name="chevron-forward" size={20} color="#625BFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // Standard Tisch-Auswahl Ansicht
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

      {isLoading || isLoadingMenu ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#625BFF" />
          <Text style={styles.loadingText}>
            {isLoading ? 'Lade Tische...' : 'Lade Menü...'}
          </Text>
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
  headerCenter: {
    alignItems: 'center',
    flex: 1,
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
  
  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#625BFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Cart Button
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  cartButtonText: {
    color: '#625BFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
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
  
  // Menü Styles
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  categoryItemCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  menuItemPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#625BFF',
  },
  moreItemsText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  viewCategoryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    marginTop: 8,
  },
  viewCategoryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#625BFF',
    marginRight: 4,
  },
  
  // Bestehende Tisch-Styles
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