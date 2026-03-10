import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  TextInput, Modal
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const TIMEFRAMES = [
  { key: '1hour', label: 'Every Hour', icon: '1H' },
  { key: '6hours', label: 'Every 6 Hours', icon: '6H' },
  { key: '12hours', label: 'Every 12 Hours', icon: '12H' },
  { key: 'daily', label: 'Daily', icon: '1D' },
  { key: 'weekly', label: 'Weekly', icon: '7D' },
  { key: 'monthly', label: 'Monthly', icon: '30D' },
];

export default function ScheduleScreen({ navigation }) {
  const { theme } = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New schedule form
  const [targetUrl, setTargetUrl] = useState('');
  const [timeframe, setTimeframe] = useState('daily');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadSchedules();
    const unsubscribe = navigation.addListener('focus', loadSchedules);
    return unsubscribe;
  }, [navigation]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await api.getSchedules();
      if (Array.isArray(data)) setSchedules(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load schedules');
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setFormError('');
    if (!targetUrl) { setFormError('Target URL is required'); return; }
    if (!targetUrl.startsWith('http')) {
      setFormError('URL must start with http:// or https://');
      return;
    }
    setCreating(true);
    try {
      const data = await api.createSchedule(targetUrl, timeframe, username, password);
      if (data.id) {
        setShowModal(false);
        setTargetUrl('');
        setUsername('');
        setPassword('');
        setTimeframe('daily');
        await loadSchedules();
      } else {
        setFormError(data.detail || 'Failed to create schedule');
      }
    } catch (e) {
      setFormError('Cannot connect to server');
    }
    setCreating(false);
  };

  const handleToggle = async (schedule) => {
    try {
      await api.toggleSchedule(schedule.id, !schedule.is_active);
      setSchedules(prev => prev.map(s =>
        s.id === schedule.id ? { ...s, is_active: !s.is_active } : s
      ));
    } catch (e) {
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const handleDelete = (schedule) => {
    Alert.alert(
      'Delete Schedule',
      `Are you sure you want to delete the schedule for "${schedule.target_url}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteSchedule(schedule.id);
              setSchedules(prev => prev.filter(s => s.id !== schedule.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          }
        }
      ]
    );
  };

  const formatNextRun = (nextRun) => {
    if (!nextRun) return 'Not scheduled';
    const d = new Date(nextRun);
    const now = new Date();
    const diffMs = d - now;
    if (diffMs < 0) return 'Running soon';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `In ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `In ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `In ${diffDays}d`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.blue} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView>
        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.blueBg, borderColor: theme.blueBorder }]}>
          <Text style={[styles.infoTitle, { color: theme.blue }]}>Automatic Scanning</Text>
          <Text style={[styles.infoText, { color: theme.text }]}>
            Schedule scans to run automatically at your chosen interval.
            Results appear in your scan list when complete.
          </Text>
        </View>

        {/* Schedules List */}
        {schedules.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No schedules yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
              Tap the button below to create your first schedule
            </Text>
          </View>
        ) : (
          schedules.map(schedule => (
            <View key={schedule.id} style={[styles.card, {
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: schedule.is_active ? theme.blue : theme.border,
              opacity: schedule.is_active ? 1 : 0.7,
            }]}>
              {/* URL + timeframe */}
              <View style={styles.cardHeader}>
                <View style={[styles.timeframeBadge, { backgroundColor: theme.blueBg }]}>
                  <Text style={[styles.timeframeBadgeText, { color: theme.blue }]}>
                    {TIMEFRAMES.find(t => t.key === schedule.timeframe)?.icon || schedule.timeframe}
                  </Text>
                </View>
                <Text style={[styles.cardUrl, { color: theme.text }]} numberOfLines={1}>
                  {schedule.target_url}
                </Text>
                <View style={[styles.statusDot, {
                  backgroundColor: schedule.is_active ? '#16A34A' : '#9CA3AF',
                }]} />
              </View>

              {/* Stats row */}
              <View style={styles.cardStats}>
                <Text style={[styles.cardStat, { color: theme.textSecondary }]}>
                  {schedule.timeframe_label}
                </Text>
                <Text style={[styles.cardStat, { color: theme.textMuted }]}>
                  Runs: {schedule.run_count}
                </Text>
                <Text style={[styles.cardStat, {
                  color: schedule.is_active ? theme.blue : theme.textMuted,
                }]}>
                  Next: {schedule.is_active ? formatNextRun(schedule.next_run) : 'Paused'}
                </Text>
              </View>

              {schedule.last_run && (
                <Text style={[styles.lastRun, { color: theme.textMuted }]}>
                  Last run: {new Date(schedule.last_run).toLocaleString()}
                </Text>
              )}

              {/* Action buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, {
                    backgroundColor: schedule.is_active ? '#FEF3C7' : '#DCFCE7',
                    borderWidth: 1,
                    borderColor: schedule.is_active ? '#D97706' : '#16A34A',
                  }]}
                  onPress={() => handleToggle(schedule)}>
                  <Text style={{
                    color: schedule.is_active ? '#D97706' : '#16A34A',
                    fontWeight: '600', fontSize: 13,
                  }}>
                    {schedule.is_active ? 'Pause' : 'Resume'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, {
                    backgroundColor: theme.dangerBg,
                    borderWidth: 1, borderColor: theme.dangerBorder,
                  }]}
                  onPress={() => handleDelete(schedule)}>
                  <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 13 }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — Add Schedule */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.blue }]}
        onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+ New Schedule</Text>
      </TouchableOpacity>

      {/* Create Schedule Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {
            backgroundColor: theme.card,
            borderColor: theme.border, borderWidth: 1,
          }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              New Scheduled Scan
            </Text>

            {formError.length > 0 && (
              <View style={[styles.errorBox, {
                backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder,
              }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>{formError}</Text>
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>Target URL *</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.input,
                borderColor: theme.inputBorder, color: theme.text,
              }]}
              placeholder="https://example.com"
              placeholderTextColor={theme.textMuted}
              value={targetUrl}
              onChangeText={(t) => { setTargetUrl(t); setFormError(''); }}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: theme.text }]}>Scan Interval</Text>
            <View style={styles.timeframeGrid}>
              {TIMEFRAMES.map(tf => (
                <TouchableOpacity
                  key={tf.key}
                  style={[styles.timeframeBtn, {
                    backgroundColor: timeframe === tf.key ? theme.blue : theme.bg,
                    borderColor: timeframe === tf.key ? theme.blue : theme.border,
                    borderWidth: 1,
                  }]}
                  onPress={() => setTimeframe(tf.key)}>
                  <Text style={[styles.timeframeBtnIcon, {
                    color: timeframe === tf.key ? '#fff' : theme.text,
                  }]}>{tf.icon}</Text>
                  <Text style={[styles.timeframeBtnLabel, {
                    color: timeframe === tf.key ? '#fff' : theme.textSecondary,
                  }]}>{tf.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text }]}>
              Login Credentials (Optional)
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.input,
                borderColor: theme.inputBorder, color: theme.text,
              }]}
              placeholder="Username"
              placeholderTextColor={theme.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.input,
                borderColor: theme.inputBorder, color: theme.text,
              }]}
              placeholder="Password"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, {
                  backgroundColor: theme.bg,
                  borderWidth: 1, borderColor: theme.border,
                }]}
                onPress={() => {
                  setShowModal(false);
                  setFormError('');
                  setTargetUrl('');
                  setUsername('');
                  setPassword('');
                  setTimeframe('daily');
                }}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.blue },
                  creating && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={creating}>
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnText}>Create</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoBox: {
    margin: 16, borderRadius: 12, padding: 14,
    borderWidth: 1, borderLeftWidth: 4,
  },
  infoTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  infoText: { fontSize: 13, lineHeight: 20 },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  card: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 14, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timeframeBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, marginRight: 8,
  },
  timeframeBadgeText: { fontSize: 11, fontWeight: 'bold' },
  cardUrl: { flex: 1, fontSize: 14, fontWeight: '600' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardStat: { fontSize: 12 },
  lastRun: { fontSize: 11, marginBottom: 8 },
  cardActions: { flexDirection: 'row', marginTop: 4 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8, marginRight: 8,
  },
  fab: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    padding: 16, borderRadius: 12, alignItems: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10,
    padding: 12, fontSize: 14, marginBottom: 12,
  },
timeframeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16,
  },
  timeframeBtn: {
    width: '31%', marginRight: '2%', marginBottom: 8, borderRadius: 10,
    padding: 10, alignItems: 'center',
  },
  timeframeBtnIcon: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  timeframeBtnLabel: { fontSize: 10, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
  modalBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    alignItems: 'center', marginHorizontal: 4,
  },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13 },
});