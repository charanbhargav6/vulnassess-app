import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getProfile();
      setProfile(data);
      setFullName(data.full_name || '');
    } catch (e) {
      Alert.alert('Error', 'Failed to load profile');
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await api.updateProfile(fullName);
      Alert.alert('Success', 'Name updated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update name');
    }
    setSavingName(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current');
      return;
    }
    setChangingPassword(true);
    try {
      const data = await api.changePassword(currentPassword, newPassword);
      if (data.message) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.detail || 'Failed to change password');
      }
    } catch (e) {
      setPasswordError('Cannot connect to server');
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }
    setDeleting(true);
    try {
      const data = await api.deleteAccount(deletePassword);
      if (data.message) {
        setShowDeleteModal(false);
        await AsyncStorage.clear();
        Alert.alert(
          'Account Deleted',
          'Your account and all scan data have been permanently deleted.',
          [{ text: 'OK', onPress: () => navigation.replace('Login') }]
        );
      } else {
        setDeleteError(data.detail || 'Incorrect password');
      }
    } catch (e) {
      setDeleteError('Cannot connect to server');
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.blue} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Avatar + Basic Info */}
      <View style={[styles.headerCard, { backgroundColor: theme.header }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.emailText}>{profile?.email}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge,
            profile?.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
            <Text style={styles.badgeText}>
              {profile?.role === 'admin' ? 'Admin' : 'User'}
            </Text>
          </View>
          <View style={[styles.badge,
            profile?.is_verified ? styles.verifiedBadge : styles.unverifiedBadge]}>
            <Text style={styles.badgeText}>
              {profile?.is_verified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
        </View>
        <Text style={styles.joinedText}>
          Joined: {profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
            : 'Unknown'}
        </Text>
      </View>

      {/* Scan Stats */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderWidth: isDark ? 1 : 0, borderColor: theme.border,
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Scan Statistics</Text>
        <View style={styles.statsGrid}>
          {[
            { value: profile?.stats?.total_scans || 0, label: 'Total Scans', color: theme.blue },
            { value: profile?.stats?.completed_scans || 0, label: 'Completed', color: '#16A34A' },
            { value: profile?.stats?.high_risk_scans || 0, label: 'High Risk', color: '#DC2626' },
            { value: profile?.scan_limit || 100, label: 'Scan Limit', color: theme.blue },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: theme.bg }]}>
              <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
        {profile?.stats?.last_scan_target ? (
          <View style={[styles.lastScanBox, {
            backgroundColor: theme.blueBg, borderColor: theme.blueBorder,
          }]}>
            <Text style={[styles.lastScanLabel, { color: theme.blue }]}>Last Scan:</Text>
            <Text style={[styles.lastScanTarget, { color: theme.text }]} numberOfLines={1}>
              {profile.stats.last_scan_target}
            </Text>
            <Text style={[styles.lastScanDate, { color: theme.textSecondary }]}>
              {new Date(profile.stats.last_scan).toLocaleString()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Appearance */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderWidth: isDark ? 1 : 0, borderColor: theme.border,
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        <View style={styles.darkModeRow}>
          <View>
            <Text style={[styles.darkModeLabel, { color: theme.text }]}>Dark Mode</Text>
            <Text style={[styles.darkModeSubtext, { color: theme.textSecondary }]}>
              {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: isDark ? theme.blue : '#1F2937' }]}
            onPress={toggleTheme}>
            <Text style={styles.toggleBtnText}>{isDark ? 'Light' : 'Dark'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Display Name */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderWidth: isDark ? 1 : 0, borderColor: theme.border,
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Display Name</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text,
          }]}
          placeholder="Enter your name"
          placeholderTextColor={theme.textMuted}
          value={fullName}
          onChangeText={setFullName}
        />
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.blue }, savingName && styles.btnDisabled]}
          onPress={handleSaveName}
          disabled={savingName}>
          {savingName
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Save Name</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Change Password */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderWidth: isDark ? 1 : 0, borderColor: theme.border,
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Change Password</Text>
        {passwordError.length > 0 && (
          <View style={[styles.errorBox, {
            backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder,
          }]}>
            <Text style={[styles.errorText, { color: theme.danger }]}>{passwordError}</Text>
          </View>
        )}
        {passwordSuccess.length > 0 && (
          <View style={[styles.successBox, {
            backgroundColor: theme.successBg, borderColor: theme.successBorder,
          }]}>
            <Text style={[styles.successText, { color: theme.success }]}>{passwordSuccess}</Text>
          </View>
        )}
        {['Current Password', 'New Password', 'Confirm New Password'].map((ph, i) => (
          <TextInput
            key={i}
            style={[styles.input, {
              backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text,
            }]}
            placeholder={ph}
            placeholderTextColor={theme.textMuted}
            value={i === 0 ? currentPassword : i === 1 ? newPassword : confirmPassword}
            onChangeText={(t) => {
              if (i === 0) setCurrentPassword(t);
              else if (i === 1) setNewPassword(t);
              else setConfirmPassword(t);
              setPasswordError('');
              setPasswordSuccess('');
            }}
            secureTextEntry
          />
        ))}
        <TouchableOpacity
          style={[styles.btn, styles.btnDanger, changingPassword && styles.btnDisabled]}
          onPress={handleChangePassword}
          disabled={changingPassword}>
          {changingPassword
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Change Password</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderWidth: 1, borderColor: '#DC2626',
      }]}>
        <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Danger Zone</Text>
        <Text style={[styles.dangerDesc, { color: theme.textSecondary }]}>
          Permanently delete your account and all scan data. This cannot be undone.
        </Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnDanger]}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              `Are you sure you want to delete your account "${profile?.email}"? All your scans and data will be permanently removed.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, Delete', style: 'destructive',
                  onPress: () => setShowDeleteModal(true) }
              ]
            );
          }}>
          <Text style={styles.btnText}>Delete My Account</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {
            backgroundColor: theme.card, borderColor: '#DC2626', borderWidth: 1,
          }]}>
            <Text style={[styles.modalTitle, { color: '#DC2626' }]}>
              Confirm Account Deletion
            </Text>
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Enter your password to permanently delete your account and all data.
            </Text>
            {deleteError.length > 0 && (
              <View style={[styles.errorBox, {
                backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder,
              }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>{deleteError}</Text>
              </View>
            )}
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text,
              }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textMuted}
              value={deletePassword}
              onChangeText={(t) => { setDeletePassword(t); setDeleteError(''); }}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.btnDanger, deleting && styles.btnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleting}>
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnText}>Delete Forever</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12 },
  headerCard: { padding: 28, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  emailText: { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', marginBottom: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginHorizontal: 4 },
  adminBadge: { backgroundColor: '#7C3AED' },
  userBadge: { backgroundColor: 'rgba(255,255,255,0.2)' },
  verifiedBadge: { backgroundColor: '#16A34A' },
  unverifiedBadge: { backgroundColor: '#DC2626' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  joinedText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  statCard: { width: '50%', paddingHorizontal: 6, marginBottom: 12, alignItems: 'center', padding: 16, borderRadius: 12 },
  statNumber: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  lastScanBox: { borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1 },
  lastScanLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  lastScanTarget: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  lastScanDate: { fontSize: 11 },
  darkModeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  darkModeLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  darkModeSubtext: { fontSize: 13 },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  toggleBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
  btnDanger: { backgroundColor: '#DC2626' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13 },
  successBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  successText: { fontSize: 13 },
  dangerDesc: { fontSize: 13, marginBottom: 14, lineHeight: 20 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalBox: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalDesc: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', marginTop: 4 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});