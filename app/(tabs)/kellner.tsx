// app/(tabs)/kellner.tsx - Code ohne Swipe-Funktionalität
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { styles } from '../../styles/KellnerStyles';
import { usePermissions } from '../../hooks/usePermissions';

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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../../context/ApiContext';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface AuthUser {
  id: number;
  name: string;
  email: string;
  company_id: number;
  roles?: string[];
  permissions?: string[];
}

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
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
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
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'billing'>('order');
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  
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

  // API Hooks
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
  const { hasPermission } = usePermissions();

  // handleBackToTables function - ohne Swipe-Animation
  const handleBackToTables = useCallback(async () => {
    try {
      // State updates sofort
      setShowOrderInterface(false);
      setSelectedTable(null);
      setCart([]);
      setSelectedCategory(null);
      setBillingData(null);
      setSelectedItems([]);
      setActiveTab('order');
      setIsCartExpanded(false);
      
      // Tische im Hintergrund laden
      loadTables().then(() => {
        // Scroll position wiederherstellen
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
        }, 50);
      });
      
    } catch (error) {
      console.error('Error in handleBackToTables:', error);
    }
  }, [scrollPosition]);

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
        
        const processed = processMenuCategories(rawCategories);
        setProcessedCategories(processed);
        setMenuData(rawCategories);
        
        if (processed.length > 0) {
          setSelectedCategory(processed[0]);
        }
        
        setShowOrderInterface(true);
        setActiveTab('order');
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

  const handleTabChange = (tab: 'order' | 'billing') => {
    setActiveTab(tab);
    if (tab === 'billing') {
      loadBillingData();
    }
  };

  const handleToggleItemPaid = async (itemUuid: string) => {
    try {
      const response = await toggleItemPaid(itemUuid);
      if (response && response.success) {
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
  
  // Rekursive Funktion für alle Kategorie-Ebenen
  const processCategory = (category: MenuCategory) => {
    // Kategorie nur hinzufügen wenn sie Items hat
    if (category.items && category.items.length > 0) {
      const enabledItems = category.items
        .filter(item => item.is_enabled && !item.is_disabled)
      
      if (enabledItems.length > 0) {
        processed.push({
          ...category,
          items: enabledItems
        });
      }
    }
    
    // Rekursiv alle Unterkategorien verarbeiten
    if (category.subcategories && category.subcategories.length > 0) {
      const sortedSubcategories = [...category.subcategories]
        .filter(subcat => subcat.is_enabled)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      sortedSubcategories.forEach(subcat => {
        processCategory(subcat); // ← REKURSIVER AUFRUF
      });
    }
  };
  
  // Hauptkategorien verarbeiten
  const enabledMainCategories = categories
    .filter(cat => cat.is_enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  enabledMainCategories.forEach(category => {
    processCategory(category);
  });
  
  return processed;
};

  const openEditModal = (cartItem: CartItem) => {
    setIsCartExpanded(false);
    
    const originalItemUuid = cartItem.uuid.split('-{')[0];
    const originalItem = findOriginalItemByUuid(originalItemUuid);
    
    if (!originalItem) {
      Alert.alert('Fehler', 'Original-Item konnte nicht gefunden werden');
      return;
    }
    
    if (cartItem.quantity > 1) {
      setEditingCartItem(cartItem);
      setSplitQuantity(1);
      setShowQuantitySplitModal(true);
      return;
    }
    
    proceedWithEditModal(cartItem, cartItem.quantity);
  };
  
  const proceedWithEditModal = (cartItem: CartItem, quantityToEdit: number) => {
    const originalItemUuid = cartItem.uuid.split('-{')[0];
    const originalItem = findOriginalItemByUuid(originalItemUuid);
    
    if (!originalItem) return;
    
    setIsEditingCartItem(true);
    setEditingCartItem(cartItem);
    
    setSelectedItem(originalItem);
    setModalQuantity(quantityToEdit);
    setSpecialNote(cartItem.specialNote || '');
    
    if (cartItem.configurations) {
      setSelectedConfigurations(cartItem.configurations);
    } else {
      setSelectedConfigurations({});
    }
    
    calculateModalPrice(originalItem, quantityToEdit, cartItem.configurations || {});
    
    setShowItemModal(true);
    setShowQuantitySplitModal(false);
  };
  
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
    
    if (isEditingCartItem && editingCartItem) {
      const editQuantity = modalQuantity;
      const remainingQuantity = editingCartItem.quantity - editQuantity;
      
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
      
      let updatedCart = [...cart];
      
      if (remainingQuantity > 0) {
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
        
        updatedCart.push(newItem);
      } else {
        updatedCart = updatedCart.map(cartItem => {
          if (cartItem.uuid === editingCartItem.uuid) {
            return newItem;
          }
          return cartItem;
        });
      }
      
      setCart(updatedCart);
      
      setIsEditingCartItem(false);
      setEditingCartItem(null);
    } else {
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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearchActive(false);
      return;
    }
    
    setIsSearchActive(true);
    
    const allItems: MenuItem[] = [];
    processedCategories.forEach(category => {
      category.items.forEach(item => {
        if (item.is_enabled && !item.is_disabled && !item.sold_out) {
          allItems.push(item);
        }
      });
    });
    
    const filtered = allItems.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    setSearchResults(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    setSearchResults([]);
  };

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

    const allItems = billingData.customers.flatMap(customer => customer.items);

    return (
      <View style={styles.billingContainer}>
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
                  {hasPermission('pay_items') && (
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
                  )}
                  
                  {hasPermission('cancel_items') && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancelItem(item.uuid)}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.billingActions}>
          {hasPermission('pay_items') && (
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
          )}
          
          <View style={styles.billingActionsRow}>
            {hasPermission('pay_session') && (
              <TouchableOpacity 
                style={[styles.billingActionButton, styles.payAllButton]}
                onPress={handlePaySession}
              >
                <Ionicons name="card" size={20} color="#ffffff" />
                <Text style={styles.billingActionText}>Alle bezahlen</Text>
              </TouchableOpacity>
            )}
            
            {hasPermission('end_session') && (
              <TouchableOpacity 
                style={[styles.billingActionButton, styles.endSessionButton]}
                onPress={handleEndSession}
              >
                <Ionicons name="power" size={20} color="#ffffff" />
                <Text style={styles.billingActionText}>Session beenden</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Order Interface mit Tab-Navigation (ohne Swipe-Gesture)
  if (showOrderInterface && selectedTable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
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
            {hasPermission('show_order') && (
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
            )}

            {hasPermission('list_table_management') && (
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
                  Bestellübersicht
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tab Content */}
          {activeTab === 'order' ? (
            // BESTELLEN TAB
            isLoadingMenu ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Lade Menü...</Text>
              </View>
            ) : (
              <>
                {/* Search Section */}
                <View style={styles.searchSection}>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={16} color="#6b7280" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                      onFocus={() => {
                        if (searchQuery.length >= 2) {
                          setIsSearchActive(true);
                        }
                      }}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        style={styles.searchClearButton}
                        onPress={clearSearch}
                      >
                        <Ionicons name="close" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

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

                {/* Items List */}
                <View style={styles.itemsContainer}>
                  {isSearchActive ? (
                    // Search Results
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.uuid}
                      ListHeaderComponent={() => (
                        <View style={styles.searchResultsHeader}>
                          <Text style={styles.searchResultsText}>
                            {searchResults.length} Ergebnis{searchResults.length !== 1 ? 'se' : ''} für "{searchQuery}"
                          </Text>
                        </View>
                      )}
                      ListEmptyComponent={() => (
                        <View style={styles.emptySearchResults}>
                          <Ionicons name="search-outline" size={48} color="#9ca3af" />
                          <Text style={styles.emptySearchText}>
                            Keine Ergebnisse für "{searchQuery}"
                          </Text>
                          <Text style={styles.emptySearchSubtext}>
                            Versuchen Sie andere Suchbegriffe
                          </Text>
                        </View>
                      )}
                      renderItem={({ item }) => {
                        const cartQuantity = cart
                          .filter(cartItem => cartItem.uuid.startsWith(item.uuid))
                          .reduce((sum, cartItem) => sum + cartItem.quantity, 0);
                        
                        return (
                          <View style={[
                            styles.itemRow,
                            cartQuantity > 0 && styles.itemRowSelected
                          ]}>
                            <TouchableOpacity
                              style={styles.itemRowMainArea}
                              onPress={() => addItemDirectly(item)}
                            >
                              <View style={styles.itemRowContent}>
                                <View style={styles.itemRowInfo}>
                                  <Text style={styles.itemRowTitle} numberOfLines={2}>
                                    {item.title}
                                  </Text>
                                </View>
                                
                                <View style={styles.itemRowPrice}>
                                  <Text style={styles.itemRowPriceText}>
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
                              style={styles.itemRowConfigButton}
                              onPress={() => openItemModal(item)}
                            >
                              <Ionicons name="create-outline" size={20} color="#ffffff" />
                            </TouchableOpacity>
                          </View>
                        );
                      }}
                    />
                  ) : (
                    // Normal Category Items
                    selectedCategory && (
                      <FlatList
                        data={selectedCategory.items}
                        keyExtractor={(item) => item.uuid}
                        contentContainerStyle={{ paddingBottom: 70 }}
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
                    )
                  )}
                </View>

                {/* Warenkorb - Kompakter Header */}
                <View style={styles.cartSectionCompact}>
                  <View style={styles.cartHeader}>
                    <Text style={styles.cartHeaderTitle}>Warenkorb</Text>
                    <View style={styles.cartHeaderActions}>
                      <View style={styles.cartHeaderSummary}>
                        <Text style={styles.cartHeaderTotal}>{getCartTotal().toFixed(2)} €</Text>
                        <Text style={styles.cartHeaderCount}>({getCartItemCount()} Items)</Text>
                      </View>
                      
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
                      
                      <TouchableOpacity
                        style={styles.cartExpandButton}
                        onPress={() => setIsCartExpanded(true)}
                      >
                        <Ionicons name="chevron-up" size={20} color="#007AFF" />
                      </TouchableOpacity>
                      
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
            // RECHNUNG TAB
            renderBillingInterface()
          )}
        </View>

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

        {/* Item Configuration Modal */}
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
{isEditingCartItem ? "Item bearbeiten" : "Item hinzufügen"}                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => {
                          setShowItemModal(false);
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
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            setScrollPosition(event.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
        >
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