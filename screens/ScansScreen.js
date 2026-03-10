import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Running', value: 'running' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
];

const RISK_FILTERS = [
  { label: 'All Risk', value: 'all' },
  { label: 'Critical 9+', value: 'critical' },
  { label: 'High 7+', value: 'high' },
  { label: 'Medium 4+', value: 'medium' },
  { label: 'Low <4', value: 'low' },
];

const getRiskColor = (score) => {
  if (score >= 9) return '#DC2626';
  if (score >= 7) return '#EA580C';
  if (score >= 4) return '#D97706';
  return '#16A34A';
};

const getRiskLabel = (score) => {
  if (score >= 9) return 'Critical';
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
};

const getStatusColor = (status) => {
  if (status === 'completed') return '#16A34A';
  if (status === 'running') return '#1D6FEB';
  if (status === 'failed') return '#DC2626';
  return '#6B7280';
};

export default function ScansScreen({ navigation }) {
  const { theme } = useTheme();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScans, setSelectedScans] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const loadScans = useCallback(async () => {
    try {
      const data = await api.getScans({
        status: statusFilter, risk_level: riskFilter,
        search, date_from: dateFrom || undefined, date_to: dateTo || undefined,
      });
      setScans(Array.isArray(data) ? data : []);
    } catch (e) { setScans([]); }
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter, riskFilter, search, dateFrom, dateTo]);

  useEffect(() => { setLoading(true); loadScans(); }, [loadScans]);

  const onRefresh = () => { setRefreshing(true); loadScans(); };

  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setRiskFilter('all');
    setDateFrom(''); setDateTo(''); setShowDateFilter(false);
  };

  const toggleSelect = (id) => {
    setSelectedScans(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const hasActiveFilters = search || statusFilter !== 'all' ||
    riskFilter !== 'all' || dateFrom || dateTo;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, {
            backgroundColor: theme.card, borderColor: theme.border,
            color: theme.text,
          }]}
          placeholder="Search by URL..."
          placeholderTextColor={theme.textMuted}
          value={search} onChangeText={setSearch} autoCapitalize="none"
        />
        {hasActiveFilters && (
          <TouchableOpacity style={[styles.clearBtn, {
            backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder,
          }]} onPress={clearFilters}>
            <Text style={[styles.clearBtnText, { color: theme.danger }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.pillScroll} contentContainerStyle={styles.pillRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity key={f.value}
            style={[styles.pill,
              { backgroundColor: theme.pill, borderColor: theme.pillBorder },
              statusFilter === f.value && { backgroundColor: theme.blue, borderColor: theme.blue }
            ]}
            onPress={() => setStatusFilter(f.value)}>
            <Text style={[styles.pillText, { color: theme.textSecondary },
              statusFilter === f.value && { color: '#fff', fontWeight: '600' }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Risk Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.pillScroll} contentContainerStyle={styles.pillRow}>
        {RISK_FILTERS.map(f => {
          const riskColors = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#16A34A' };
          const isActive = riskFilter === f.value;
          return (
            <TouchableOpacity key={f.value}
              style={[styles.pill,
                { backgroundColor: theme.pill, borderColor: theme.pillBorder },
                isActive && { backgroundColor: riskColors[f.value] || theme.blue,
                  borderColor: riskColors[f.value] || theme.blue }
              ]}
              onPress={() => setRiskFilter(f.value)}>
              <Text style={[styles.pillText, { color: theme.textSecondary },
                isActive && { color: '#fff', fontWeight: '600' }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date Filter */}
      <TouchableOpacity style={styles.dateToggle}
        onPress={() => setShowDateFilter(!showDateFilter)}>
        <Text style={[styles.dateToggleText, { color: theme.blue }]}>
          {showDateFilter ? 'Hide Date Filter' : 'Filter by Date'}
        </Text>
      </TouchableOpacity>

      {showDateFilter && (
        <View style={styles.dateRow}>
          {['From (YYYY-MM-DD)', 'To (YYYY-MM-DD)'].map((label, i) => (
            <View key={i} style={styles.dateInputWrap}>
              <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>{label}</Text>
              <TextInput
                style={[styles.dateInput, {
                  backgroundColor: theme.card, borderColor: theme.border, color: theme.text,
                }]}
                placeholder={i === 0 ? '2024-01-01' : '2024-12-31'}
                placeholderTextColor={theme.textMuted}
                value={i === 0 ? dateFrom : dateTo}
                onChangeText={i === 0 ? setDateFrom : setDateTo}
              />
            </View>
          ))}
        </View>
      )}

      {/* Compare Bar */}
      {selectedScans.length > 0 && (
        <View style={[styles.compareBar, { backgroundColor: theme.blue }]}>
          <Text style={styles.compareBarText}>
            {selectedScans.length === 1
              ? '1 selected — tap another to compare'
              : '2 selected — ready to compare!'}
          </Text>
          <View style={styles.compareBarBtns}>
            <TouchableOpacity style={styles.clearSelectBtn}
              onPress={() => setSelectedScans([])}>
              <Text style={styles.clearSelectText}>Clear</Text>
            </TouchableOpacity>
            {selectedScans.length === 2 && (
              <TouchableOpacity style={styles.compareBtn}
                onPress={() => {
                  navigation.navigate('Compare', {
                    scan1Id: selectedScans[0], scan2Id: selectedScans[1],
                  });
                  setSelectedScans([]);
                }}>
                <Text style={[styles.compareBtnText, { color: theme.blue }]}>Compare</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Results Row */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
          {loading ? 'Loading...' : `${scans.length} scan${scans.length !== 1 ? 's' : ''} found`}
        </Text>
        <View style={styles.resultsRight}>
          {hasActiveFilters && (
            <Text style={[styles.filterActiveText, {
              color: theme.blue, backgroundColor: theme.blueBg,
            }]}>Filters active</Text>
          )}
          {selectedScans.length === 0 && (
            <Text style={[styles.hintText, { color: theme.textMuted }]}>
              Tap to open • Long press to select
            </Text>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.blue} />
        </View>
      ) : (
        <ScrollView style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {scans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No scans found</Text>
              <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                {hasActiveFilters ? 'Try changing your filters' : 'Start a new scan to see results here'}
              </Text>
            </View>
          ) : (
            scans.map(scan => {
              const isSelected = selectedScans.includes(scan.id);
              const isDisabled = selectedScans.length === 2 && !isSelected;
              return (
                <TouchableOpacity key={scan.id}
                  style={[styles.scanCard,
                    { backgroundColor: theme.card, borderWidth: 1,
                      borderColor: isSelected ? theme.blue : theme.border },
                    isSelected && { backgroundColor: theme.blueBg },
                    isDisabled && styles.scanCardDisabled,
                  ]}
                  onPress={() => selectedScans.length > 0
                    ? toggleSelect(scan.id)
                    : navigation.navigate('ScanProgress', { scanId: scan.id })}
                  onLongPress={() => toggleSelect(scan.id)}>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.blue }]}>
                      <Text style={styles.selectedBadgeText}>
                        {selectedScans.indexOf(scan.id) + 1}
                      </Text>
                    </View>
                  )}
                  <View style={styles.scanCardTop}>
                    <Text style={[styles.scanUrl, { color: theme.text }]} numberOfLines={1}>
                      {scan.target_url}
                    </Text>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(scan.total_risk_score) }]}>
                      <Text style={styles.riskBadgeText}>{scan.total_risk_score?.toFixed(1)}</Text>
                    </View>
                  </View>
                  <View style={styles.scanCardBottom}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(scan.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(scan.status) }]}>
                      {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                    </Text>
                    <Text style={[styles.separator, { color: theme.border }]}> • </Text>
                    <Text style={[styles.riskLevelText, { color: theme.textSecondary }]}>
                      {getRiskLabel(scan.total_risk_score)}
                    </Text>
                    <Text style={[styles.separator, { color: theme.border }]}> • </Text>
                    <Text style={[styles.dateText, { color: theme.textMuted }]}>
                      {new Date(scan.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { flexDirection: 'row', padding: 12, paddingBottom: 0, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14 },
  clearBtn: { marginLeft: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  clearBtnText: { fontWeight: '600', fontSize: 13 },
  pillScroll: { maxHeight: 48 },
  pillRow: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row' },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  pillText: { fontSize: 13, fontWeight: '500' },
  dateToggle: { marginHorizontal: 12, marginBottom: 6 },
  dateToggleText: { fontSize: 13, fontWeight: '600' },
  dateRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 6 },
  dateInputWrap: { flex: 1, marginRight: 8 },
  dateLabel: { fontSize: 11, marginBottom: 4 },
  dateInput: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 13 },
  compareBar: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compareBarText: { color: '#fff', fontSize: 13, flex: 1 },
  compareBarBtns: { flexDirection: 'row' },
  clearSelectBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  clearSelectText: { color: '#fff', fontSize: 13 },
  compareBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  compareBtnText: { fontWeight: 'bold', fontSize: 13 },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6 },
  resultsRight: { flexDirection: 'row', alignItems: 'center' },
  resultsText: { fontSize: 12 },
  filterActiveText: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  hintText: { fontSize: 10, marginLeft: 6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list: { flex: 1 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 13, textAlign: 'center' },
  scanCard: { marginHorizontal: 12, marginBottom: 10, borderRadius: 12, padding: 14, elevation: 2 },
  scanCardDisabled: { opacity: 0.4 },
  selectedBadge: { position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  selectedBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  scanCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scanUrl: { flex: 1, fontSize: 14, fontWeight: '600', marginRight: 10 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskBadgeText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  scanCardBottom: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusText: { fontSize: 12, fontWeight: '600' },
  separator: { fontSize: 12 },
  riskLevelText: { fontSize: 12 },
  dateText: { fontSize: 12 },
});