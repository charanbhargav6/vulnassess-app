import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const BASE_URL = 'http://localhost:8000/api';

export default function ReportScreen({ route }) {
  const { theme } = useTheme();
  const { scanId } = route.params;
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { fetchScan(); }, []);

  const fetchScan = async () => {
    try {
      const data = await api.getScan(scanId);
      setScan(data);
    } catch (e) { Alert.alert('Error', 'Failed to load report'); }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await WebBrowser.openBrowserAsync(`${BASE_URL}/reports/${scanId}/pdf?token=${token}`);
    } catch (e) { Alert.alert('Error', 'Could not open PDF'); }
    setDownloading(false);
  };

  const getSeverityColor = (severity) => {
    const colors = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#16A34A', info: '#2563EB' };
    return colors[severity?.toLowerCase()] || '#6B7280';
  };

  const getSeverityCounts = () => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    scan?.steps?.forEach(step => {
      const sev = step.severity?.toLowerCase();
      if (sev && counts[sev] !== undefined && step.vulnerabilities?.length > 0) counts[sev]++;
    });
    return counts;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.blue} />
      </View>
    );
  }

  const counts = getSeverityCounts();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Text style={styles.headerTitle}>Security Report</Text>
        <Text style={styles.headerUrl} numberOfLines={2}>{scan?.target_url}</Text>
        <Text style={styles.headerDate}>
          {scan?.created_at ? new Date(scan.created_at).toLocaleString() : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]}
        onPress={handleDownloadPDF} disabled={downloading}>
        {downloading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.downloadBtnText}>Download PDF Report</Text>
        }
      </TouchableOpacity>

      {/* Risk Score */}
      <View style={[styles.scoreCard, {
        backgroundColor: theme.card, borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
      }]}>
        <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Total Risk Score</Text>
        <Text style={[styles.scoreValue, {
          color: scan?.total_risk_score >= 7 ? '#DC2626' :
            scan?.total_risk_score >= 4 ? '#D97706' : '#16A34A'
        }]}>
          {scan?.total_risk_score?.toFixed(1) || '0.0'} / 10.0
        </Text>
      </View>

      {/* Severity Summary */}
      <View style={styles.summaryRow}>
        {Object.entries(counts).map(([sev, count]) => (
          <View key={sev} style={[styles.summaryCard, {
            backgroundColor: theme.card,
            borderTopWidth: 3, borderTopColor: getSeverityColor(sev),
            borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
          }]}>
            <Text style={[styles.summaryCount, { color: getSeverityColor(sev) }]}>{count}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{sev.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Detailed Findings</Text>

      {scan?.steps?.map((step, index) => (
        step.vulnerabilities?.length > 0 && (
          <View key={index} style={[styles.findingCard, {
            backgroundColor: theme.card,
            borderLeftColor: getSeverityColor(step.severity), borderLeftWidth: 4,
            borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
          }]}>
            <View style={styles.findingHeader}>
              <Text style={[styles.findingName, { color: theme.text }]}>{step.module_name}</Text>
              <Text style={[styles.findingSeverity, { color: getSeverityColor(step.severity) }]}>
                {step.severity?.toUpperCase()}
              </Text>
            </View>
            {step.evidence && (
              <View style={[styles.evidenceBox, {
                backgroundColor: theme.dark ? '#422006' : '#FEF9C3',
              }]}>
                <Text style={[styles.boxLabel, { color: theme.dark ? '#FCD34D' : '#92400E' }]}>Evidence</Text>
                <Text style={[styles.boxText, { color: theme.dark ? '#FDE68A' : '#78350F' }]}>{step.evidence}</Text>
              </View>
            )}
            {step.remediation && (
              <View style={[styles.remediationBox, {
                backgroundColor: theme.dark ? '#052E16' : '#DCFCE7',
              }]}>
                <Text style={[styles.boxLabel, { color: theme.dark ? '#4ADE80' : '#166534' }]}>Remediation</Text>
                <Text style={[styles.boxText, { color: theme.dark ? '#86EFAC' : '#14532D' }]}>{step.remediation}</Text>
              </View>
            )}
            <Text style={styles.vulnCount}>{step.vulnerabilities.length} issue(s) found</Text>
          </View>
        )
      ))}

      {scan?.steps?.every(s => !s.vulnerabilities?.length) && (
        <View style={[styles.cleanCard, { backgroundColor: theme.successBg }]}>
          <Text style={[styles.cleanText, { color: theme.success }]}>No vulnerabilities found!</Text>
          <Text style={[styles.cleanSubtext, { color: theme.textSecondary }]}>
            The target passed all security checks.
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Generated by VulnAssess</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 40 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  headerUrl: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 },
  headerDate: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  downloadBtn: { backgroundColor: '#16A34A', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  downloadBtnDisabled: { backgroundColor: '#86EFAC' },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scoreCard: { margin: 16, marginTop: 0, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 3 },
  scoreLabel: { fontSize: 14, marginBottom: 8 },
  scoreValue: { fontSize: 40, fontWeight: 'bold' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center', elevation: 2, marginHorizontal: 2 },
  summaryCount: { fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { fontSize: 9, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 16, marginBottom: 10 },
  findingCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, elevation: 2 },
  findingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  findingName: { fontSize: 15, fontWeight: 'bold', flex: 1 },
  findingSeverity: { fontSize: 12, fontWeight: 'bold' },
  evidenceBox: { borderRadius: 8, padding: 10, marginBottom: 8 },
  remediationBox: { borderRadius: 8, padding: 10, marginBottom: 8 },
  boxLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  boxText: { fontSize: 13, lineHeight: 18 },
  vulnCount: { color: '#DC2626', fontSize: 12, fontWeight: 'bold' },
  cleanCard: { margin: 16, borderRadius: 16, padding: 30, alignItems: 'center' },
  cleanText: { fontSize: 18, fontWeight: 'bold' },
  cleanSubtext: { marginTop: 8 },
  footer: { padding: 24, alignItems: 'center' },
  footerText: { fontSize: 12 },
});