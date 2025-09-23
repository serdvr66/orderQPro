// screens/SettingsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          onPress: () => {
            router.replace('/login');
          },
          style: 'destructive'
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent || <Ionicons name="chevron-forward" size={20} color={Colors.gray} />}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Unbekannter Nutzer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'keine@email.de'}</Text>
        </View>

        <SectionHeader title="App-Einstellungen" />
        <SettingItem
          icon="refresh-outline"
          title="Auto-Aktualisierung"
          subtitle="Bestellungen automatisch alle 2 Sekunden aktualisieren"
        />
        <SettingItem
          icon="language-outline"
          title="Sprache"
          subtitle="Deutsch"
        />

        <SectionHeader title="Support" />
        <SettingItem
          icon="help-circle-outline"
          title="Hilfe & Support"
          subtitle="Häufige Fragen und Kontakt"
        />
        <SettingItem
          icon="document-text-outline"
          title="Nutzungsbedingungen"
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Datenschutz"
        />

        <SectionHeader title="Account" />
        <SettingItem
          icon="log-out-outline"
          title="Abmelden"
          onPress={handleLogout}
          rightComponent={<View />}
        />

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>OrderQ v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 OrderQ. Alle Rechte vorbehalten.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});