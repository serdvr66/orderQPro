// app/(tabs)/kellner.tsx - Mit Smart Item Selection
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

export default function KellnerScreen() {
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  
  // Data States
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [processedCategories, setProcessedCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // UI States
  const [showOrderInterface, setShowOrderInterface] = useState(false);
  
  // Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState('');
  const [selectedConfigurations, setSelectedConfigurations] = useState<SelectedConfiguration>({});
  const [modalTotalPrice, setModalTotalPrice] = useState(0);

  // API Hooks
  const { getAllTables, getMenuForWaiter, placeWaiterOrder } = useApi();
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

  // NEW: Direktes Hinzufügen ohne Modal
  const addItemDirectly = (item: MenuItem) => {
    const basePrice = Number(item.price) || 0;
    let configPriceChange = 0;
    const defaultConfigurations: SelectedConfiguration = {};

    // Standard-Konfigurationen anwenden (preselected oder erste Option)
    if (item.item_configurations) {
      item.item_configurations.forEach(config => {
        const options = config.configuration_options || [];
        
        if (config.type === 'single') {
          // Preselected oder erste Option für Single-Choice
          const preselected = options.find(opt => opt.preselected);
          const defaultOption = preselected || options[0];
          
          if (defaultOption) {
            defaultConfigurations[config.title] = defaultOption.title;
            configPriceChange += Number(defaultOption.price_change) || 0;
          }
        } else if (config.type === 'multiple') {
          // Nur preselected Options für Multiple-Choice
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
    
    // FIXED: Suche nach identischem Item (gleiche Konfigurationen, keine Notiz)
    const existingItemIndex = cart.findIndex(cartItem => {
      // Extract original UUID from cart item
      const cartItemOriginalUuid = cartItem.uuid.split('-{')[0];
      
      return cartItemOriginalUuid === item.uuid &&
        JSON.stringify(cartItem.configurations || {}) === JSON.stringify(defaultConfigurations) &&
        !cartItem.specialNote; // Keine Notiz
    });
    
    if (existingItemIndex >= 0) {
      // Menge erhöhen bei identischem Item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * finalPrice;
      setCart(updatedCart);
    } else {
      // Neues Item hinzufügen
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
    setSelectedItem(item);
    setModalQuantity(1);
    setSpecialNote('');
    setSelectedConfigurations({});
    
    // Initialize configurations with preselected values
    if (item.item_configurations) {
      const initialConfigs: SelectedConfiguration = {};
      item.item_configurations.forEach(config => {
        if (config.type === 'single') {
          // Find preselected option or first option
          const options = config.configuration_options || [];
          const preselected = options.find(opt => opt.preselected);
          const firstOption = options[0];
          if (preselected) {
            initialConfigs[config.title] = preselected.title;
          } else if (config.fixed_preselection && firstOption) {
            initialConfigs[config.title] = firstOption.title;
          }
        } else {
          // Multiple selection - array of preselected options
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
    
    // Calculate initial price
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

    // Calculate configuration price change
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
    
    // Create unique identifier for cart item (including configurations)
    const cartItemId = `${selectedItem.uuid}-${JSON.stringify(selectedConfigurations)}-${specialNote}`;
    
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.uuid === selectedItem.uuid &&
      JSON.stringify(cartItem.configurations) === JSON.stringify(selectedConfigurations) &&
      cartItem.specialNote === specialNote
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += modalQuantity;
      updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * finalPrice;
      setCart(updatedCart);
    } else {
      // Add new item
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

    setShowItemModal(false);
  };

  const removeFromCart = (cartItemId: string) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.uuid === cartItemId);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      if (updatedCart[existingItemIndex].quantity > 1) {
        // Decrease quantity
        updatedCart[existingItemIndex].quantity -= 1;
        updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price;
        setCart(updatedCart);
      } else {
        // Remove item completely
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
      console.log('=== DEBUG: Cart before processing ===');
      console.log(JSON.stringify(cart, null, 2));
      
      // Convert cart to API format
      const orderCart = cart.map(cartItem => {
        
        console.log(`=== DEBUG: Processing cart item ===`);
        console.log('Cart item UUID:', cartItem.uuid);
        console.log('Cart item configurations:', cartItem.configurations);
        
        // Extract original item UUID (before our custom additions)
        // Format: "uuid-{configs}-note" -> we want everything before the first "{" 
        const originalItemUuid = cartItem.uuid.split('-{')[0];
        console.log('Extracted original UUID:', originalItemUuid);
        
        // Find the original item to get its configurations structure
        const originalItem = findOriginalItemByUuid(originalItemUuid);
        console.log('Found original item:', originalItem ? originalItem.title : 'NOT FOUND');
        
        // Calculate base price and config price change for this item
        const basePrice = originalItem ? Number(originalItem.price) || 0 : 0;
        let configPriceChange = 0;
        
        // Build configurations in the expected format
        const configurations: any = {};
        
        if (cartItem.configurations && originalItem?.item_configurations) {
          console.log('Processing configurations...');
          const singles: any = {};
          const multiples: any = {};
          
          // Process each configuration
          Object.entries(cartItem.configurations).forEach(([configTitle, selectedValue]) => {
            console.log(`Config: ${configTitle} = `, selectedValue);
            
            // Find the original configuration to determine its type
            const originalConfig = originalItem.item_configurations!.find(config => config.title === configTitle);
            console.log(`Original config found:`, originalConfig ? originalConfig.type : 'NOT FOUND');
            
            if (originalConfig) {
              const options = originalConfig.configuration_options || [];
              
              if (originalConfig.type === 'single' && typeof selectedValue === 'string') {
                const option = options.find(opt => opt.title === selectedValue);
                const priceChange = Number(option?.price_change) || 0;
                singles[configTitle] = {
                  value: selectedValue,
                  price_change: priceChange.toFixed(2)
                };
                // Add to total config price change
                configPriceChange += priceChange;
              } else if (originalConfig.type === 'multiple' && Array.isArray(selectedValue) && selectedValue.length > 0) {
                multiples[configTitle] = selectedValue.map(value => {
                  const option = options.find(opt => opt.title === value);
                  const priceChange = Number(option?.price_change) || 0;
                  // Add to total config price change
                  configPriceChange += priceChange;
                  return {
                    title: value,
                    price_change: priceChange.toFixed(2)
                  };
                });
              }
            }
          });
          
          // Only add if there are configurations
          if (Object.keys(singles).length > 0) {
            configurations.singles = singles;
          }
          if (Object.keys(multiples).length > 0) {
            configurations.multiples = multiples;
          }
          
          console.log('Final configurations object:', configurations);
        }
        
        const orderItem = {
          item_id: originalItemUuid,
          qty: cartItem.quantity,
          price: cartItem.price,
          comments: cartItem.specialNote ? [cartItem.specialNote] : [],
          // Format für FrontendController (item_configurations statt configurations)
          item_configurations: Object.keys(configurations).length > 0 ? configurations : undefined,
          // Zusätzliche Felder die der FrontendController erwartet
          configuration_total: configPriceChange,
          base_price: basePrice
        };
        
        console.log('Final order item:', orderItem);
        return orderItem;
      });

      console.log('=== DEBUG: Final order cart ===');
      console.log(JSON.stringify(orderCart, null, 2));

      await placeWaiterOrder(selectedTable.code, orderCart, '');
      
      // SOFORT nach erfolgreichem API-Call - nicht warten auf Alert
      setCart([]);
      
      Alert.alert(
        'Bestellung erfolgreich',
        `Bestellung für ${selectedTable.name} wurde aufgegeben`,
        [
          {
            text: 'Neue Bestellung',
            onPress: () => {
              // Sicherheitshalber nochmal, aber sollte schon leer sein
              setCart([]);
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

  // Helper function to find original item by UUID
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
  };

  // Order Interface (Orderman Style)
  if (showOrderInterface && selectedTable) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Top Bar - Cart Summary */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToTables}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.tableInfo}>
            <Text style={styles.tableName}>{selectedTable.name}</Text>
          </View>
          
          <View style={styles.cartSummary}>
            <Text style={styles.cartTotal}>{getCartTotal().toFixed(2)} €</Text>
            <Text style={styles.cartItemCount}>({getCartItemCount()} Items)</Text>
          </View>
        </View>

        {isLoadingMenu ? (
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

            {/* Items List - Now takes up 60% of screen */}
            <View style={styles.itemsContainer}>
              {selectedCategory && (
                <FlatList
                  data={selectedCategory.items}
                  keyExtractor={(item) => item.uuid}
                  numColumns={2}
                  columnWrapperStyle={styles.itemsRow}
                  renderItem={({ item }) => {
                    const cartQuantity = cart
                      .filter(cartItem => cartItem.uuid.startsWith(item.uuid))
                      .reduce((sum, cartItem) => sum + cartItem.quantity, 0);
                    const isUnavailable = item.sold_out || item.is_disabled;
                    
                    return (
                      <View style={[
                        styles.itemButton,
                        isUnavailable && styles.itemButtonDisabled,
                        cartQuantity > 0 && styles.itemButtonSelected
                      ]}>
                        {/* MODIFIED: Direkter Klick fügt Item hinzu */}
                        <TouchableOpacity
                          style={styles.itemMainArea}
                          onPress={() => !isUnavailable && addItemDirectly(item)}
                          disabled={isUnavailable}
                        >
                          <View style={styles.itemContent}>
                            <Text style={[
                              styles.itemTitle,
                              isUnavailable && styles.itemTitleDisabled
                            ]} numberOfLines={2}>
                              {item.title}
                            </Text>
                            
                            <Text style={[
                              styles.itemPrice,
                              isUnavailable && styles.itemPriceDisabled
                            ]}>
                              {Number(item.price || 0).toFixed(2)} €
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* MODIFIED: Configuration Button öffnet Modal */}
                        <TouchableOpacity
                          style={styles.configButton}
                          onPress={() => !isUnavailable && openItemModal(item)}
                          disabled={isUnavailable}
                        >
                          <Ionicons name="create-outline" size={18} color="#ffffff" />
                        </TouchableOpacity>

                        {cartQuantity > 0 && (
                          <View style={styles.quantityBadge}>
                            <Text style={styles.quantityText}>{cartQuantity}</Text>
                          </View>
                        )}
                        
                        {isUnavailable && (
                          <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableText}>
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

            {/* NEW: Live Cart Section - Takes up 40% of screen */}
            <View style={styles.cartSection}>
              <View style={styles.cartHeader}>
                <Text style={styles.cartHeaderTitle}>Warenkorb</Text>
                <View style={styles.cartHeaderSummary}>
                  <Text style={styles.cartHeaderTotal}>{getCartTotal().toFixed(2)} €</Text>
                  <Text style={styles.cartHeaderCount}>({getCartItemCount()} Items)</Text>
                </View>
              </View>

              {cart.length > 0 ? (
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.uuid}
                  style={styles.cartList}
                  renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                      <View style={styles.cartItemMain}>
                        <View style={styles.cartItemInfo}>
                          <Text style={styles.cartItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          
                          {/* Show configurations if any */}
                          {item.configurations && (
                            <View style={styles.cartItemConfigs}>
                              {Object.entries(item.configurations).map(([configTitle, value]) => (
                                <Text key={configTitle} style={styles.cartItemConfigText} numberOfLines={1}>
                                  {configTitle}: {Array.isArray(value) ? value.join(', ') : value}
                                </Text>
                              ))}
                            </View>
                          )}
                          
                          {/* Show special note if any */}
                          {item.specialNote && (
                            <Text style={styles.cartItemNote} numberOfLines={1}>
                              Notiz: {item.specialNote}
                            </Text>
                          )}
                        </View>

                        <View style={styles.cartItemControls}>
                          <Text style={styles.cartItemPrice}>
                            {item.total.toFixed(2)} €
                          </Text>
                          
                          <View style={styles.cartItemQuantityControls}>
                            <TouchableOpacity
                              style={styles.cartQuantityButton}
                              onPress={() => removeFromCart(item.uuid)}
                            >
                              <Text style={styles.cartQuantityButtonText}>-</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.cartQuantityDisplay}>{item.quantity}</Text>
                            
                            <TouchableOpacity
                              style={styles.cartQuantityButton}
                              onPress={() => {
                                // Add one more of the same item
                                const updatedCart = [...cart];
                                const itemIndex = updatedCart.findIndex(cartItem => cartItem.uuid === item.uuid);
                                if (itemIndex >= 0) {
                                  updatedCart[itemIndex].quantity += 1;
                                  updatedCart[itemIndex].total = updatedCart[itemIndex].quantity * updatedCart[itemIndex].price;
                                  setCart(updatedCart);
                                }
                              }}
                            >
                              <Text style={styles.cartQuantityButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Remove button */}
                      <TouchableOpacity
                        style={styles.cartItemRemove}
                        onPress={() => {
                          const updatedCart = cart.filter(cartItem => cartItem.uuid !== item.uuid);
                          setCart(updatedCart);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.emptyCart}>
                  <Ionicons name="basket-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyCartText}>Warenkorb ist leer</Text>
                  <Text style={styles.emptyCartSubtext}>Wählen Sie Items aus dem Menü</Text>
                </View>
              )}

              {/* Order Button - Always visible */}
              <View style={styles.cartFooter}>
                <TouchableOpacity 
                  style={styles.clearCartButton}
                  onPress={() => setCart([])}
                  disabled={cart.length === 0}
                >
                  <Text style={[
                    styles.clearCartText,
                    cart.length === 0 && styles.disabledButtonText
                  ]}>Leeren</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.orderButton,
                    cart.length === 0 && styles.disabledButton
                  ]}
                  onPress={submitOrder}
                  disabled={cart.length === 0}
                >
                  <Text style={[
                    styles.orderButtonText,
                    cart.length === 0 && styles.disabledButtonText
                  ]}>
                    Bestellen - {getCartTotal().toFixed(2)} €
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

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
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowItemModal(false)}
                      >
                        <Ionicons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>

                    {/* Item Info */}
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemTitle}>{selectedItem.title}</Text>
                      <Text style={styles.modalItemPrice}>
                        {modalTotalPrice.toFixed(2)} €
                      </Text>
                      {selectedItem.description && (
                        <Text style={styles.modalItemDescription}>{selectedItem.description}</Text>
                      )}
                    </View>

                    {/* Special Notes */}
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

                    {/* Configurations */}
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

              {/* Modal Footer */}
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
                    Hinzufügen - {modalTotalPrice.toFixed(2)} €
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Table Selection (Original)
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
  
  // Table Selection Styles
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

  // Order Interface Styles (Orderman-like)
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

  // Categories
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

  // Items
  itemsContainer: {
    flex: 0.6, // Takes 60% of available space
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  itemsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  itemButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    margin: 4,
    width: '48%',
    minHeight: 80,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  itemMainArea: {
    flex: 1,
    padding: 12,
  },
  itemButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f9ff',
  },
  itemButtonDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemTitleDisabled: {
    color: '#9ca3af',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemPriceDisabled: {
    color: '#9ca3af',
  },
  configButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  quantityBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unavailableBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  unavailableText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },

  // Live Cart Section
  cartSection: {
    flex: 0.4, // Takes 40% of available space
    backgroundColor: '#f8fafc',
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  cartHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  cartList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  cartItem: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginVertical: 2,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 60, // Kleiner: war vorher implizit ~80px
  },
  cartItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, // Kleiner: war 12
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 8, // Kleiner: war 12
  },
  cartItemTitle: {
    fontSize: 13, // Kleiner: war 14
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  cartItemConfigs: {
    marginTop: 1, // Kleiner: war 2
  },
  cartItemConfigText: {
    fontSize: 10, // Kleiner: war 11
    color: '#6b7280',
    fontStyle: 'italic',
  },
  cartItemNote: {
    fontSize: 10, // Kleiner: war 11
    color: '#f59e0b',
    fontStyle: 'italic',
    marginTop: 1, // Kleiner: war 2
  },
  cartItemControls: {
    alignItems: 'flex-end',
  },
  cartItemPrice: {
    fontSize: 13, // Kleiner: war 14
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 3, // Kleiner: war 4
  },
  cartItemQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 4, // Kleiner: war 6
    padding: 1, // Kleiner: war 2
  },
  cartQuantityButton: {
    backgroundColor: '#ffffff',
    width: 24, // Kleiner: war 28
    height: 24, // Kleiner: war 28
    borderRadius: 3, // Kleiner: war 4
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cartQuantityButtonText: {
    fontSize: 12, // Kleiner: war 14
    fontWeight: 'bold',
    color: '#374151',
  },
  cartQuantityDisplay: {
    fontSize: 12, // Kleiner: war 14
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 8, // Kleiner: war 12
    minWidth: 16, // Kleiner: war 20
    textAlign: 'center',
  },
  cartItemRemove: {
    padding: 8, // Kleiner: war 12
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  cartFooter: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },

  // Bottom Bar (Updated)
  bottomBar: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  clearCartButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  clearCartText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  orderButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.7,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal Styles
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
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
});