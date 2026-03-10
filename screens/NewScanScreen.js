import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  ScrollView, Switch
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function NewScanScreen({ navigation }) {
  const { theme } = useTheme();
  const [targetUrl, setTargetUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyType, setProxyType] = useState('http');

  const handleStartScan = async () => {
    if (!targetUrl) { Alert.alert('Error', 'Target URL is required'); return; }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://'); return;
    }
    if (proxyEnabled && !proxyUrl) { Alert.alert('Error', 'Please enter proxy URL or disable proxy'); return; }
    if (proxyEnabled && !proxyUrl.startsWith('http')) {
      Alert.alert('Error', 'Proxy URL must start with http:// or socks5://'); return;
    }
    setLoading(true);
    try {
      const data = await api.createScan(targetUrl, username, password, proxyEnabled, proxyUrl, proxyType);
      if (data.scan_id) {
        navigation.replace('ScanProgress', { scanId: data.scan_id });
      } else {
        Alert.alert('Error', data.detail || 'Failed to start scan');
      }
    } catch (e) { Alert.alert('Error', 'Cannot connect to server'); }
    setLoading(false);
  };

  const inputStyle = [styles.input, {
    backgroundColor: theme.input, borderColor: theme.border, color: theme.text,
  }];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Target Section */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Target</Text>

        {[
          { label: 'Target URL *', placeholder: 'https://example.com', value: targetUrl, setter: setTargetUrl, keyboard: 'url' },
          { label: 'Username (optional)', placeholder: 'Target site username', value: username, setter: setUsername },
          { label: 'Password (optional)', placeholder: 'Target site password', value: password, setter: setPassword, secure: true },
        ].map((field, i) => (
          <View key={i}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{field.label}</Text>
            <TextInput
              style={inputStyle}
              placeholder={field.placeholder}
              placeholderTextColor={theme.textMuted}
              value={field.value}
              onChangeText={field.setter}
              autoCapitalize="none"
              keyboardType={field.keyboard || 'default'}
              secureTextEntry={field.secure || false}
            />
          </View>
        ))}
      </View>

      {/* Proxy Section */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
      }]}>
        <View style={styles.proxyHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Proxy</Text>
            <Text style={[styles.proxySubtitle, { color: theme.textSecondary }]}>
              Route scan traffic through a proxy
            </Text>
          </View>
          <Switch
            value={proxyEnabled} onValueChange={setProxyEnabled}
            trackColor={{ false: theme.border, true: '#93C5FD' }}
            thumbColor={proxyEnabled ? theme.blue : theme.textMuted}
          />
        </View>

        {proxyEnabled && (
          <View style={styles.proxyConfig}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Proxy Type</Text>
            <View style={styles.proxyTypeRow}>
              {['http', 'https', 'socks5'].map(type => (
                <TouchableOpacity key={type}
                  style={[styles.typeBtn,
                    { backgroundColor: theme.input, borderColor: theme.border },
                    proxyType === type && { backgroundColor: theme.blue, borderColor: theme.blue }
                  ]}
                  onPress={() => setProxyType(type)}>
                  <Text style={[styles.typeBtnText, { color: theme.textSecondary },
                    proxyType === type && { color: '#fff' }]}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Proxy URL *</Text>
            <TextInput
              style={inputStyle}
              placeholder={proxyType === 'socks5' ? 'socks5://127.0.0.1:1080' : 'http://127.0.0.1:8080'}
              placeholderTextColor={theme.textMuted}
              value={proxyUrl} onChangeText={setProxyUrl} autoCapitalize="none"
            />

            <View style={[styles.proxyInfoBox, { backgroundColor: theme.blueBg, borderColor: theme.blueBorder }]}>
              <Text style={[styles.proxyInfoTitle, { color: theme.blue }]}>Proxy Tips</Text>
              {[
                'Burp Suite:  http://127.0.0.1:8080',
                'OWASP ZAP:   http://127.0.0.1:8090',
                'SOCKS5:      socks5://127.0.0.1:1080',
              ].map((tip, i) => (
                <Text key={i} style={[styles.proxyInfoText, { color: theme.text }]}>{tip}</Text>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Warning */}
      <View style={[styles.warningBox, {
        backgroundColor: theme.dark ? '#422006' : '#FEF3C7',
        borderColor: theme.dark ? '#854D0E' : '#FDE68A',
      }]}>
        <Text style={[styles.warningText, { color: theme.dark ? '#FCD34D' : '#92400E' }]}>
          Only scan websites you own or have permission to test.
          Unauthorized scanning is illegal.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: theme.blue }, loading && styles.startBtnDisabled]}
        onPress={handleStartScan} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.startBtnText}>Start Scan</Text>
        }
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { margin: 16, marginBottom: 0, borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  proxyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  proxySubtitle: { fontSize: 12, marginTop: 2 },
  proxyConfig: { marginTop: 8 },
  proxyTypeRow: { flexDirection: 'row', marginBottom: 4 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  typeBtnText: { fontSize: 13, fontWeight: '600' },
  proxyInfoBox: { borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1 },
  proxyInfoTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  proxyInfoText: { fontSize: 12, fontFamily: 'monospace', marginBottom: 3 },
  warningBox: { borderRadius: 12, padding: 14, margin: 16, marginBottom: 0, borderWidth: 1 },
  warningText: { fontSize: 12, lineHeight: 18 },
  startBtn: { margin: 16, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});