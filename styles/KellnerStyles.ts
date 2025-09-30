import { StyleSheet } from 'react-native';




export const styles = StyleSheet.create({
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
    gap: 12,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '31%',
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
    backgroundColor: '#ef444479',
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

// Search Styles:
searchContainer: {
  marginRight: 12,
},

searchInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f3f4f6',
  borderRadius: 20,
  paddingHorizontal: 12,
  paddingVertical: 8,
  minWidth: 150,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

searchIcon: {
  marginRight: 8,
},

searchInput: {
  flex: 1,
  fontSize: 14,
  color: '#374151',
  paddingVertical: 0,
},

searchClearButton: {
  marginLeft: 8,
  padding: 2,
},

// Search Section Styles (zwischen Tabs und Kategorien):
searchSection: {
  backgroundColor: '#ffffff',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
},



searchResultsHeader: {
  backgroundColor: '#f8fafc',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
  marginBottom: 8,
},

searchResultsText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#374151',
},

emptySearchResults: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 60,
  gap: 12,
},

emptySearchText: {
  fontSize: 18,
  fontWeight: '600',
  color: '#6b7280',
  textAlign: 'center',
},

emptySearchSubtext: {
  fontSize: 14,
  color: '#9ca3af',
  textAlign: 'center',
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

   swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  swipeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },


    });
