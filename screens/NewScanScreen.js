// PATH: vulnassess-app/screens/NewScanScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ALL_MODULES = [
  { key:'auth_test',         label:'Authentication Testing',     fixed:true  },
  { key:'sql_injection',     label:'SQL Injection'                            },
  { key:'xss',               label:'Cross-Site Scripting (XSS)'              },
  { key:'command_injection', label:'OS Command Injection'                     },
  { key:'ssrf',              label:'SSRF'                                     },
  { key:'xxe',               label:'XXE Injection'                            },
  { key:'path_traversal',    label:'Path Traversal / LFI'                    },
  { key:'idor',              label:'IDOR'                                     },
  { key:'open_redirect',     label:'Open Redirect'                           },
  { key:'file_upload',       label:'File Upload'                             },
  { key:'csrf',              label:'CSRF Protection'                         },
  { key:'security_headers',  label:'Security Headers'                        },
  { key:'ssl_tls',           label:'SSL / TLS Analysis'                      },
  { key:'cors_check',        label:'CORS Misconfiguration'                   },
  { key:'cookie_security',   label:'Cookie Security'                         },
  { key:'clickjacking',      label:'Clickjacking'                            },
  { key:'info_disclosure',   label:'Information Disclosure'                  },
  { key:'rate_limiting',     label:'Rate Limiting'                           },
  { key:'graphql',           label:'GraphQL Security'                        },
  { key:'api_key_leakage',   label:'API Key Leakage'                         },
  { key:'jwt',               label:'JWT Security'                            },
  { key:'rate_limit',        label:'Rate Limit Bypass'                       },
];

