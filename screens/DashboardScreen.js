import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  RefreshControl, Modal, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export default function DashboardScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  // Multi-select delete state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const e = await AsyncStorage.getItem('email');
    const r = await AsyncStorage.getItem('role');
    setEmail(e || '');
    setRole(r || '');
    await fetchScans();
  };

  const fetchScans = async () => {
    try {
      const data = await api.getScans();
      if (Array.isArray(data)) setScans(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load scans');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await api.logout();
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedIds([]);
  };

  const toggleSelect = (scanId) => {
    setSelectedIds(prev =>
      prev.includes(scanId)
        ? prev.filter(id => id !== scanId)
        : [...prev, scanId]
    );
  };

  const selectAll = () => {
    setSelectedIds(scans.map(s => s.id));
  };

  const handleBulkDeletePress = () => {
    if (selectedIds.length === 0) {
      Alert.alert('No scans selected', 'Please select at least one scan.');
      return;
    }
    setDeleteError('');
    setDeletePassword('');
    setShowDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }
    setDeleting(true);
    try {
      let failed = 0;
      let success = 0;
      for (const scanId of selectedIds) {
        try {
          const res = await api.deleteScanVerified(scanId, deletePassword);
          if (res.message) {
            success++;
          } else {
            setDeleteError(res.detail || 'Incorrect password');
            setDeleting(false);
            return;
          }
        } catch (e) { failed++; }
      }
      setShowDeleteModal(false);
      setDeletePassword('');
      setDeleteError('');
      setSelectMode(false);
      setSelectedIds([]);
      await fetchScans();
      if (failed > 0) {
        Alert.alert('Partial Success', `${success} deleted, ${failed} failed.`);
      }
    } catch (e) {
      setDeleteError('Cannot connect to server');
    }
    setDeleting(false);
  };

  const getSeverityColor = (score) => {
    if (score >= 8) return '#DC2626';
    if (score >= 6) return '#EA580C';
    if (score >= 4) return '#D97706';
    if (score > 0) return '#16A34A';
    return theme.textMuted;
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return '#16A34A';
    if (status === 'running') return '#1D6FEB';
    if (status === 'failed') return '#DC2626';
    if (status === 'cancelled') return '#D97706';
    return '#D97706';
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
    header: {
      backgroundColor: theme.header, padding: 20, paddingTop: 50,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    welcomeText: { color: theme.headerText, fontSize: 14, opacity: 0.8 },
    emailText: { color: theme.headerText, fontSize: 16, fontWeight: 'bold' },
    headerButtons: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' },
    headerBtn: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 8, marginLeft: 6, marginBottom: 4,
    },
    headerBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    bellBtn: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 8, marginLeft: 6, marginBottom: 4,
      flexDirection: 'row', alignItems: 'center',
    },
    bellText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    bellBadge: {
      backgroundColor: '#EF4444', borderRadius: 8,
      paddingHorizontal: 5, paddingVertical: 1,
      marginLeft: 4, minWidth: 16, alignItems: 'center',
    },
    bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    adminBtn: {
      backgroundColor: '#fff', paddingHorizontal: 10,
      paddingVertical: 6, borderRadius: 8, marginLeft: 6, marginBottom: 4,
    },
    adminBtnText: { color: '#1D6FEB', fontWeight: 'bold', fontSize: 12 },
    statsRow: { flexDirection: 'row', padding: 16, paddingBottom: 8 },
    statCard: {
      flex: 1, backgroundColor: theme.statCard, borderRadius: 12,
      padding: 14, alignItems: 'center', elevation: 2, marginHorizontal: 4,
      borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
    },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: theme.blue },
    statLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    selectToolbar: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.card, paddingHorizontal: 16,
      paddingVertical: 10, borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    selectToolbarText: { flex: 1, color: theme.text, fontWeight: '600', fontSize: 14 },
    toolbarBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
    listHeaderRow: {
      flexDirection: 'row', marginHorizontal: 16,
      marginTop: 8, marginBottom: 4,
    },
    listHeaderBtn: {
      flex: 1, borderRadius: 10, padding: 12,
      alignItems: 'center', marginHorizontal: 4, borderWidth: 1,
    },
    listHeaderBtnText: { fontWeight: '600', fontSize: 12 },
    scanCard: {
      backgroundColor: theme.card, borderRadius: 12, padding: 16,
      marginHorizontal: 16, marginBottom: 12, elevation: 2,
      borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
    },
    scanCardSelected: { borderWidth: 2, borderColor: theme.blue },
    scanHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 8,
    },
    selectCircle: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: theme.border,
      marginRight: 10, alignItems: 'center', justifyContent: 'center',
    },
    selectCircleActive: { backgroundColor: theme.blue, borderColor: theme.blue },
    selectCheck: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    scanUrl: { fontSize: 15, fontWeight: '600', color: theme.text, flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    scanFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    scanDate: { fontSize: 13, color: theme.textSecondary },
    riskScore: { fontSize: 13, fontWeight: 'bold' },
    empty: { alignItems: 'center', padding: 60 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: theme.textSecondary },
    emptySubtext: { fontSize: 14, color: theme.textMuted, textAlign: 'center', marginTop: 8 },
    fab: {
      backgroundColor: theme.blue, margin: 16, padding: 16,
      borderRadius: 12, alignItems: 'center', elevation: 4,
    },
    fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    notifOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'flex-end', zIndex: 999, backgroundColor: 'rgba(0,0,0,0.5)',
    },
    notifPanel: {
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 20, maxHeight: '70%', borderWidth: 1,
      backgroundColor: theme.card, borderColor: theme.border,
    },
    notifHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 16,
    },
    notifTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text },
    notifEmpty: { textAlign: 'center', padding: 40, fontSize: 15, color: theme.textMuted },
    notifItem: {
      borderLeftWidth: 3, borderRadius: 8,
      padding: 12, marginBottom: 8, backgroundColor: theme.bg,
    },
    notifItemTitle: { fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
    notifItemMsg: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
    notifItemTime: { fontSize: 11, color: theme.textMuted },
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
    errorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
    errorText: { fontSize: 13 },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  });

  const renderScan = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[s.scanCard, isSelected && s.scanCardSelected]}
        onPress={() => {
          if (selectMode) toggleSelect(item.id);
          else navigation.navigate('ScanProgress', { scanId: item.id });
        }}
        onLongPress={() => {
          if (!selectMode) {
            setSelectMode(true);
            setSelectedIds([item.id]);
          }
        }}
      >
        <View style={s.scanHeader}>
          {selectMode && (
            <View style={[s.selectCircle, isSelected && s.selectCircleActive]}>
              {isSelected && <Text style={s.selectCheck}>OK</Text>}
            </View>
          )}
          <Text style={s.scanUrl} numberOfLines={1}>{item.target_url}</Text>
          <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '30' }]}>
            <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={s.scanFooter}>
          <Text style={s.scanDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          <Text style={[s.riskScore, { color: getSeverityColor(item.total_risk_score) }]}>
            Risk: {item.total_risk_score?.toFixed(1) || '0.0'}/10
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.blue} />
      </View>
    );
  }

  return (
    <View style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.welcomeText}>Welcome back!</Text>
          <Text style={s.emailText}>{email}</Text>
        </View>
        <View style={s.headerButtons}>
          <TouchableOpacity style={s.bellBtn}
            onPress={() => { setShowNotifs(true); markAllRead(); }}>
            <Text style={s.bellText}>Bell</Text>
            {unreadCount > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={toggleTheme}>
            <Text style={s.headerBtnText}>{isDark ? 'Light' : 'Dark'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn}
            onPress={() => navigation.navigate('Profile')}>
            <Text style={s.headerBtnText}>Profile</Text>
          </TouchableOpacity>
          {role === 'admin' && (
            <TouchableOpacity style={s.adminBtn}
              onPress={() => navigation.navigate('Admin')}>
              <Text style={s.adminBtnText}>Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.headerBtn} onPress={handleLogout}>
            <Text style={s.headerBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Select Mode Toolbar */}
      {selectMode && (
        <View style={s.selectToolbar}>
          <Text style={s.selectToolbarText}>{selectedIds.length} selected</Text>
          <TouchableOpacity
            style={[s.toolbarBtn, { backgroundColor: theme.blueBg }]}
            onPress={selectAll}>
            <Text style={{ color: theme.blue, fontWeight: '600', fontSize: 13 }}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toolbarBtn, { backgroundColor: theme.dangerBg }]}
            onPress={handleBulkDeletePress}>
            <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 13 }}>
              Delete {selectedIds.length > 0 ? '(' + selectedIds.length + ')' : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toolbarBtn, { backgroundColor: theme.bg }]}
            onPress={toggleSelectMode}>
            <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{scans.length}</Text>
          <Text style={s.statLabel}>Total Scans</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>
            {scans.filter(s2 => s2.status === 'completed').length}
          </Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statNumber, { color: '#DC2626' }]}>
            {scans.filter(s2 => s2.total_risk_score >= 7).length}
          </Text>
          <Text style={s.statLabel}>High Risk</Text>
        </View>
      </View>

      {/* Scan List */}
      <FlatList
        data={scans}
        keyExtractor={item => item.id}
        renderItem={renderScan}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchScans(); }} />
        }
        ListHeaderComponent={
          <View style={s.listHeaderRow}>
            <TouchableOpacity
              style={[s.listHeaderBtn, {
                backgroundColor: theme.blueBg, borderColor: theme.blueBorder,
              }]}
              onPress={() => navigation.navigate('Scans')}>
              <Text style={[s.listHeaderBtnText, { color: theme.blue }]}>
                View All & Filter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.listHeaderBtn, {
                backgroundColor: '#F0FDF4', borderColor: '#16A34A',
              }]}
              onPress={() => navigation.navigate('Schedule')}>
              <Text style={[s.listHeaderBtnText, { color: '#16A34A' }]}>
                Schedule Scans
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.listHeaderBtn, {
                backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder,
              }]}
              onPress={toggleSelectMode}>
              <Text style={[s.listHeaderBtnText, { color: theme.danger }]}>
                {selectMode ? 'Cancel Select' : 'Select & Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No scans yet</Text>
            <Text style={s.emptySubtext}>
              Tap the button below to start your first scan
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('NewScan')}>
        <Text style={s.fabText}>+ New Scan</Text>
      </TouchableOpacity>

      {/* Notifications Panel */}
      {showNotifs && (
        <View style={s.notifOverlay}>
          <View style={s.notifPanel}>
            <View style={s.notifHeader}>
              <Text style={s.notifTitle}>Notifications</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={clearAll} style={{ marginRight: 16 }}>
                  <Text style={{ color: theme.danger, fontSize: 13 }}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowNotifs(false)}>
                  <Text style={{ color: theme.blue, fontSize: 13 }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
            {notifications.length === 0 ? (
              <Text style={s.notifEmpty}>No notifications yet</Text>
            ) : (
              notifications.map(n => (
                <TouchableOpacity key={n.id}
                  style={[s.notifItem, {
                    borderLeftColor: n.type === 'success' ? '#10B981' :
                      n.type === 'error' ? '#EF4444' : '#3B82F6',
                  }]}
                  onPress={() => {
                    setShowNotifs(false);
                    if (n.scanId) navigation.navigate('Report', { scanId: n.scanId });
                  }}>
                  <Text style={s.notifItemTitle}>{n.title}</Text>
                  <Text style={s.notifItemMsg}>{n.message}</Text>
                  <Text style={s.notifItemTime}>
                    {new Date(n.timestamp).toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      )}

      {/* Bulk Delete Password Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, {
            backgroundColor: theme.card, borderColor: '#DC2626', borderWidth: 1,
          }]}>
            <Text style={[s.modalTitle, { color: '#DC2626' }]}>Confirm Delete</Text>
            <Text style={[s.modalDesc, { color: theme.textSecondary }]}>
              Enter your password to delete {selectedIds.length} selected scan{selectedIds.length > 1 ? 's' : ''}.
            </Text>
            {deleteError.length > 0 && (
              <View style={[s.errorBox, {
                backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder,
              }]}>
                <Text style={[s.errorText, { color: theme.danger }]}>{deleteError}</Text>
              </View>
            )}
            <TextInput
              style={[s.input, {
                backgroundColor: theme.input,
                borderColor: theme.inputBorder, color: theme.text,
              }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textMuted}
              value={deletePassword}
              onChangeText={(t) => { setDeletePassword(t); setDeleteError(''); }}
              secureTextEntry
            />
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalBtn, {
                  backgroundColor: theme.bg,
                  borderWidth: 1, borderColor: theme.border,
                }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}>
                <Text style={[s.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#DC2626' },
                  deleting && { opacity: 0.5 }]}
                onPress={handleBulkDeleteConfirm}
                disabled={deleting}>
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.modalBtnText}>Delete Forever</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}