// app/(tabs)/kellner.tsx - Mit Tab Navigation für Bestellen und Rechnung + Edit-Buttons
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

interface ConfigurationOption {
  id: number;
  title: string;
  price_change: string | number;
  preselected: boolean;
  fixed_preselection?: boolean;
}

interface ItemConfiguration {
  id: number;
  title: string;
  type: 'single' | 'multiple';
  fixed_preselection: boolean;
  configuration_options: ConfigurationOption[];
}

interface MenuItem {
  id: number;
  uuid: string;
  title: string;
  description: string;
  price: string | number;
  image: string | null;
  is_enabled: boolean;
  is_disabled: boolean;
  sold_out: boolean;
  item_configurations?: ItemConfiguration[];
}

interface MenuCategory {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  order: number;
  is_enabled: boolean;
  items: MenuItem[];
  subcategories: MenuCategory[];
}

interface CartItem {
  uuid: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
  specialNote?: string;
  configurations?: {
    [configTitle: string]: string | string[];
  };
  configurationPriceChange?: number;
}

interface SelectedConfiguration {
  [configTitle: string]: string | string[];
}

// Neue Interfaces für Abrechnung
interface BillingItem {
  uuid: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
  status: string;
  is_paid: boolean;
  is_added_by_staff: boolean;
  configurations?: any;
  created_at: string;
}

interface Customer {
  session_id: number;
  customer_number: number;
  items: BillingItem[];
  session_revenue: number;
}

interface BillingData {
  table: {
    id: number;
    code: string;
    name: string;
  };
  customers: Customer[];
  totals: {
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
  };
  available_tables: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}