export default function NewScanScreen({ navigation }) {
  const { theme } = useTheme();
  const [targetUrl,     setTargetUrl]     = useState('');
  const [selected,      setSelected]      = useState(ALL_MODULES.map(m => m.key));
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [proxyEnabled,  setProxyEnabled]  = useState(false);
  const [proxyUrl,      setProxyUrl]      = useState('');
  const [proxyType,     setProxyType]     = useState('http');
  const [showModules,   setShowModules]   = useState(false);

  const toggle = key => {
    const m = ALL_MODULES.find(x => x.key === key);
    if (m?.fixed) return;
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleAll = () => {
    const nonFixed = ALL_MODULES.filter(m => !m.fixed).map(m => m.key);
    const allOn = nonFixed.every(k => selected.includes(k));
    setSelected(allOn ? ALL_MODULES.filter(m => m.fixed).map(m => m.key) : ALL_MODULES.map(m => m.key));
  };

  const handleStart = async () => {
    if (!targetUrl) { setError('Target URL is required'); return; }
    let url = targetUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    if (proxyEnabled && !proxyUrl) { setError('Enter proxy URL or disable proxy'); return; }
    setLoading(true);
    try {
      const data = await api.createScan(url, '', '', proxyEnabled, proxyUrl, proxyType);
      if (data.scan_id || data._id || data.id) {
        navigation.replace('ScanProgress', { scanId: data.scan_id || data._id || data.id });
      } else {
        setError(data.detail || 'Failed to start scan');
      }
    } catch { setError('Cannot connect to server'); }
    setLoading(false);
  };

  const s = StyleSheet.create({
    container:  { flex:1, backgroundColor:theme.bg },
    section:    { backgroundColor:theme.card, borderRadius:14, margin:12, marginBottom:0, padding:16, borderWidth:1, borderColor:theme.border },
    sTitle:     { fontSize:11, fontWeight:'bold', color:theme.textSecondary, letterSpacing:2, marginBottom:14 },
    label:      { fontSize:10, fontWeight:'bold', color:theme.textSecondary, letterSpacing:1.5, marginBottom:6, marginTop:10 },
    input:      { backgroundColor:theme.input, borderWidth:1, borderColor:theme.inputBorder, borderRadius:8, padding:12, fontSize:14, color:theme.text },
    errorBox:   { backgroundColor:theme.dangerBg, borderWidth:1, borderColor:theme.dangerBorder, borderRadius:8, padding:12, marginBottom:12 },
    errorText:  { color:theme.danger, fontSize:13 },
    hint:       { backgroundColor:theme.accentMuted, borderRadius:8, padding:12, marginTop:12, borderWidth:1, borderColor:theme.mediumBorder },
    hintText:   { color:theme.textSecondary, fontSize:12, lineHeight:18 },
    btn:        { backgroundColor:theme.accent, borderRadius:10, padding:15, alignItems:'center', margin:12, marginTop:14 },
    btnDisabled:{ opacity:0.6 },
    btnText:    { color:theme.card, fontWeight:'bold', fontSize:15, letterSpacing:1 },
    proxyRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:4 },
    typeRow:    { flexDirection:'row', gap:8, marginTop:4 },
    typeBtn:    { paddingHorizontal:14, paddingVertical:8, borderRadius:7, borderWidth:1 },
    modHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    modToggle:  { color:theme.accent, fontSize:12, fontWeight:'bold' },
    modItem:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                  paddingVertical:10, borderBottomWidth:1, borderBottomColor:theme.border },
    modLabel:   { fontSize:13, color:theme.text, flex:1 },
    modFixed:   { fontSize:9, color:theme.accent, marginLeft:6, letterSpacing:1 },
    checkbox:   { width:20, height:20, borderRadius:5, borderWidth:1, borderColor:theme.border,
                  alignItems:'center', justifyContent:'center' },
    checkOn:    { backgroundColor:theme.accent, borderColor:theme.accent },
    checkMark:  { color:'#fff', fontSize:11, fontWeight:'bold' },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom:40 }}>
      {/* Target */}
      <View style={s.section}>
        <Text style={s.sTitle}>TARGET CONFIGURATION</Text>
        {!!error && <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View>}
        <Text style={s.label}>TARGET URL</Text>
        <TextInput style={s.input} placeholder="https://example.com" placeholderTextColor={theme.textMuted}
          value={targetUrl} onChangeText={t => { setTargetUrl(t); setError(''); }} autoCapitalize="none" keyboardType="url"/>
        <View style={s.hint}>
          <Text style={s.hintText}>ℹ Only scan systems you own or have explicit written permission to test.</Text>
        </View>
      </View>

      {/* Proxy */}
      <View style={s.section}>
        <View style={s.proxyRow}>
          <Text style={s.sTitle}>PROXY</Text>
          <Switch value={proxyEnabled} onValueChange={setProxyEnabled}
            trackColor={{ false:theme.border, true:theme.mediumBorder }} thumbColor={proxyEnabled ? theme.accent : theme.textMuted}/>
        </View>
        {proxyEnabled && (
          <>
            <Text style={s.label}>PROXY TYPE</Text>
            <View style={s.typeRow}>
              {['http','https','socks5'].map(t => (
                <TouchableOpacity key={t} style={[s.typeBtn,
                  { backgroundColor: proxyType===t ? theme.accent : theme.input, borderColor: proxyType===t ? theme.accent : theme.border }]}
                  onPress={() => setProxyType(t)}>
                  <Text style={{ color: proxyType===t ? theme.card : theme.textSecondary, fontWeight:'bold', fontSize:12 }}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>PROXY URL</Text>
            <TextInput style={s.input} placeholder={proxyType==='socks5' ? 'socks5://127.0.0.1:1080' : 'http://127.0.0.1:8080'}
              placeholderTextColor={theme.textMuted} value={proxyUrl} onChangeText={setProxyUrl} autoCapitalize="none"/>
          </>
        )}
      </View>

      {/* Modules */}
      <View style={s.section}>
        <View style={s.modHeader}>
          <Text style={s.sTitle}>MODULES ({selected.length}/{ALL_MODULES.length})</Text>
          <TouchableOpacity onPress={() => setShowModules(v => !v)}>
            <Text style={s.modToggle}>{showModules ? 'HIDE ▲' : 'SHOW ▼'}</Text>
          </TouchableOpacity>
        </View>
        {showModules && (
          <>
            <TouchableOpacity onPress={toggleAll} style={{ alignSelf:'flex-end', marginBottom:8 }}>
              <Text style={s.modToggle}>
                {ALL_MODULES.filter(m => !m.fixed).every(m => selected.includes(m.key)) ? 'DESELECT ALL' : 'SELECT ALL'}
              </Text>
            </TouchableOpacity>
            {ALL_MODULES.map(m => (
              <TouchableOpacity key={m.key} style={s.modItem} onPress={() => toggle(m.key)}>
                <Text style={[s.modLabel, !selected.includes(m.key) && { color:theme.textMuted }]}>
                  {m.label}
                  {m.fixed && <Text style={s.modFixed}> FIXED</Text>}
                </Text>
                <View style={[s.checkbox, selected.includes(m.key) && s.checkOn]}>
                  {selected.includes(m.key) && <Text style={s.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleStart} disabled={loading}>
        {loading ? <ActivityIndicator color={theme.card}/> : <Text style={s.btnText}>⊕ LAUNCH SCAN ({selected.length} modules)</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}