import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export default function ScanProgressScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { addNotification } = useNotifications();
  const { scanId } = route.params;
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const notifiedRef = useRef(false);

  // Cancel state
  const [cancelling, setCancelling] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchScan();
    intervalRef.current = setInterval(fetchScan, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchScan = async () => {
    try {
      const data = await api.getScan(scanId);
      setScan(data);
      setLoading(false);

      if (data.status === 'completed' || data.status === 'failed' ||
          data.status === 'cancelled') {
        clearInterval(intervalRef.current);

        if (!notifiedRef.current) {
          notifiedRef.current = true;
          if (data.status === 'completed') {
            addNotification(
              'Scan Complete',
              `Scan of ${data.target_url} finished. Risk score: ${data.total_risk_score?.toFixed(1)}/10`,
              'success', scanId
            );
          } else if (data.status === 'cancelled') {
            addNotification(
              'Scan Cancelled',
              `Scan of ${data.target_url} was cancelled. Partial results saved.`,
              'info', scanId
            );
          } else {
            addNotification(
              'Scan Failed',
              `Scan of ${data.target_url} encountered an error.`,
              'error', scanId
            );
          }
        }
      }
    } catch (e) { setLoading(false); }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Stop Scan',
      `Stop the scan of "${scan?.target_url}"? Partial results will be saved.`,
      [
        { text: 'Keep Running', style: 'cancel' },
        {
          text: 'Stop Scan', style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await api.cancelScan(scanId);
              if (res.message) {
                addNotification(
                  'Scan Stopping',
                  'Cancellation requested. Finishing current module...',
                  'info', scanId
                );
              } else {
                Alert.alert('Error', res.detail || 'Could not cancel scan');
              }
            } catch (e) {
              Alert.alert('Error', 'Cannot connect to server');
            }
            setCancelling(false);
          }
        }
      ]
    );
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Scan',
      `Are you sure you want to delete the scan of "${scan?.target_url}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => setShowDeleteModal(true)
        }
      ]
    );
  };

  const handleDeleteConfirm = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }
    setDeleting(true);
    try {
      const res = await api.deleteScanVerified(scanId, deletePassword);
      if (res.message) {
        setShowDeleteModal(false);
        navigation.goBack();
      } else {
        setDeleteError(res.detail || 'Incorrect password');
      }
    } catch (e) {
      setDeleteError('Cannot connect to server');
    }
    setDeleting(false);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#DC2626', high: '#EA580C',
      medium: '#D97706', low: '#16A34A', info: '#2563EB'
    };
    return colors[severity?.toLowerCase()] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return 'OK';
    if (status === 'running') return '...';
    if (status === 'failed') return 'X';
    if (status === 'cancelled') return 'STOP';
    return 'O';
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return '#16A34A';
    if (status === 'running') return '#1D6FEB';
    if (status === 'failed') return '#DC2626';
    if (status === 'cancelled') return '#D97706';
    return '#9CA3AF';
  };

  const getRiskColor = (score) => {
    if (score >= 8) return '#DC2626';
    if (score >= 6) return '#EA580C';
    if (score >= 4) return '#D97706';
    return '#16A34A';
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.blue} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading scan...</Text>
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.text }}>Scan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Header Card */}
      <View style={[styles.header, {
        backgroundColor: theme.card,
        borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
      }]}>
        <Text style={[styles.targetUrl, { color: theme.text }]} numberOfLines={2}>
          {scan.target_url}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(scan.status) }]}>
            <Text style={styles.statusBadgeText}>{scan.status.toUpperCase()}</Text>
          </View>
          {scan.status === 'running' && (
            <ActivityIndicator size="small" color={theme.blue} style={{ marginLeft: 8 }} />
          )}
        </View>
        <Text style={[styles.riskScore, { color: getRiskColor(scan.total_risk_score) }]}>
          Risk Score: {scan.total_risk_score?.toFixed(1) || '0.0'} / 10.0
        </Text>
        {scan.status === 'cancelled' && (
          <View style={[styles.cancelledBanner, { backgroundColor: '#FEF3C7' }]}>
            <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '600' }}>
              Scan was cancelled — partial results shown below
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        {/* View Report — completed or cancelled */}
        {(scan.status === 'completed' || scan.status === 'cancelled') && (
          <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]}
            onPress={() => navigation.navigate('Report', { scanId })}>
            <Text style={styles.actionBtnText}>View Report</Text>
          </TouchableOpacity>
        )}

        {/* Stop Scan — only when running */}
        {scan.status === 'running' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.stopBtn, cancelling && styles.btnDisabled]}
            onPress={handleCancel}
            disabled={cancelling}>
            {cancelling
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.actionBtnText}>Stop Scan</Text>
            }
          </TouchableOpacity>
        )}

        {/* Delete — always visible */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDeletePress}>
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Module Results</Text>

      {/* Module Cards */}
      {scan.steps && scan.steps.map((step, index) => (
        <View key={index} style={[styles.moduleCard, {
          backgroundColor: theme.card,
          borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
        }]}>
          <View style={styles.moduleHeader}>
            <Text style={[styles.moduleIcon, { color: getStatusColor(step.status) }]}>
              {getStatusIcon(step.status)}
            </Text>
            <Text style={[styles.moduleName, { color: theme.text }]}>{step.module_name}</Text>
            {step.severity && step.severity !== 'info' && (
              <View style={[styles.severityBadge,
                { backgroundColor: getSeverityColor(step.severity) + '30' }]}>
                <Text style={[styles.severityText, { color: getSeverityColor(step.severity) }]}>
                  {step.severity.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {step.status === 'running' && (
            <View style={styles.runningRow}>
              <ActivityIndicator size="small" color={theme.blue} />
              <Text style={[styles.runningText, { color: theme.blue }]}>Scanning...</Text>
            </View>
          )}

          {step.evidence && step.status === 'completed' && (
            <View style={[styles.evidenceBox, {
              backgroundColor: theme.dark ? '#422006' : '#FEF3C7',
            }]}>
              <Text style={[styles.evidenceLabel, { color: theme.dark ? '#FCD34D' : '#92400E' }]}>
                Evidence:
              </Text>
              <Text style={[styles.evidenceText, { color: theme.dark ? '#FDE68A' : '#78350F' }]}>
                {step.evidence}
              </Text>
            </View>
          )}

          {step.remediation && (
            <View style={[styles.remediationBox, {
              backgroundColor: theme.dark ? '#052E16' : '#DCFCE7',
            }]}>
              <Text style={[styles.remediationLabel, { color: theme.dark ? '#4ADE80' : '#166534' }]}>
                Fix:
              </Text>
              <Text style={[styles.remediationText, { color: theme.dark ? '#86EFAC' : '#14532D' }]}>
                {step.remediation}
              </Text>
            </View>
          )}

          {step.vulnerabilities && step.vulnerabilities.length > 0 && (
            <Text style={styles.vulnCount}>
              {step.vulnerabilities.length} vulnerability found
            </Text>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />

      {/* Delete Password Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {
            backgroundColor: theme.card,
            borderColor: '#DC2626', borderWidth: 1,
          }]}>
            <Text style={[styles.modalTitle, { color: '#DC2626' }]}>Confirm Delete</Text>
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Enter your password to permanently delete this scan.
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
                backgroundColor: theme.input,
                borderColor: theme.inputBorder,
                color: theme.text,
              }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textMuted}
              value={deletePassword}
              onChangeText={(t) => { setDeletePassword(t); setDeleteError(''); }}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, {
                  backgroundColor: theme.bg,
                  borderWidth: 1, borderColor: theme.border,
                }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.deleteBtn, deleting && styles.btnDisabled]}
                onPress={handleDeleteConfirm}
                disabled={deleting}>
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnText}>Delete</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12 },
  header: { margin: 16, borderRadius: 16, padding: 20, elevation: 3 },
  targetUrl: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  riskScore: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  cancelledBanner: {
    marginTop: 12, padding: 10, borderRadius: 8, alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row', marginHorizontal: 16,
    marginBottom: 12, marginTop: 0,
  },
  actionBtn: {
    flex: 1, padding: 13, borderRadius: 12,
    alignItems: 'center', marginHorizontal: 4, elevation: 2,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  reportBtn: { backgroundColor: '#16A34A' },
  stopBtn: { backgroundColor: '#D97706' },
  deleteBtn: { backgroundColor: '#DC2626' },
  btnDisabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 16, marginBottom: 8 },
  moduleCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, elevation: 2 },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  moduleIcon: { fontSize: 14, fontWeight: 'bold', marginRight: 8, width: 28 },
  moduleName: { fontSize: 15, fontWeight: '600', flex: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: 'bold' },
  runningRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 32 },
  runningText: { marginLeft: 8, fontSize: 13 },
  evidenceBox: { borderRadius: 8, padding: 10, marginTop: 8 },
  evidenceLabel: { fontWeight: 'bold', fontSize: 12 },
  evidenceText: { fontSize: 12, marginTop: 2 },
  remediationBox: { borderRadius: 8, padding: 10, marginTop: 6 },
  remediationLabel: { fontWeight: 'bold', fontSize: 12 },
  remediationText: { fontSize: 12, marginTop: 2 },
  vulnCount: { color: '#DC2626', fontSize: 12, fontWeight: 'bold', marginTop: 6, paddingLeft: 32 },
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