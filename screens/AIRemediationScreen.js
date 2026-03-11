import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const SEV_COLORS = {
  critical: '#DC2626', high: '#EA580C',
  medium: '#D97706', low: '#16A34A', info: '#2563EB'
};
const EFFORT_COLORS = { Low: '#4ADE80', Medium: '#FBBF24', High: '#F87171' };

export default function AIRemediationScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { scanId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const url = `https://vulnassess-backend.onrender.com/api/reports/${scanId}/ai-remediation/pdf`;
      await Linking.openURL(`${url}?token=${token}`);
    } catch {
      Alert.alert('Error', 'Could not open PDF download.');
    }
    setPdfLoading(false);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAIRemediation(scanId);
      if (res.detail) setError(res.detail);
      else setData(res);
    } catch {
      setError('Failed to load AI remediation.');
    }
    setLoading(false);
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <Text style={{ fontSize: 36, marginBottom: 16 }}>🤖</Text>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={[s.loadTitle, { color: theme.text }]}>Analysing with AI…</Text>
        <Text style={[s.loadSub, { color: theme.textSecondary }]}>This may take 15–30 seconds</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
        <Text style={[s.errorText, { color: theme.danger }]}>{error}</Text>
        <TouchableOpacity style={[s.retryBtn, { backgroundColor: theme.blue }]} onPress={load}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.bg }]}>

      {/* Download PDF Button */}
      <TouchableOpacity
        style={[s.downloadBtn, pdfLoading && { opacity: 0.6 }]}
        onPress={handleDownloadPDF}
        disabled={pdfLoading}
      >
        <Text style={s.downloadBtnText}>
          {pdfLoading ? '◌  Generating PDF…' : '↓  Download AI Report PDF'}
        </Text>
      </TouchableOpacity>

      {/* Executive Summary */}
      {data?.executive_summary && (
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.dark ? 1 : 0 }]}>
          <Text style={[s.sectionLabel, { color: '#8B5CF6' }]}>EXECUTIVE SUMMARY</Text>
          <Text style={[s.bodyText, { color: theme.text }]}>{data.executive_summary}</Text>
        </View>
      )}

      {/* Critical Action */}
      {data?.critical_action && (
        <View style={s.criticalBox}>
          <Text style={{ fontSize: 20, marginRight: 10 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.criticalLabel}>IMMEDIATE ACTION</Text>
            <Text style={s.criticalText}>{data.critical_action}</Text>
          </View>
        </View>
      )}

      {/* Remediations */}
      {(data?.remediations || []).map((r) => {
        const open = expanded[r.id];
        const sevColor = SEV_COLORS[r.severity?.toLowerCase()] || '#6B7280';
        const effortColor = EFFORT_COLORS[r.estimated_effort] || '#6B7280';

        return (
          <View key={r.id} style={[s.remCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.dark ? 1 : 0 }]}>
            <TouchableOpacity onPress={() => toggle(r.id)} style={s.remHeader}>
              <View style={s.remHeaderLeft}>
                <View style={[s.priorityBadge, { backgroundColor: r.priority === 1 ? '#DC2626' : r.priority === 2 ? '#EA580C' : r.priority <= 3 ? '#D97706' : '#6B7280' }]}>
                  <Text style={s.priorityText}>P{r.priority}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.vulnType, { color: theme.text }]} numberOfLines={2}>{r.vuln_type}</Text>
                  <View style={s.badgeRow}>
                    <View style={[s.badge, { backgroundColor: sevColor + '25', borderColor: sevColor + '60' }]}>
                      <Text style={[s.badgeText, { color: sevColor }]}>{(r.severity || 'INFO').toUpperCase()}</Text>
                    </View>
                    {r.estimated_effort && (
                      <View style={[s.badge, { backgroundColor: effortColor + '20', borderColor: effortColor + '50' }]}>
                        <Text style={[s.badgeText, { color: effortColor }]}>{r.estimated_effort}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Text style={[s.chevron, { color: theme.textSecondary }]}>{open ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {open && (
              <View style={[s.remBody, { borderTopColor: theme.border }]}>

                {r.summary && (
                  <Text style={[s.bodyText, { color: theme.textSecondary, marginBottom: 14 }]}>
                    {r.summary}
                  </Text>
                )}

                {r.fix_steps?.length > 0 && (
                  <>
                    <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>FIX STEPS</Text>
                    {r.fix_steps.map((step, i) => (
                      <View key={i} style={s.stepRow}>
                        <View style={[s.stepNum, { backgroundColor: theme.blue }]}>
                          <Text style={s.stepNumText}>{i + 1}</Text>
                        </View>
                        <Text style={[s.stepText, { color: theme.text }]}>{step}</Text>
                      </View>
                    ))}
                  </>
                )}

                {r.code_example && (
                  <>
                    <Text style={[s.sectionLabel, { color: theme.textSecondary, marginTop: 14 }]}>CODE EXAMPLE</Text>
                    <View style={s.codeBlock}>
                      <Text style={s.codeText}>{r.code_example}</Text>
                    </View>
                  </>
                )}

                {r.references?.length > 0 && (
                  <>
                    <Text style={[s.sectionLabel, { color: theme.textSecondary, marginTop: 14 }]}>REFERENCES</Text>
                    {r.references.map((ref, i) => (
                      <TouchableOpacity key={i} onPress={() => Linking.openURL(ref)}>
                        <Text style={[s.refLink, { color: theme.blue }]} numberOfLines={1}>{ref}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {r.cve_id && (
                  <Text style={[s.cveText, { color: theme.textMuted }]}>{r.cve_id}</Text>
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  downloadBtn: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#4C1D95',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  downloadBtnText: {
    color: '#DDD6FE',
    fontWeight: '700',
    fontSize: 14,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadTitle: { fontSize: 16, fontWeight: '700', marginTop: 16 },
  loadSub: { fontSize: 13, marginTop: 6 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { margin: 16, marginBottom: 0, borderRadius: 14, padding: 16, elevation: 2 },
  criticalBox: { flexDirection: 'row', margin: 16, marginBottom: 0, backgroundColor: '#450A0A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#991B1B' },
  criticalLabel: { fontSize: 11, fontWeight: '800', color: '#FCA5A5', letterSpacing: 1, marginBottom: 6 },
  criticalText: { fontSize: 13, color: '#FEE2E2', lineHeight: 19 },
  remCard: { margin: 16, marginBottom: 0, borderRadius: 14, elevation: 2, overflow: 'hidden' },
  remHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  priorityBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  vulnType: { fontSize: 14, fontWeight: '700', marginBottom: 5 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 12, marginLeft: 8 },
  remBody: { padding: 14, borderTopWidth: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  bodyText: { fontSize: 14, lineHeight: 20 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19 },
  codeBlock: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155' },
  codeText: { fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0', lineHeight: 18 },
  refLink: { fontSize: 12, marginBottom: 6, textDecorationLine: 'underline' },
  cveText: { fontSize: 11, marginTop: 10, fontStyle: 'italic' },
});