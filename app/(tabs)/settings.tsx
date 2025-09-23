// app/(tabs)/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  // Logout Handler
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

  const openURL = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Fehler', 'Link konnte nicht geöffnet werden.');
    }
  };

  const handleAppRating = () => {
    Alert.alert(
      'App bewerten',
      'Gefällt Ihnen OrderQ? Bewerten Sie uns!',
      [
        { text: 'Später', style: 'cancel' },
        { text: 'Bewerten', onPress: () => openURL('https://apps.apple.com/app/orderq') }
      ]
    );
  };

  const handleBugReport = () => {
    Alert.alert(
      'Fehler melden',
      'Beschreiben Sie uns das Problem:',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'E-Mail senden', onPress: () => openURL('mailto:support@orderq.de?subject=OrderQ Fehler-Report') }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color="#625BFF" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent || <Ionicons name="chevron-forward" size={20} color="#6b7280" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* User Section */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Unbekannter Nutzer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'keine@email.de'}</Text>
        </View>

        {/* Einstellungen */}
        <View style={styles.settingsSection}>

          {/* Sprache */}
          <SettingItem
            icon="language-outline"
            title="Sprache"
            subtitle="Deutsch (Standard)"
            rightComponent={<Text style={styles.rightText}>DE</Text>}
          />

          {/* App bewerten */}
          <SettingItem
            icon="star-outline"
            title="App bewerten"
            subtitle="Bewerten Sie OrderQ im App Store"
            onPress={handleAppRating}
          />

          {/* Fehler melden */}
          <SettingItem
            icon="bug-outline"
            title="Fehler melden"
            subtitle="Problem gefunden? Lassen Sie es uns wissen"
            onPress={handleBugReport}
          />

          {/* Website besuchen */}
          <SettingItem
            icon="globe-outline"
            title="Website besuchen"
            subtitle="orderq.de"
            onPress={() => openURL('https://orderq.de')}
          />

          {/* Abmelden */}
          <SettingItem
            icon="log-out-outline"
            title="Abmelden"
            subtitle="Von diesem Gerät abmelden"
            onPress={handleLogout}
            rightComponent={<Ionicons name="log-out-outline" size={20} color="#ef4444" />}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>OrderQ</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 OrderQ</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#625BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    backgroundColor: '#f9fafb',
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
    color: '#1f2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  rightText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#6b7280',
  },
});