export default function KellnerScreen() {
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  
  // Data States
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [processedCategories, setProcessedCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Billing Data
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // UI States
  const [showOrderInterface, setShowOrderInterface] = useState(false);
  const [isCartExpanded, setIsCartExpanded] = useState(false); // Standardmäßig geschlossen
  const [activeTab, setActiveTab] = useState<'order' | 'billing'>('order'); // Neue Tab-State
  
  // Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState('');
  const [selectedConfigurations, setSelectedConfigurations] = useState<SelectedConfiguration>({});
  const [modalTotalPrice, setModalTotalPrice] = useState(0);
  
  // Edit Modal States
  const [isEditingCartItem, setIsEditingCartItem] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [showQuantitySplitModal, setShowQuantitySplitModal] = useState(false);
  const [splitQuantity, setSplitQuantity] = useState(1);

  // API Hooks - Erweitert mit Billing-Funktionen
  const { 
    getAllTables, 
    getMenuForWaiter, 
    placeWaiterOrder,
    getTableBilling,
    toggleItemPaid,
    cancelItem,
    paySession,
    endSession,
    bulkPayItems,
    moveOrder
  } = useApi();
  const { isAuthenticated, user } = useAuth();

  // Auth Guard
  useEffect(() => {
    if (isAuthenticated) {
      loadTables();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#625BFF" />
          <Text style={styles.loadingText}>Authentifizierung...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const response = await getAllTables();
      if (response && response.success) {
        setTables(response.data || []);
      } else {
        setTables([]);
      }
    } catch (error: any) {
      console.error('Error loading tables:', error);
      Alert.alert('Fehler', 'Tische konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    setIsLoadingMenu(true);
    
    try {
      const menuResponse = await getMenuForWaiter();
      
      if (menuResponse && menuResponse.success && menuResponse.data) {
        const rawCategories = menuResponse.data;
        
        // Process categories: Flatten subcategories into main level
        const processed = processMenuCategories(rawCategories);
        setProcessedCategories(processed);
        setMenuData(rawCategories);
        
        // Select first category by default
        if (processed.length > 0) {
          setSelectedCategory(processed[0]);
        }
        
        setShowOrderInterface(true);
        setActiveTab('order'); // Start auf Bestellen-Tab
      } else {
        throw new Error('Keine Menü-Daten erhalten');
      }
    } catch (error: any) {
      console.error('Menu loading failed:', error);
      Alert.alert('Fehler', 'Menü konnte nicht geladen werden');
      setSelectedTable(null);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Neue Funktion: Billing-Daten laden
  const loadBillingData = async () => {
    if (!selectedTable) return;
    
    setIsLoadingBilling(true);
    try {
      const response = await getTableBilling(selectedTable.code);
      if (response && response.success) {
        setBillingData(response.data);
      } else {
        Alert.alert('Fehler', 'Abrechnungsdaten konnten nicht geladen werden');
      }
    } catch (error: any) {
      console.error('Error loading billing data:', error);
      Alert.alert('Fehler', 'Abrechnungsdaten konnten nicht geladen werden');
    } finally {
      setIsLoadingBilling(false);
    }
  };

  // Tab-Wechsel Handler
  const handleTabChange = (tab: 'order' | 'billing') => {
    setActiveTab(tab);
    if (tab === 'billing') {
      loadBillingData();
    }
  };

  // Billing-Funktionen
  const handleToggleItemPaid = async (itemUuid: string) => {
    try {
      const response = await toggleItemPaid(itemUuid);
      if (response && response.success) {
        // Billing-Daten neu laden
        loadBillingData();
      } else {
        Alert.alert('Fehler', 'Status konnte nicht geändert werden');
      }
    } catch (error: any) {
      console.error('Error toggling payment:', error);
      Alert.alert('Fehler', 'Status konnte nicht geändert werden');
    }
  };

  const handleCancelItem = async (itemUuid: string) => {
    Alert.alert(
      'Item stornieren',
      'Sind Sie sicher, dass Sie dieses Item stornieren möchten?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Stornieren',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cancelItem(itemUuid);
              if (response && response.success) {
                loadBillingData();
              } else {
                Alert.alert('Fehler', 'Item konnte nicht storniert werden');
              }
            } catch (error: any) {
              console.error('Error cancelling item:', error);
              Alert.alert('Fehler', 'Item konnte nicht storniert werden');
            }
          }
        }
      ]
    );
  };

  const handlePaySession = async () => {
    if (!selectedTable) return;
    
    Alert.alert(
      'Session bezahlen',
      'Alle Items als bezahlt markieren?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Bezahlen',
          onPress: async () => {
            try {
              const response = await paySession(selectedTable.code);
              if (response && response.success) {
                loadBillingData();
                
                // Tischliste aktualisieren für korrekte Beträge
                await loadTables();
                
                Alert.alert('Erfolg', 'Session wurde bezahlt');
              } else {
                Alert.alert('Fehler', 'Session konnte nicht bezahlt werden');
              }
            } catch (error: any) {
              console.error('Error paying session:', error);
              Alert.alert('Fehler', 'Session konnte nicht bezahlt werden');
            }
          }
        }
      ]
    );
  };

  const handleEndSession = async () => {
    if (!selectedTable) return;
    
    Alert.alert(
      'Session beenden',
      'Session beenden und Tisch freigeben?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Beenden',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await endSession(selectedTable.code);
              if (response && response.success) {
                // Tischliste neu laden BEVOR wir zurückgehen
                await loadTables();
                
                Alert.alert('Erfolg', 'Session wurde beendet');
                handleBackToTables();
              } else {
                Alert.alert('Fehler', 'Session konnte nicht beendet werden');
              }
            } catch (error: any) {
              console.error('Error ending session:', error);
              Alert.alert('Fehler', 'Session konnte nicht beendet werden');
            }
          }
        }
      ]
    );
  };

  const handleBulkPayItems = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie Items aus');
      return;
    }
    
    Alert.alert(
      'Ausgewählte Items bezahlen',
      `${selectedItems.length} Items als bezahlt markieren?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Bezahlen',
          onPress: async () => {
            try {
              const response = await bulkPayItems(selectedItems);
              if (response && response.success) {
                setSelectedItems([]);
                loadBillingData();
                Alert.alert('Erfolg', 'Items wurden bezahlt');
              } else {
                Alert.alert('Fehler', 'Items konnten nicht bezahlt werden');
              }
            } catch (error: any) {
              console.error('Error bulk paying items:', error);
              Alert.alert('Fehler', 'Items konnten nicht bezahlt werden');
            }
          }
        }
      ]
    );
  };

  const processMenuCategories = (categories: MenuCategory[]): MenuCategory[] => {
    const processed: MenuCategory[] = [];
    
    categories.forEach(category => {
      if (!category.is_enabled) return;
      
      // Add main category if it has items
      if (category.items && category.items.length > 0) {
        processed.push({
          ...category,
          items: category.items.filter(item => item.is_enabled && !item.is_disabled)
        });
      }
      
      // Add subcategories as separate categories
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(subcat => {
          if (subcat.is_enabled && subcat.items && subcat.items.length > 0) {
            processed.push({
              ...subcat,
              items: subcat.items.filter(item => item.is_enabled && !item.is_disabled)
            });
          }
        });
      }
    });
    
    // Sort by order
    return processed.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // BESTEHENDE ORDER-FUNKTIONEN + NEUE EDIT-FUNKTIONEN
  
  // Neue Funktion: Edit-Modal für Cart-Items öffnen
  const openEditModal = (cartItem: CartItem) => {
  // Schließe den erweiterten Warenkorb wenn Edit-Modal geöffnet wird
  setIsCartExpanded(false);
  
  // Original MenuItem finden basierend auf der Cart-Item UUID
  const originalItemUuid = cartItem.uuid.split('-{')[0];
  const originalItem = findOriginalItemByUuid(originalItemUuid);
  
  if (!originalItem) {
    Alert.alert('Fehler', 'Original-Item konnte nicht gefunden werden');
    return;
  }
  
  // Check if item has quantity > 1, then show quantity split modal
  if (cartItem.quantity > 1) {
    setEditingCartItem(cartItem);
    setSplitQuantity(1);
    setShowQuantitySplitModal(true);
    return;
  }
  
  // For quantity = 1, directly open edit modal
  proceedWithEditModal(cartItem, cartItem.quantity);
};
  
  // Neue Hilfsfunktion: Modal mit bestimmter Quantity öffnen
  const proceedWithEditModal = (cartItem: CartItem, quantityToEdit: number) => {
    const originalItemUuid = cartItem.uuid.split('-{')[0];
    const originalItem = findOriginalItemByUuid(originalItemUuid);
    
    if (!originalItem) return;
    
    // Edit-Modus aktivieren
    setIsEditingCartItem(true);
    setEditingCartItem(cartItem);
    
    // Modal mit bestehenden Werten vorausfüllen, aber mit der zu editierenden Quantity
    setSelectedItem(originalItem);
    setModalQuantity(quantityToEdit);
    setSpecialNote(cartItem.specialNote || '');
    
    // Bestehende Konfigurationen setzen
    if (cartItem.configurations) {
      setSelectedConfigurations(cartItem.configurations);
    } else {
      setSelectedConfigurations({});
    }
    
    // Preis berechnen
    calculateModalPrice(originalItem, quantityToEdit, cartItem.configurations || {});
    
    // Modal öffnen
    setShowItemModal(true);
    setShowQuantitySplitModal(false);
  };
  
  // Bestehende addItemDirectly Funktion bleibt unverändert
  const addItemDirectly = (item: MenuItem) => {
    const basePrice = Number(item.price) || 0;
    let configPriceChange = 0;
    const defaultConfigurations: SelectedConfiguration = {};

    if (item.item_configurations) {
      item.item_configurations.forEach(config => {
        const options = config.configuration_options || [];
        
        if (config.type === 'single') {
          const preselected = options.find(opt => opt.preselected);
          const defaultOption = preselected || options[0];
          
          if (defaultOption) {
            defaultConfigurations[config.title] = defaultOption.title;
            configPriceChange += Number(defaultOption.price_change) || 0;
          }
        } else if (config.type === 'multiple') {
          const preselected = options
            .filter(opt => opt.preselected)
            .map(opt => {
              configPriceChange += Number(opt.price_change) || 0;
              return opt.title;
            });
          
          if (preselected.length > 0) {
            defaultConfigurations[config.title] = preselected;
          } else {
            defaultConfigurations[config.title] = [];
          }
        }
      });
    }

    const finalPrice = basePrice + configPriceChange;
    
    const existingItemIndex = cart.findIndex(cartItem => {
      const cartItemOriginalUuid = cartItem.uuid.split('-{')[0];
      
      return cartItemOriginalUuid === item.uuid &&
        JSON.stringify(cartItem.configurations || {}) === JSON.stringify(defaultConfigurations) &&
        !cartItem.specialNote;
    });
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * finalPrice;
      setCart(updatedCart);
    } else {
      const cartItemId = `${item.uuid}-${JSON.stringify(defaultConfigurations)}-${Date.now()}`;
      const newItem: CartItem = {
        uuid: cartItemId,
        title: item.title,
        price: finalPrice,
        quantity: 1,
        total: finalPrice,
        configurations: Object.keys(defaultConfigurations).length > 0 ? defaultConfigurations : undefined,
        configurationPriceChange: configPriceChange
      };
      setCart([...cart, newItem]);
    }
  };

  const openItemModal = (item: MenuItem) => {
    // Reset edit state - wir öffnen für neues Item
    setIsEditingCartItem(false);
    setEditingCartItem(null);
    
    setSelectedItem(item);
    setModalQuantity(1);
    setSpecialNote('');
    setSelectedConfigurations({});
    
    if (item.item_configurations) {
      const initialConfigs: SelectedConfiguration = {};
      item.item_configurations.forEach(config => {
        if (config.type === 'single') {
          const options = config.configuration_options || [];
          const preselected = options.find(opt => opt.preselected);
          const firstOption = options[0];
          if (preselected) {
            initialConfigs[config.title] = preselected.title;
          } else if (config.fixed_preselection && firstOption) {
            initialConfigs[config.title] = firstOption.title;
          }
        } else {
          const options = config.configuration_options || [];
          const preselected = options
            .filter(opt => opt.preselected)
            .map(opt => opt.title);
          if (preselected.length > 0) {
            initialConfigs[config.title] = preselected;
          } else {
            initialConfigs[config.title] = [];
          }
        }
      });
      setSelectedConfigurations(initialConfigs);
    }
    
    calculateModalPrice(item, 1, {});
    setShowItemModal(true);
  };

  const calculateModalPrice = (item: MenuItem, quantity: number, configs: SelectedConfiguration) => {
    let basePrice = Number(item.price) || 0;
    let configPrice = 0;

    if (item.item_configurations) {
      item.item_configurations.forEach(config => {
        const selectedValue = configs[config.title];
        const options = config.configuration_options || [];
        
        if (config.type === 'single' && typeof selectedValue === 'string') {
          const option = options.find(opt => opt.title === selectedValue);
          if (option) configPrice += Number(option.price_change) || 0;
        } else if (config.type === 'multiple' && Array.isArray(selectedValue)) {
          selectedValue.forEach(value => {
            const option = options.find(opt => opt.title === value);
            if (option) configPrice += Number(option.price_change) || 0;
          });
        }
      });
    }

    const totalPrice = (basePrice + configPrice) * quantity;
    setModalTotalPrice(totalPrice);
  };

  const handleConfigurationChange = (configTitle: string, optionTitle: string, configType: 'single' | 'multiple') => {
    const newConfigs = { ...selectedConfigurations };
    
    if (configType === 'single') {
      newConfigs[configTitle] = optionTitle;
    } else {
      const currentArray = (newConfigs[configTitle] as string[]) || [];
      if (currentArray.includes(optionTitle)) {
        newConfigs[configTitle] = currentArray.filter(item => item !== optionTitle);
      } else {
        newConfigs[configTitle] = [...currentArray, optionTitle];
      }
    }
    
    setSelectedConfigurations(newConfigs);
    if (selectedItem) {
      calculateModalPrice(selectedItem, modalQuantity, newConfigs);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, modalQuantity + delta);
    setModalQuantity(newQuantity);
    if (selectedItem) {
      calculateModalPrice(selectedItem, newQuantity, selectedConfigurations);
    }
  };

  const addItemToCart = () => {
    if (!selectedItem) return;

    const basePrice = Number(selectedItem.price) || 0;
    let configPriceChange = 0;

    if (selectedItem.item_configurations) {
      selectedItem.item_configurations.forEach(config => {
        const selectedValue = selectedConfigurations[config.title];
        const options = config.configuration_options || [];
        
        if (config.type === 'single' && typeof selectedValue === 'string') {
          const option = options.find(opt => opt.title === selectedValue);
          if (option) configPriceChange += Number(option.price_change) || 0;
        } else if (config.type === 'multiple' && Array.isArray(selectedValue)) {
          selectedValue.forEach(value => {
            const option = options.find(opt => opt.title === value);
            if (option) configPriceChange += Number(option.price_change) || 0;
          });
        }
      });
    }

    const finalPrice = basePrice + configPriceChange;
    
    // Check if we're editing an existing cart item
    if (isEditingCartItem && editingCartItem) {
      const editQuantity = modalQuantity;
      const remainingQuantity = editingCartItem.quantity - editQuantity;
      
      // Create new item with edited properties
      const newCartItemId = `${selectedItem.uuid}-${JSON.stringify(selectedConfigurations)}-${specialNote}-${Date.now()}`;
      const newItem: CartItem = {
        uuid: newCartItemId,
        title: selectedItem.title,
        price: finalPrice,
        quantity: editQuantity,
        total: finalPrice * editQuantity,
        specialNote: specialNote || undefined,
        configurations: Object.keys(selectedConfigurations).length > 0 ? selectedConfigurations : undefined,
        configurationPriceChange: configPriceChange
      };
      
      // Update cart
      let updatedCart = [...cart];
      
      if (remainingQuantity > 0) {
        // Update original item with reduced quantity
        updatedCart = updatedCart.map(cartItem => {
          if (cartItem.uuid === editingCartItem.uuid) {
            return {
              ...cartItem,
              quantity: remainingQuantity,
              total: cartItem.price * remainingQuantity
            };
          }
          return cartItem;
        });
        
        // Add new item with changes
        updatedCart.push(newItem);
      } else {
        // Replace original item completely (when all quantity is edited)
        updatedCart = updatedCart.map(cartItem => {
          if (cartItem.uuid === editingCartItem.uuid) {
            return newItem;
          }
          return cartItem;
        });
      }
      
      setCart(updatedCart);
      
      // Reset edit state
      setIsEditingCartItem(false);
      setEditingCartItem(null);
    } else {
      // Add new item to cart (original logic)
      const cartItemId = `${selectedItem.uuid}-${JSON.stringify(selectedConfigurations)}-${specialNote}`;
      
      const existingItemIndex = cart.findIndex(cartItem => 
        cartItem.uuid === selectedItem.uuid &&
        JSON.stringify(cartItem.configurations) === JSON.stringify(selectedConfigurations) &&
        cartItem.specialNote === specialNote
      );
      
      if (existingItemIndex >= 0) {
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += modalQuantity;
        updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * finalPrice;
        setCart(updatedCart);
      } else {
        const newItem: CartItem = {
          uuid: cartItemId,
          title: selectedItem.title,
          price: finalPrice,
          quantity: modalQuantity,
          total: finalPrice * modalQuantity,
          specialNote: specialNote || undefined,
          configurations: Object.keys(selectedConfigurations).length > 0 ? selectedConfigurations : undefined,
          configurationPriceChange: configPriceChange
        };
        setCart([...cart, newItem]);
      }
    }

    setShowItemModal(false);
  };

  const removeFromCart = (cartItemId: string) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.uuid === cartItemId);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      if (updatedCart[existingItemIndex].quantity > 1) {
        updatedCart[existingItemIndex].quantity -= 1;
        updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price;
        setCart(updatedCart);
      } else {
        updatedCart.splice(existingItemIndex, 1);
        setCart(updatedCart);
      }
    }
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const getCartItemCount = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const submitOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      Alert.alert('Fehler', 'Warenkorb ist leer');
      return;
    }

    try {
      const orderCart = cart.map(cartItem => {
        const originalItemUuid = cartItem.uuid.split('-{')[0];
        const originalItem = findOriginalItemByUuid(originalItemUuid);
        const basePrice = originalItem ? Number(originalItem.price) || 0 : 0;
        let configPriceChange = 0;
        
        const configurations: any = {};
        
        if (cartItem.configurations && originalItem?.item_configurations) {
          const singles: any = {};
          const multiples: any = {};
          
          Object.entries(cartItem.configurations).forEach(([configTitle, selectedValue]) => {
            const originalConfig = originalItem.item_configurations!.find(config => config.title === configTitle);
            
            if (originalConfig) {
              const options = originalConfig.configuration_options || [];
              
              if (originalConfig.type === 'single' && typeof selectedValue === 'string') {
                const option = options.find(opt => opt.title === selectedValue);
                const priceChange = Number(option?.price_change) || 0;
                singles[configTitle] = {
                  value: selectedValue,
                  price_change: priceChange.toFixed(2)
                };
                configPriceChange += priceChange;
              } else if (originalConfig.type === 'multiple' && Array.isArray(selectedValue) && selectedValue.length > 0) {
                multiples[configTitle] = selectedValue.map(value => {
                  const option = options.find(opt => opt.title === value);
                  const priceChange = Number(option?.price_change) || 0;
                  configPriceChange += priceChange;
                  return {
                    title: value,
                    price_change: priceChange.toFixed(2)
                  };
                });
              }
            }
          });
          
          if (Object.keys(singles).length > 0) {
            configurations.singles = singles;
          }
          if (Object.keys(multiples).length > 0) {
            configurations.multiples = multiples;
          }
        }
        
        return {
          item_id: originalItemUuid,
          qty: cartItem.quantity,
          price: cartItem.price,
       comments: cartItem.specialNote ? [cartItem.specialNote] : [],
          item_configurations: Object.keys(configurations).length > 0 ? configurations : undefined,
          configuration_total: configPriceChange,
          base_price: basePrice
        };
      });

      await placeWaiterOrder(selectedTable.code, orderCart, '');
      
      setCart([]);
      
      Alert.alert(
        'Bestellung erfolgreich',
        `Bestellung für ${selectedTable.name} wurde aufgegeben`,
        [
          {
            text: 'Neue Bestellung',
            onPress: () => {
              setCart([]);
            }
          },
          {
            text: 'Zur Rechnung',
            onPress: () => {
              setActiveTab('billing');
              loadBillingData();
            }
          },
          {
            text: 'Zurück zu Tischen',
            onPress: () => {
              setShowOrderInterface(false);
              setSelectedTable(null);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Order failed:', error);
      Alert.alert('Fehler', 'Bestellung konnte nicht aufgegeben werden');
    }
  };

  const findOriginalItemByUuid = (uuid: string): MenuItem | undefined => {
    for (const category of processedCategories) {
      const item = category.items.find(item => item.uuid === uuid);
      if (item) return item;
    }
    return undefined;
  };

  const handleBackToTables = () => {
    setShowOrderInterface(false);
    setSelectedTable(null);
    setCart([]);
    setSelectedCategory(null);
    setBillingData(null);
    setSelectedItems([]);
    setActiveTab('order');
    setIsCartExpanded(false); // Warenkorb schließen beim Zurückgehen
    
    // Tischliste neu laden wenn man zurück zu den Tischen geht
    loadTables();
  };

  // Neue Komponente: Billing Interface - Vereinfacht ohne Kunden-Trennung
  const renderBillingInterface = () => {
    if (isLoadingBilling) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Lade Abrechnungsdaten...</Text>
        </View>
      );
    }

    if (!billingData) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={80} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>Keine Abrechnungsdaten</Text>
        </View>
      );
    }

    // Alle Items aus allen Kunden in eine Liste zusammenfassen
    const allItems = billingData.customers.flatMap(customer => customer.items);

    return (
      <View style={styles.billingContainer}>
        {/* Payment Overview */}
        <View style={styles.paymentOverview}>
          <View style={styles.paymentCard}>
            <View style={styles.paymentCardContent}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <View>
                <Text style={styles.paymentLabel}>Bezahlt</Text>
                <Text style={styles.paymentAmount}>€{billingData.totals.paid_amount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.paymentCard}>
            <View style={styles.paymentCardContent}>
              <Ionicons name="time-outline" size={24} color="#f59e0b" />
              <View>
                <Text style={styles.paymentLabel}>Ausstehend</Text>
                <Text style={styles.paymentAmount}>€{billingData.totals.pending_amount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Simplified Items List - No Customer Separation */}
        <ScrollView style={styles.billingItemsList}>
          <View style={styles.allItemsSection}>
            <View style={styles.allItemsHeader}>
              <Ionicons name="receipt" size={20} color="#007AFF" />
              <Text style={styles.allItemsTitle}>Alle Bestellungen</Text>
            </View>
            
            {allItems.map((item, itemIndex) => (
              <View key={item.uuid} style={styles.billingItem}>
                <View style={styles.billingItemCheckbox}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      selectedItems.includes(item.uuid) && styles.checkboxSelected
                    ]}
                    onPress={() => {
                      if (selectedItems.includes(item.uuid)) {
                        setSelectedItems(selectedItems.filter(id => id !== item.uuid));
                      } else {
                        setSelectedItems([...selectedItems, item.uuid]);
                      }
                    }}
                  >
                    {selectedItems.includes(item.uuid) && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>
                
                <View style={styles.billingItemInfo}>
                  <Text style={[
                    styles.billingItemTitle,
                    item.is_paid && styles.paidItemTitle
                  ]}>
                    {item.title}
                  </Text>
                  
                  <View style={styles.billingItemDetails}>
                    <Text style={styles.billingItemCategory}>{item.category}</Text>
                    {item.is_added_by_staff && (
                      <View style={styles.staffBadge}>
                        <Text style={styles.staffBadgeText}>Staff</Text>
                      </View>
                    )}
                    {item.is_paid && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>Bezahlt</Text>
                      </View>
                    )}
                  </View>

                  {/* Show configurations if any */}
                  {item.configurations && (
                    <View style={styles.itemConfigurations}>
                      {item.configurations.singles && Object.entries(item.configurations.singles).map(([key, config]: [string, any]) => (
                        <Text key={key} style={styles.configurationText}>
                          {key}: {config.value}
                        </Text>
                      ))}
                      {item.configurations.multiples && Object.entries(item.configurations.multiples).map(([key, configs]: [string, any]) => (
                        <View key={key}>
                          <Text style={styles.configurationText}>{key}: {configs.map((c: any) => c.title).join(', ')}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={styles.billingItemPrice}>
                  <Text style={[
                    styles.itemPriceText,
                    item.is_paid && styles.paidItemPrice
                  ]}>
                    €{item.price.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.billingItemActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      item.is_paid ? styles.unpayButton : styles.payButton
                    ]}
                    onPress={() => handleToggleItemPaid(item.uuid)}
                  >
                    <Ionicons 
                      name={item.is_paid ? "arrow-undo" : "card"} 
                      size={16} 
                      color="#ffffff" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancelItem(item.uuid)}
                  >
                    <Ionicons name="close" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.billingActions}>
          <View style={styles.billingActionsRow}>
            <TouchableOpacity 
              style={[styles.billingActionButton, styles.bulkPayButton]}
              onPress={handleBulkPayItems}
              disabled={selectedItems.length === 0}
            >
              <Ionicons name="card-outline" size={20} color="#ffffff" />
              <Text style={styles.billingActionText}>
                Ausgewählte bezahlen ({selectedItems.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.billingActionsRow}>
            <TouchableOpacity 
              style={[styles.billingActionButton, styles.payAllButton]}
              onPress={handlePaySession}
            >
              <Ionicons name="card" size={20} color="#ffffff" />
              <Text style={styles.billingActionText}>Alle bezahlen</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.billingActionButton, styles.endSessionButton]}
              onPress={handleEndSession}
            >
              <Ionicons name="power" size={20} color="#ffffff" />
              <Text style={styles.billingActionText}>Session beenden</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Order Interface mit Tab-Navigation
  if (showOrderInterface && selectedTable) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Top Bar mit Tab-Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToTables}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.tableInfo}>
            <Text style={styles.tableName}>{selectedTable.name}</Text>
          </View>
          
          <View style={styles.cartSummary}>
            {activeTab === 'order' ? (
              <>
                <Text style={styles.cartTotal}>{getCartTotal().toFixed(2)} €</Text>
                <Text style={styles.cartItemCount}>({getCartItemCount()} Items)</Text>
              </>
            ) : (
              <>
                <Text style={styles.cartTotal}>
                  €{billingData?.totals.total_amount.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.cartItemCount}>Gesamt</Text>
              </>
            )}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'order' && styles.tabButtonActive
            ]}
            onPress={() => handleTabChange('order')}
          >
            <Ionicons 
              name={activeTab === 'order' ? "restaurant" : "restaurant-outline"} 
              size={20} 
              color={activeTab === 'order' ? "#ffffff" : "#6b7280"} 
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'order' && styles.tabButtonTextActive
            ]}>
              Bestellen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'billing' && styles.tabButtonActive
            ]}
            onPress={() => handleTabChange('billing')}
          >
            <Ionicons 
              name={activeTab === 'billing' ? "receipt" : "receipt-outline"} 
              size={20} 
              color={activeTab === 'billing' ? "#ffffff" : "#6b7280"} 
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'billing' && styles.tabButtonTextActive
            ]}>
              Rechnung
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'order' ? (
          // BESTELLEN TAB - Bestehende Order-Logic
          isLoadingMenu ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Lade Menü...</Text>
            </View>
          ) : (
            <>
              {/* Category Buttons */}
              <View style={styles.categoryContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {processedCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        selectedCategory?.id === category.id && styles.categoryButtonActive
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        selectedCategory?.id === category.id && styles.categoryButtonTextActive
                      ]}>
                        {category.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Items List - 100% des verfügbaren Platzes */}
              <View style={styles.itemsContainer}>
                {selectedCategory && (
                  <FlatList
                    data={selectedCategory.items}
                    keyExtractor={(item) => item.uuid}
                    renderItem={({ item }) => {
                      const cartQuantity = cart
                        .filter(cartItem => cartItem.uuid.startsWith(item.uuid))
                        .reduce((sum, cartItem) => sum + cartItem.quantity, 0);
                      const isUnavailable = item.sold_out || item.is_disabled;
                      
                      return (
                        <View style={[
                          styles.itemRow,
                          isUnavailable && styles.itemRowDisabled,
                          cartQuantity > 0 && styles.itemRowSelected
                        ]}>
                          <TouchableOpacity
                            style={styles.itemRowMainArea}
                            onPress={() => !isUnavailable && addItemDirectly(item)}
                            disabled={isUnavailable}
                          >
                            <View style={styles.itemRowContent}>
                              <View style={styles.itemRowInfo}>
                                <Text style={[
                                  styles.itemRowTitle,
                                  isUnavailable && styles.itemRowTitleDisabled
                                ]} numberOfLines={2}>
                                  {item.title}
                                </Text>
                                
                                {item.description && (
                                  <Text style={[
                                    styles.itemRowDescription,
                                    isUnavailable && styles.itemRowDescriptionDisabled
                                  ]} numberOfLines={1}>
                                    {item.description}
                                  </Text>
                                )}
                              </View>
                              
                              <View style={styles.itemRowPrice}>
                                <Text style={[
                                  styles.itemRowPriceText,
                                  isUnavailable && styles.itemRowPriceDisabled
                                ]}>
                                  {Number(item.price || 0).toFixed(2)} €
                                </Text>
                                
                                {cartQuantity > 0 && (
                                  <View style={styles.itemRowQuantityBadge}>
                                    <Text style={styles.itemRowQuantityText}>{cartQuantity}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.itemRowConfigButton,
                              isUnavailable && styles.itemRowConfigButtonDisabled
                            ]}
                            onPress={() => !isUnavailable && openItemModal(item)}
                            disabled={isUnavailable}
                          >
                            <Ionicons name="create-outline" size={20} color="#ffffff" />
                          </TouchableOpacity>
                          
                          {isUnavailable && (
                            <View style={styles.itemRowUnavailableBadge}>
                              <Text style={styles.itemRowUnavailableText}>
                                {item.sold_out ? 'Ausverkauft' : 'Nicht verfügbar'}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    }}
                  />
                )}
              </View>

              {/* Warenkorb - Kompakter Header immer sichtbar */}
              <View style={styles.cartSectionCompact}>
                <View style={styles.cartHeader}>
                  <Text style={styles.cartHeaderTitle}>Warenkorb</Text>
                  <View style={styles.cartHeaderActions}>
                    <View style={styles.cartHeaderSummary}>
                      <Text style={styles.cartHeaderTotal}>{getCartTotal().toFixed(2)} €</Text>
                      <Text style={styles.cartHeaderCount}>({getCartItemCount()} Items)</Text>
                    </View>
                    
                    {/* Bestellen Button - direkt im Header */}
                    <TouchableOpacity
                      style={[
                        styles.cartQuickOrderButton,
                        cart.length === 0 && styles.disabledButton
                      ]}
                      onPress={submitOrder}
                      disabled={cart.length === 0}
                    >
                      <Ionicons name="restaurant" size={16} color={cart.length === 0 ? "#9ca3af" : "#ffffff"} />
                    </TouchableOpacity>
                    
                    {/* Expand Button */}
                    <TouchableOpacity
                      style={styles.cartExpandButton}
                      onPress={() => setIsCartExpanded(true)}
                    >
                      <Ionicons name="chevron-up" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    
                    {/* Close Button */}
                    <TouchableOpacity
                      style={styles.cartCloseButton}
                      onPress={() => {
                        if (cart.length > 0) {
                          Alert.alert(
                            'Warenkorb leeren',
                            'Sind Sie sicher, dass Sie den Warenkorb leeren möchten?',
                            [
                              { text: 'Abbrechen', style: 'cancel' },
                              { 
                                text: 'Leeren', 
                                style: 'destructive',
                                onPress: () => setCart([])
                              }
                            ]
                          );
                        }
                      }}
                    >
                      <Ionicons name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>


            </>
          )
        ) : (
          // RECHNUNG TAB - Neue Billing-Logic
          renderBillingInterface()
        )}

        {/* Cart Modal - Vollständiger Warenkorb Modal */}
        <Modal
          visible={isCartExpanded}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCartExpanded(false)}
        >
          <View style={styles.expandedCartOverlay}>
            <View style={styles.expandedCartContent}>
              {/* Header */}
              <View style={styles.expandedCartHeader}>
                <Text style={styles.expandedCartTitle}>Warenkorb</Text>
                <TouchableOpacity
                  style={styles.expandedCartCloseButton}
                  onPress={() => setIsCartExpanded(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Cart Items */}
              <View style={styles.expandedCartItems}>
                {cart.length > 0 ? (
                  <FlatList
                    data={cart}
                    keyExtractor={(item) => item.uuid}
                    showsVerticalScrollIndicator={true}
                    renderItem={({ item }) => (
                      <View style={styles.expandedCartItem}>
                        <View style={styles.expandedCartItemMain}>
                          <View style={styles.expandedCartItemInfo}>
                            <Text style={styles.expandedCartItemTitle}>
                              {item.title}
                            </Text>
                            
                            {/* Detaillierte Konfigurationen */}
                            {item.configurations && (
                              <View style={styles.expandedCartItemConfigs}>
                                {Object.entries(item.configurations).map(([configTitle, value]) => (
                                  <Text key={configTitle} style={styles.expandedCartItemConfigText}>
                                    <Text style={styles.expandedCartConfigLabel}>{configTitle}:</Text> {Array.isArray(value) ? value.join(', ') : value}
                                  </Text>
                                ))}
                              </View>
                            )}
                            
                            {/* Detaillierte Notiz */}
                            {item.specialNote && (
                              <Text style={styles.expandedCartItemNote}>
                                <Text style={styles.expandedCartNoteLabel}>Notiz:</Text> {item.specialNote}
                              </Text>
                            )}

                            {/* Preis-Details */}
                            <View style={styles.expandedCartItemPriceDetails}>
                              <Text style={styles.expandedCartItemUnitPrice}>
                                Stückpreis: {item.price.toFixed(2)} €
                              </Text>
                              <Text style={styles.expandedCartItemTotalPrice}>
                                Gesamt: {item.total.toFixed(2)} €
                              </Text>
                            </View>
                          </View>

                          <View style={styles.expandedCartItemControls}>
                            <View style={styles.expandedCartItemQuantityControls}>
                              <TouchableOpacity
                                style={styles.expandedCartQuantityButton}
                                onPress={() => removeFromCart(item.uuid)}
                              >
                                <Ionicons name="remove" size={18} color="#374151" />
                              </TouchableOpacity>
                              
                              <Text style={styles.expandedCartQuantityDisplay}>{item.quantity}</Text>
                              
                              <TouchableOpacity
                                style={styles.expandedCartQuantityButton}
                                onPress={() => {
                                  const updatedCart = [...cart];
                                  const itemIndex = updatedCart.findIndex(cartItem => cartItem.uuid === item.uuid);
                                  if (itemIndex >= 0) {
                                    updatedCart[itemIndex].quantity += 1;
                                    updatedCart[itemIndex].total = updatedCart[itemIndex].quantity * updatedCart[itemIndex].price;
                                    setCart(updatedCart);
                                  }
                                }}
                              >
                                <Ionicons name="add" size={18} color="#374151" />
                              </TouchableOpacity>
                            </View>
                            
                            {/* Edit und Remove Buttons */}
                            <View style={styles.expandedCartItemActions}>
                              <TouchableOpacity
                                style={styles.expandedCartItemEdit}
                                onPress={() => openEditModal(item)}
                              >
                                <Ionicons name="create-outline" size={20} color="#007AFF" />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.expandedCartItemRemove}
                                onPress={() => {
                                  const updatedCart = cart.filter(cartItem => cartItem.uuid !== item.uuid);
                                  setCart(updatedCart);
                                }}
                              >
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.expandedCartEmpty}>
                    <Ionicons name="basket-outline" size={64} color="#9ca3af" />
                    <Text style={styles.expandedCartEmptyText}>Warenkorb ist leer</Text>
                    <Text style={styles.expandedCartEmptySubtext}>Wählen Sie Items aus dem Menü</Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.expandedCartFooter}>
                <View style={styles.expandedCartSummary}>
                  <View style={styles.expandedCartSummaryRow}>
                    <Text style={styles.expandedCartSummaryLabel}>Items:</Text>
                    <Text style={styles.expandedCartSummaryValue}>{getCartItemCount()}</Text>
                  </View>
                  <View style={styles.expandedCartSummaryRow}>
                    <Text style={styles.expandedCartSummaryTotal}>Gesamtsumme:</Text>
                    <Text style={styles.expandedCartSummaryTotalValue}>{getCartTotal().toFixed(2)} €</Text>
                  </View>
                </View>

                <View style={styles.expandedCartActions}>
                  <TouchableOpacity 
                    style={[styles.expandedCartClearButton, cart.length === 0 && styles.disabledButton]}
                    onPress={() => setCart([])}
                    disabled={cart.length === 0}
                  >
                    <Ionicons name="trash-outline" size={18} color={cart.length === 0 ? "#9ca3af" : "#ffffff"} />
                    <Text style={[
                      styles.expandedCartClearText,
                      cart.length === 0 && styles.disabledButtonText
                    ]}>Leeren</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.expandedCartOrderButton,
                      cart.length === 0 && styles.disabledButton
                    ]}
                    onPress={() => {
                      setIsCartExpanded(false);
                      submitOrder();
                    }}
                    disabled={cart.length === 0}
                  >
                    <Ionicons name="restaurant" size={18} color={cart.length === 0 ? "#9ca3af" : "#ffffff"} />
                    <Text style={[
                      styles.expandedCartOrderText,
                      cart.length === 0 && styles.disabledButtonText
                    ]}>
                      Bestellen - {getCartTotal().toFixed(2)} €
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Item Configuration Modal - Unverändert */}
        <Modal
          visible={showItemModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowItemModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView}>
                {selectedItem && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderLeft}>
                        <Text style={styles.modalHeaderTitle}>
                          {isEditingCartItem ? "Item bearbeiten" : "Item hinzufügen"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => {
                          setShowItemModal(false);
                          // Reset edit state when closing modal
                          if (isEditingCartItem) {
                            setIsEditingCartItem(false);
                            setEditingCartItem(null);
                          }
                        }}
                      >
                        <Ionicons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemTitle}>{selectedItem.title}</Text>
                      <Text style={styles.modalItemPrice}>
                        {modalTotalPrice.toFixed(2)} €
                      </Text>
                      {selectedItem.description && (
                        <Text style={styles.modalItemDescription}>{selectedItem.description}</Text>
                      )}
                      
                      {/* Edit-Modus Indikator */}
                      {isEditingCartItem && (
                        <View style={styles.editModeIndicator}>
                          <Ionicons name="create-outline" size={16} color="#007AFF" />
                          <Text style={styles.editModeText}>Bearbeiten</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Spezielle Notizen</Text>
                      <TextInput
                        style={styles.modalTextInput}
                        multiline={true}
                        numberOfLines={3}
                        placeholder="Notizen hier eingeben..."
                        value={specialNote}
                        onChangeText={setSpecialNote}
                      />
                    </View>

                    {selectedItem.item_configurations && selectedItem.item_configurations.length > 0 && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Extras</Text>
                        
                        {selectedItem.item_configurations.map((config) => (
                          <View key={config.id} style={styles.configurationGroup}>
                            <Text style={styles.configurationTitle}>{config.title}</Text>
                            
                            <View style={styles.configurationOptions}>
                              {config.configuration_options.map((option) => {
                                const isSelected = config.type === 'single' 
                                  ? selectedConfigurations[config.title] === option.title
                                  : (selectedConfigurations[config.title] as string[] || []).includes(option.title);
                                
                                return (
                                  <TouchableOpacity
                                    key={option.id}
                                    style={[
                                      styles.configurationOption,
                                      isSelected && styles.configurationOptionSelected,
                                      (option.fixed_preselection || config.fixed_preselection) && styles.configurationOptionDisabled
                                    ]}
                                    onPress={() => {
                                      if (!option.fixed_preselection && !config.fixed_preselection) {
                                        handleConfigurationChange(config.title, option.title, config.type);
                                      }
                                    }}
                                    disabled={option.fixed_preselection || config.fixed_preselection}
                                  >
                                    <View style={styles.configurationOptionContent}>
                                      <View style={styles.configurationOptionLeft}>
                                        <View style={[
                                          config.type === 'single' ? styles.radioButton : styles.checkboxButton,
                                          isSelected && (config.type === 'single' ? styles.radioButtonSelected : styles.checkboxButtonSelected)
                                        ]}>
                                          {isSelected && (
                                            <View style={config.type === 'single' ? styles.radioButtonInner : styles.checkboxButtonInner} />
                                          )}
                                        </View>
                                        <Text style={styles.configurationOptionTitle}>{option.title}</Text>
                                      </View>
                                      <Text style={styles.configurationOptionPrice}>
                                        + {(Number(option.price_change) || 0).toFixed(2)}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        ))}
                        
                        <Text style={styles.configurationNote}>
                          Zusätzliche Kosten können anfallen.
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <View style={styles.modalQuantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(-1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityDisplay}>{modalQuantity}</Text>
                  
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={addItemToCart}
                >
                  <Text style={styles.addToCartButtonText}>
                    {isEditingCartItem 
                      ? `Aktualisieren - ${modalTotalPrice.toFixed(2)} €`
                      : `Hinzufügen - ${modalTotalPrice.toFixed(2)} €`
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Quantity Split Modal */}
        <Modal
          visible={showQuantitySplitModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowQuantitySplitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.quantitySplitModalContent}>
              <View style={styles.quantitySplitHeader}>
                <Text style={styles.quantitySplitTitle}>Menge zum Bearbeiten auswählen</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowQuantitySplitModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              {editingCartItem && (
                <View style={styles.quantitySplitContent}>
                  <Text style={styles.quantitySplitItemTitle}>{editingCartItem.title}</Text>
                  <Text style={styles.quantitySplitDescription}>
                    Dieses Item hat Menge {editingCartItem.quantity}. Wie viele sollen bearbeitet werden?
                  </Text>
                  
                  <View style={styles.quantitySplitControls}>
                    <Text style={styles.quantitySplitLabel}>Menge bearbeiten:</Text>
                    
                    <View style={styles.quantitySplitQuantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setSplitQuantity(Math.max(1, splitQuantity - 1))}
                        disabled={splitQuantity <= 1}
                      >
                        <Text style={[
                          styles.quantityButtonText,
                          splitQuantity <= 1 && styles.disabledButtonText
                        ]}>-</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.quantityDisplay}>{splitQuantity}</Text>
                      
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setSplitQuantity(Math.min(editingCartItem.quantity, splitQuantity + 1))}
                        disabled={splitQuantity >= editingCartItem.quantity}
                      >
                        <Text style={[
                          styles.quantityButtonText,
                          splitQuantity >= editingCartItem.quantity && styles.disabledButtonText
                        ]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.quantitySplitInfo}>
                    <Text style={styles.quantitySplitInfoText}>
                      • {splitQuantity} {splitQuantity === 1 ? 'Item wird' : 'Items werden'} bearbeitet
                    </Text>
                    <Text style={styles.quantitySplitInfoText}>
                      • {editingCartItem.quantity - splitQuantity} {editingCartItem.quantity - splitQuantity === 1 ? 'Item bleibt' : 'Items bleiben'} unverändert
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.quantitySplitActions}>
                <TouchableOpacity
                  style={styles.quantitySplitCancelButton}
                  onPress={() => setShowQuantitySplitModal(false)}
                >
                  <Text style={styles.quantitySplitCancelText}>Abbrechen</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.quantitySplitConfirmButton}
                  onPress={() => {
                    if (editingCartItem) {
                      proceedWithEditModal(editingCartItem, splitQuantity);
                    }
                  }}
                >
                  <Text style={styles.quantitySplitConfirmText}>Bearbeiten</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Table Selection (Original - Unverändert)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kellner</Text>
          <Text style={styles.headerSubtitle}>
            {tables.length} {tables.length === 1 ? 'Tisch verfügbar' : 'Tische verfügbar'}
          </Text>
        </View>
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
                    style={styles.tableCard}
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
  
  // BESTEHENDE STYLES (Table Selection, Modal etc.) - Unverändert
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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

  // ERWEITERTE TOP BAR MIT TAB NAVIGATION
  topBar: {
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  tableInfo: {
    flex: 1,
    alignItems: 'center',
  },
  tableName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartSummary: {
    alignItems: 'flex-end',
  },
  cartTotal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartItemCount: {
    color: '#9ca3af',
    fontSize: 12,
  },

  // TAB NAVIGATION STYLES - Kompakter
  tabNavigation: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
    backgroundColor: '#f9fafb',
  },
  tabButtonActive: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },

  // BESTEHENDE ORDER STYLES (unverändert)
  categoryContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  itemsContainer: {
    flex: 1, // Nimmt jetzt den kompletten verfügbaren Platz ein
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  itemRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
    position: 'relative',
  },
  itemRowSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
  },
  itemRowDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  itemRowMainArea: {
    flex: 1,
    paddingRight: 60,
  },
  itemRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  itemRowInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  itemRowTitleDisabled: {
    color: '#9ca3af',
  },
  itemRowDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  itemRowDescriptionDisabled: {
    color: '#9ca3af',
  },
  itemRowPrice: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemRowPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  itemRowPriceDisabled: {
    color: '#9ca3af',
  },
  itemRowQuantityBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  itemRowQuantityText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemRowConfigButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  itemRowConfigButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  itemRowUnavailableBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 60,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  itemRowUnavailableText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },

  // CART STYLES - ANGEPASST für neues Verhalten
  cartSectionExpanded: {
    flex: 0.58, // Wenn erweitert, nimmt 58% des Platzes
    backgroundColor: '#f1f5f9',
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
  },
// Fehlende Cart Styles - diese zu den anderen Styles hinzufügen:

cartSectionCompact: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#f1f5f9',
  borderTopWidth: 2,
  borderTopColor: '#d1d5db',
  zIndex: 10,
},

cartExpandButton: {
  backgroundColor: '#f3f4f6',
  borderRadius: 20,
  width: 36,
  height: 36,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

cartQuickOrderButton: {
  backgroundColor: '#10b981',
  borderRadius: 18,
  width: 36,
  height: 36,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 8,
},
  
  cartHeader: {
    backgroundColor: '#dbdbdbff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cartHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cartHeaderSummary: {
    alignItems: 'flex-end',
  },
  cartHeaderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cartHeaderCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  cartCloseButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 8,
  },

  // FLOATING CART BUTTON STYLES
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartInfo: {
    alignItems: 'flex-end',
  },
  floatingCartTotal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingCartCount: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
  },

  // KOMPAKTE CART STYLES MIT EDIT-BUTTONS
  cartItemCompact: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 50,
  },
  cartItemCompactMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
  },
  cartItemCompactInfo: {
    flex: 1,
    marginRight: 8,
  },
  cartItemCompactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  cartItemCompactConfigs: {
    marginTop: 1,
  },
  cartItemCompactConfigText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontStyle: 'italic',
  },
  cartItemCompactNote: {
    fontSize: 11,
    color: '#f59e0b',
    fontStyle: 'italic',
    marginTop: 1,
  },
  cartItemCompactControls: {
    alignItems: 'flex-end',
  },
  cartItemCompactPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  cartItemCompactQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 2,
  },
  cartQuantityButtonCompact: {
    backgroundColor: '#ffffff',
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cartQuantityDisplayCompact: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  
  // EDIT-BUTTON STYLES FÜR COMPACT CART
  cartItemCompactActions: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  cartItemCompactEdit: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cartItemCompactRemove: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  emptyCartCompact: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyCartTextCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  cartFooterCompact: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  clearCartButtonCompact: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  orderButtonCompact: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  orderButtonTextCompact: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // BILLING STYLES
  billingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  paymentOverview: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  paymentCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  billingItemsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  allItemsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  allItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  allItemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  billingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  billingItemCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  billingItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  billingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  paidItemTitle: {
    color: '#10b981',
  },
  billingItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  billingItemCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  staffBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  staffBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  paidBadge: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  paidBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  itemConfigurations: {
    marginTop: 4,
  },
  configurationText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontStyle: 'italic',
  },
  billingItemPrice: {
    marginRight: 12,
  },
  itemPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paidItemPrice: {
    color: '#10b981',
  },
  billingItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButton: {
    backgroundColor: '#10b981',
  },
  unpayButton: {
    backgroundColor: '#f59e0b',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  billingActions: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  billingActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  billingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  bulkPayButton: {
    backgroundColor: '#8b5cf6',
  },
  payAllButton: {
    backgroundColor: '#10b981',
  },
  endSessionButton: {
    backgroundColor: '#ef4444',
  },
  billingActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // MODAL STYLES (unverändert)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalItemInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalItemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  modalItemDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  editModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  editModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  configurationGroup: {
    marginBottom: 20,
  },
  configurationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  configurationOptions: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 4,
  },
  configurationOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  configurationOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  configurationOptionDisabled: {
    opacity: 0.5,
  },
  configurationOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configurationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  configurationOptionTitle: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  configurationOptionPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  checkboxButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  checkboxButtonInner: {
    width: 10,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  configurationNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  modalFooter: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    backgroundColor: '#ffffff',
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  quantityDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // QUANTITY SPLIT MODAL STYLES
  quantitySplitModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 60,
    maxHeight: '80%',
  },
  quantitySplitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quantitySplitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  quantitySplitContent: {
    padding: 20,
  },
  quantitySplitItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  quantitySplitDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  quantitySplitControls: {
    marginBottom: 24,
  },
  quantitySplitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quantitySplitQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 8,
  },
  quantitySplitInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  quantitySplitInfoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 18,
  },
  quantitySplitActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quantitySplitCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantitySplitCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  quantitySplitConfirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quantitySplitConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // EXPANDED CART MODAL STYLES
  expandedCartOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  expandedCartContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    flex: 1,
  },
  expandedCartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expandedCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  expandedCartCloseButton: {
    padding: 4,
  },
  expandedCartItems: {
    flex: 1,
    paddingHorizontal: 16,
  },
  expandedCartItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedCartItemMain: {
    padding: 16,
  },
  expandedCartItemInfo: {
    marginBottom: 12,
  },
  expandedCartItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  expandedCartItemConfigs: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  expandedCartItemConfigText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 18,
  },
  expandedCartConfigLabel: {
    fontWeight: '600',
    color: '#8b5cf6',
  },
  expandedCartItemNote: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  expandedCartNoteLabel: {
    fontWeight: '600',
    color: '#d97706',
  },
  expandedCartItemPriceDetails: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedCartItemUnitPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  expandedCartItemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  expandedCartItemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  expandedCartItemQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  expandedCartQuantityButton: {
    backgroundColor: '#ffffff',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  expandedCartQuantityDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  expandedCartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandedCartItemEdit: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  expandedCartItemRemove: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedCartEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  expandedCartEmptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
  },
  expandedCartEmptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
  },
  expandedCartFooter: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  expandedCartSummary: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  expandedCartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandedCartSummaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  expandedCartSummaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  expandedCartSummaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  expandedCartSummaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  expandedCartActions: {
    flexDirection: 'row',
    gap: 12,
  },
  expandedCartClearButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 0.3,
    justifyContent: 'center',
  },
  expandedCartClearText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedCartOrderButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 0.7,
    justifyContent: 'center',
  },
  expandedCartOrderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // DISABLED BUTTON STYLES
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
});