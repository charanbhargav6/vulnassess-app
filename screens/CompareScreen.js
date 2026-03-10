import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const SeverityBadge = ({ severity }) => {
  const colors = { Critical: '#DC2626', High: '#EA580C', Medium: '#D97706', Low: '#16A34A', Info: '#6B7280' };
  return (
    <View style={[styles.sevBadge, { backgroundColor: colors[severity] || '#6B7280' }]}>
      <Text style={styles.sevBadgeText}>{severity}</Text>
    </View>
  );
};

export default function CompareScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { scan1Id, scan2Id } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadComparison(); }, []);

  const loadComparison = async () => {
    try {
      const result = await api.compareScans(scan1Id, scan2Id);
      if (result.detail) { Alert.alert('Error', result.detail); navigation.goBack(); return; }
      setData(result);
    } catch (e) { Alert.alert('Error', 'Failed to load comparison'); navigation.goBack(); }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.blue} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Comparing scans...</Text>
      </View>
    );
  }

  const { scan1, scan2, summary } = data;
  const scoreDiff = summary.score_diff;
  const improved = summary.improved;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'findings', label: 'All' },
    { key: 'fixed', label: `Fixed (${summary.fixed_findings_count})` },
    { key: 'new', label: `New (${summary.new_findings_count})` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key}
            style={[styles.tab, activeTab === t.key && { borderBottomWidth: 2, borderBottomColor: theme.blue }]}
            onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.tabText, { color: theme.textSecondary },
              activeTab === t.key && { color: theme.blue, fontWeight: '700' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll}>

        {activeTab === 'overview' && (
          <View>
            {/* Score Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Risk Score Comparison</Text>
              <View style={styles.scoreRow}>
                {[scan1, scan2].map((s, i) => (
                  <View key={i} style={styles.scoreBox}>
                    <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Scan {i + 1}</Text>
                    <Text style={[styles.scoreDate, { color: theme.textMuted }]}>
                      {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                    <Text style={[styles.scoreBig, { color: s.severity_color }]}>
                      {s.total_risk_score.toFixed(1)}
                    </Text>
                    <Text style={[styles.sevLabel, { color: s.severity_color }]}>{s.severity_label}</Text>
                  </View>
                ))}
                {/* diff in middle */}
                <View style={[styles.scoreBox, { position: 'absolute', left: '37%' }]}>
                  <Text style={[styles.diffArrow, { color: theme.textSecondary }]}>
                    {improved ? 'v' : scoreDiff === 0 ? '=' : '^'}
                  </Text>
                  <Text style={[styles.diffText, {
                    color: improved ? '#16A34A' : scoreDiff === 0 ? theme.textSecondary : '#DC2626'
                  }]}>
                    {scoreDiff === 0 ? 'No change' : `${improved ? '' : '+'}${scoreDiff.toFixed(1)}`}
                  </Text>
                  <Text style={[styles.diffLabel, { color: theme.textMuted }]}>
                    {improved ? 'Improved' : scoreDiff === 0 ? 'Same' : 'Worsened'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary Boxes */}
            <View style={styles.summaryRow}>
              {[
                { num: summary.fixed_findings_count, label: 'Fixed', bg: theme.successBg, border: theme.successBorder, color: theme.success },
                { num: summary.new_findings_count, label: 'New Issues', bg: theme.dangerBg, border: theme.dangerBorder, color: theme.danger },
                { num: scan2.total_findings, label: 'Total Now', bg: theme.blueBg, border: theme.blueBorder, color: theme.blue },
              ].map((b, i) => (
                <View key={i} style={[styles.summaryBox, { backgroundColor: b.bg, borderColor: b.border }]}>
                  <Text style={[styles.summaryNum, { color: b.color }]}>{b.num}</Text>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{b.label}</Text>
                </View>
              ))}
            </View>

            {/* Severity Breakdown */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Severity Breakdown</Text>
              {['Critical', 'High', 'Medium', 'Low'].map(sev => {
                const colors = { Critical: '#DC2626', High: '#EA580C', Medium: '#D97706', Low: '#16A34A' };
                const c1 = scan1.severity_counts[sev] || 0;
                const c2 = scan2.severity_counts[sev] || 0;
                const diff = c2 - c1;
                return (
                  <View key={sev} style={[styles.sevRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.sevName, { color: colors[sev] }]}>{sev}</Text>
                    <Text style={[styles.sevCount, { color: theme.text }]}>{c1}</Text>
                    <Text style={[styles.sevArrow, { color: theme.textMuted }]}>→</Text>
                    <Text style={[styles.sevCount, { color: theme.text }]}>{c2}</Text>
                    <Text style={[diff !== 0 ? styles.sevDiff : styles.sevSame,
                      { color: diff < 0 ? '#16A34A' : diff > 0 ? '#DC2626' : theme.textMuted }]}>
                      {diff > 0 ? `+${diff}` : diff === 0 ? '-' : diff}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Scan Details */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Scan Details</Text>
              {[
                ['Scan 1 Target:', scan1.target_url],
                ['Scan 2 Target:', scan2.target_url],
                ['Scan 1 Date:', new Date(scan1.created_at).toLocaleString()],
                ['Scan 2 Date:', new Date(scan2.created_at).toLocaleString()],
              ].map(([label, value], i) => (
                <View key={i} style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'findings' && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              All Findings — Scan 2 ({scan2.total_findings} total)
            </Text>
            {scan2.findings.length === 0
              ? <Text style={[styles.emptyText, { color: theme.textMuted }]}>No findings in scan 2</Text>
              : scan2.findings.map((f, i) => (
                <View key={i} style={[styles.findingRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.findingLeft}>
                    <Text style={[styles.findingName, { color: theme.text }]}>{f.name}</Text>
                    <Text style={[styles.findingModule, { color: theme.textSecondary }]}>{f.module}</Text>
                  </View>
                  <SeverityBadge severity={f.severity} />
                </View>
              ))}
          </View>
        )}

        {activeTab === 'fixed' && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Fixed Issues ({summary.fixed_findings_count})
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              These were in Scan 1 but not in Scan 2
            </Text>
            {summary.fixed_findings.length === 0
              ? <Text style={[styles.emptyText, { color: theme.textMuted }]}>No issues were fixed</Text>
              : summary.fixed_findings.map((f, i) => (
                <View key={i} style={[styles.findingRow,
                  { borderBottomColor: theme.border, backgroundColor: theme.successBg, borderRadius: 8, paddingHorizontal: 8 }]}>
                  <View style={styles.findingLeft}>
                    <Text style={[styles.findingName, { color: theme.text }]}>{f.name}</Text>
                    <Text style={[styles.findingModule, { color: theme.textSecondary }]}>{f.module}</Text>
                  </View>
                  <SeverityBadge severity={f.severity} />
                </View>
              ))}
          </View>
        )}

        {activeTab === 'new' && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              New Issues ({summary.new_findings_count})
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              These appeared in Scan 2 but were not in Scan 1
            </Text>
            {summary.new_findings.length === 0
              ? <Text style={[styles.emptyText, { color: theme.textMuted }]}>No new issues found</Text>
              : summary.new_findings.map((f, i) => (
                <View key={i} style={[styles.findingRow,
                  { borderBottomColor: theme.border, backgroundColor: theme.dangerBg, borderRadius: 8, paddingHorizontal: 8 }]}>
                  <View style={styles.findingLeft}>
                    <Text style={[styles.findingName, { color: theme.text }]}>{f.name}</Text>
                    <Text style={[styles.findingModule, { color: theme.textSecondary }]}>{f.module}</Text>
                  </View>
                  <SeverityBadge severity={f.severity} />
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '500' },
  scroll: { flex: 1 },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, marginBottom: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' },
  scoreBox: { flex: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  scoreDate: { fontSize: 11, marginBottom: 8 },
  scoreBig: { fontSize: 36, fontWeight: 'bold' },
  sevLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  diffArrow: { fontSize: 24 },
  diffText: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  diffLabel: { fontSize: 11, marginTop: 2 },
  summaryRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12 },
  summaryBox: { flex: 1, alignItems: 'center', borderRadius: 12, padding: 14, marginHorizontal: 4, borderWidth: 1 },
  summaryNum: { fontSize: 28, fontWeight: 'bold' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  sevRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  sevName: { width: 70, fontSize: 13, fontWeight: '600' },
  sevCount: { width: 30, fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  sevArrow: { width: 24, textAlign: 'center', fontSize: 14 },
  sevDiff: { marginLeft: 8, fontSize: 13, fontWeight: 'bold' },
  sevSame: { marginLeft: 8, fontSize: 13 },
  detailRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1 },
  detailLabel: { width: 110, fontSize: 13, fontWeight: '600' },
  detailValue: { flex: 1, fontSize: 13 },
  findingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  findingLeft: { flex: 1, marginRight: 8 },
  findingName: { fontSize: 13, fontWeight: '600' },
  findingModule: { fontSize: 11, marginTop: 2 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  sevBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', fontSize: 14, paddingVertical: 20 },
});