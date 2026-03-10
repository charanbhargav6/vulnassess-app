import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Switch,
  TextInput
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function AdminScreen() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [allScans, setAllScans] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [editingLimit, setEditingLimit] = useState(null);
  const [limitValue, setLimitValue] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [u, m, s, st, l] = await Promise.all([
        api.getUsers(), api.getModules(), api.getAllScans(),
        api.getStats(), api.getLogs(),
      ]);
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(m)) setModules(m);
      if (Array.isArray(s)) setAllScans(s);
      if (st && !st.detail) setStats(st);
      if (Array.isArray(l)) setLogs(l);
    } catch (e) { Alert.alert('Error', 'Failed to load admin data'); }
    setLoading(false);
  };

  const handleDeleteUser = async (userId, email) => {
    Alert.alert('Delete User', `Delete ${email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
        }
      }
    ]);
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await api.updateRole(userId, newRole);
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleToggleUser = async (userId) => {
    await api.toggleUser(userId);
    setUsers(users.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
  };

  const handleScanLimit = async (userId) => {
    const limit = parseInt(limitValue);
    if (isNaN(limit) || limit < 1) { Alert.alert('Error', 'Enter a valid number'); return; }
    await api.updateScanLimit(userId, limit);
    setUsers(users.map(u => u.id === userId ? { ...u, scan_limit: limit } : u));
    setEditingLimit(null);
    setLimitValue('');
  };

  const handleModuleToggle = async (moduleKey, currentEnabled, isFixed) => {
    if (isFixed) {
      Alert.alert('Cannot Disable', 'Authentication module is required and cannot be disabled.');
      return;
    }
    await api.updateModule(moduleKey, !currentEnabled);
    setModules(modules.map(m =>
      m.module_key === moduleKey ? { ...m, enabled: !currentEnabled } : m
    ));
  };

  const handleMoveModule = async (index, direction) => {
    const module = modules[index];
    if (module.fixed) return;
    const newModules = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newModules.length) return;
    if (newModules[swapIndex].fixed) return;
    const tempOrder = newModules[index].order;
    newModules[index] = { ...newModules[index], order: newModules[swapIndex].order };
    newModules[swapIndex] = { ...newModules[swapIndex], order: tempOrder };
    [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];
    setModules(newModules);
    await api.updateModuleOrder(module.module_key, newModules[swapIndex].order);
  };

  const handleRestoreDefaults = async () => {
    Alert.alert('Restore Defaults', 'Reset all modules to default order and enable all?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: async () => {
          await api.restoreModuleDefaults();
          await loadAll();
          Alert.alert('Done', 'Modules restored to defaults!');
        }
      }
    ]);
  };

  const handleDeleteScan = async (scanId) => {
    Alert.alert('Delete Scan', 'Delete this scan?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.adminDeleteScan(scanId);
          setAllScans(allScans.filter(s => s.id !== scanId));
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.blue} />
      </View>
    );
  }

  const tabs = ['stats', 'users', 'modules', 'scans', 'logs'];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {tabs.map(t => (
          <TouchableOpacity key={t}
            style={[styles.tab, tab === t && { borderBottomWidth: 3, borderBottomColor: theme.blue }]}
            onPress={() => setTab(t)}>
            <Text style={[styles.tabText, { color: theme.textSecondary },
              tab === t && { color: theme.blue, fontWeight: 'bold' }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>

        {/* STATS TAB */}
        {tab === 'stats' && stats && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Users', value: stats.total_users, color: theme.blue },
                { label: 'Total Scans', value: stats.total_scans, color: '#7C3AED' },
                { label: 'Completed', value: stats.completed_scans, color: '#16A34A' },
                { label: 'Failed', value: stats.failed_scans, color: '#DC2626' },
                { label: 'High Risk', value: stats.high_risk_scans, color: '#EA580C' },
                { label: 'This Week', value: stats.recent_scans, color: '#0891B2' },
              ].map((item, i) => (
                <View key={i} style={[styles.statCard, {
                  backgroundColor: theme.card,
                  borderTopColor: item.color, borderTopWidth: 3,
                  borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
                }]}>
                  <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Scans Last 7 Days</Text>
            <View style={[styles.chartCard, {
              backgroundColor: theme.card,
              borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
            }]}>
              {stats.scans_per_day?.map((day, i) => (
                <View key={i} style={styles.chartBar}>
                  <Text style={[styles.chartCount, { color: theme.textSecondary }]}>{day.count}</Text>
                  <View style={[styles.bar, {
                    height: Math.max(day.count * 20, 4),
                    backgroundColor: day.count > 0 ? theme.blue : theme.border,
                  }]} />
                  <Text style={[styles.chartDate, { color: theme.textMuted }]}>{day.date}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Users ({users.length})</Text>
            {users.map(user => (
              <View key={user.id} style={[styles.card, {
                backgroundColor: theme.card,
                borderWidth: 1, borderColor: theme.border,
                opacity: user.is_active ? 1 : 0.6,
              }]}>
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{user.email}</Text>
                    <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                      Scans: {user.scan_count} / {user.scan_limit}
                    </Text>
                    <Text style={[styles.cardSub, {
                      color: user.is_active ? '#16A34A' : '#DC2626',
                    }]}>
                      {user.is_active ? 'Active' : 'Deactivated'}
                    </Text>
                  </View>
                  <View style={[styles.roleBadge, {
                    backgroundColor: user.role === 'admin' ? theme.blueBg : theme.bg,
                  }]}>
                    <Text style={[styles.roleText, {
                      color: user.role === 'admin' ? theme.blue : theme.textSecondary,
                    }]}>{user.role}</Text>
                  </View>
                </View>

                {editingLimit === user.id && (
                  <View style={styles.limitRow}>
                    <TextInput
                      style={[styles.limitInput, {
                        backgroundColor: theme.input, borderColor: theme.border,
                        color: theme.text,
                      }]}
                      value={limitValue} onChangeText={setLimitValue}
                      keyboardType="number-pad" placeholder="Enter limit"
                      placeholderTextColor={theme.textMuted}
                    />
                    <TouchableOpacity style={styles.limitSaveBtn}
                      onPress={() => handleScanLimit(user.id)}>
                      <Text style={styles.limitSaveBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.limitCancelBtn, {
                      backgroundColor: theme.dangerBg,
                    }]} onPress={() => setEditingLimit(null)}>
                      <Text style={[styles.limitCancelBtnText, { color: theme.danger }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.cardActions}>
                  {[
                    { label: user.role === 'admin' ? 'Make User' : 'Make Admin',
                      bg: theme.blueBg, color: theme.blue,
                      onPress: () => handleRoleToggle(user.id, user.role) },
                    { label: 'Set Limit',
                      bg: theme.dark ? '#422006' : '#FEF3C7',
                      color: theme.dark ? '#FCD34D' : '#92400E',
                      onPress: () => { setEditingLimit(user.id); setLimitValue(String(user.scan_limit)); } },
                    { label: user.is_active ? 'Deactivate' : 'Activate',
                      bg: user.is_active ? theme.dangerBg : theme.successBg,
                      color: user.is_active ? theme.danger : theme.success,
                      onPress: () => handleToggleUser(user.id) },
                    { label: 'Delete', bg: theme.dangerBg, color: theme.danger,
                      onPress: () => handleDeleteUser(user.id, user.email) },
                  ].map((btn, i) => (
                    <TouchableOpacity key={i}
                      style={[styles.actionBtn, { backgroundColor: btn.bg }]}
                      onPress={btn.onPress}>
                      <Text style={[styles.actionBtnText, { color: btn.color }]}>{btn.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* MODULES TAB */}
        {tab === 'modules' && (
          <View>
            <View style={styles.modulesHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Modules ({modules.length})
              </Text>
              <TouchableOpacity style={[styles.restoreBtn, { backgroundColor: theme.blueBg }]}
                onPress={handleRestoreDefaults}>
                <Text style={[styles.restoreBtnText, { color: theme.blue }]}>Restore Defaults</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              Use up/down buttons to reorder. Authentication module is fixed.
            </Text>
            {modules.map((module, index) => (
              <View key={module.module_key} style={[styles.card, {
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: module.fixed ? theme.blue : theme.border,
              }]}>
                <View style={styles.moduleRow}>
                  <View style={styles.orderButtons}>
                    <TouchableOpacity onPress={() => handleMoveModule(index, 'up')}
                      disabled={index === 0 || module.fixed}>
                      <Text style={[styles.orderBtn,
                        (index === 0 || module.fixed) && { color: theme.border }
                        , { color: theme.blue }]}>
                        up
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.orderNum, { color: theme.textSecondary }]}>{index + 1}</Text>
                    <TouchableOpacity onPress={() => handleMoveModule(index, 'down')}
                      disabled={index === modules.length - 1 || module.fixed}>
                      <Text style={[styles.orderBtn,
                        (index === modules.length - 1 || module.fixed) && { color: theme.border },
                        { color: theme.blue }]}>
                        dn
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.moduleInfo}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{module.name}</Text>
                    {module.fixed && (
                      <Text style={[styles.fixedLabel, { color: theme.blue }]}>
                        Fixed — cannot disable
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={module.enabled}
                    onValueChange={() => handleModuleToggle(module.module_key, module.enabled, module.fixed)}
                    trackColor={{ false: theme.border, true: '#93C5FD' }}
                    thumbColor={module.enabled ? theme.blue : theme.textMuted}
                    disabled={module.fixed}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SCANS TAB */}
        {tab === 'scans' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              All Scans ({allScans.length})
            </Text>
            {allScans.map(scan => (
              <View key={scan.id} style={[styles.card, {
                backgroundColor: theme.card,
                borderWidth: 1, borderColor: theme.border,
              }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {scan.target_url}
                </Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  User: {scan.user_id.slice(0, 12)}...
                </Text>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                    {new Date(scan.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.riskText, {
                    color: scan.total_risk_score >= 7 ? '#DC2626' : '#16A34A',
                  }]}>
                    Risk: {scan.total_risk_score?.toFixed(1)}/10
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.deleteScanBtn, { backgroundColor: theme.dangerBg }]}
                  onPress={() => handleDeleteScan(scan.id)}>
                  <Text style={[styles.deleteScanBtnText, { color: theme.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* LOGS TAB */}
        {tab === 'logs' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Activity Logs ({logs.length})
            </Text>
            {logs.length === 0 && (
              <View style={styles.emptyLogs}>
                <Text style={[styles.emptyLogsText, { color: theme.textMuted }]}>
                  No activity logs yet
                </Text>
              </View>
            )}
            {logs.map((log, index) => (
              <View key={index} style={[styles.logCard, {
                backgroundColor: theme.card,
                borderLeftColor: theme.blue,
                borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
              }]}>
                <View style={styles.logHeader}>
                  <Text style={[styles.logAction, { color: theme.blue }]}>
                    {log.action.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.logTime, { color: theme.textMuted }]}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                </View>
                {log.target_id && (
                  <Text style={[styles.logDetail, { color: theme.textSecondary }]}>
                    Target: {log.target_id.slice(0, 12)}...
                  </Text>
                )}
                {log.new_role && (
                  <Text style={[styles.logDetail, { color: theme.textSecondary }]}>
                    New role: {log.new_role}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { maxHeight: 48, borderBottomWidth: 1 },
  tab: { paddingHorizontal: 20, paddingVertical: 14 },
  tabText: { fontSize: 14, fontWeight: '500' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  statCard: { width: '30%', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  chartCard: { borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140, elevation: 2, marginBottom: 20 },
  chartBar: { alignItems: 'center', flex: 1 },
  chartCount: { fontSize: 11, marginBottom: 4 },
  bar: { width: 24, borderRadius: 4, minHeight: 4 },
  chartDate: { fontSize: 10, marginTop: 4 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 12, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  limitRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  limitInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14 },
  limitSaveBtn: { backgroundColor: '#16A34A', padding: 8, borderRadius: 8, paddingHorizontal: 12 },
  limitSaveBtnText: { color: '#fff', fontWeight: 'bold' },
  limitCancelBtn: { padding: 8, borderRadius: 8, paddingHorizontal: 12 },
  limitCancelBtnText: { fontWeight: 'bold' },
  modulesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  restoreBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  restoreBtnText: { fontSize: 13, fontWeight: '600' },
  hintText: { fontSize: 12, marginBottom: 12 },
  moduleRow: { flexDirection: 'row', alignItems: 'center' },
  orderButtons: { alignItems: 'center', marginRight: 10 },
  orderBtn: { fontSize: 11, fontWeight: 'bold', padding: 2 },
  orderNum: { fontSize: 12, marginVertical: 2 },
  moduleInfo: { flex: 1 },
  fixedLabel: { fontSize: 11, marginTop: 2 },
  deleteScanBtn: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  deleteScanBtnText: { fontSize: 12 },
  riskText: { fontSize: 13, fontWeight: 'bold' },
  logCard: { borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, borderLeftWidth: 3 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logAction: { fontSize: 13, fontWeight: 'bold' },
  logTime: { fontSize: 11 },
  logDetail: { fontSize: 12 },
  emptyLogs: { padding: 40, alignItems: 'center' },
  emptyLogsText: { fontSize: 15 },
});