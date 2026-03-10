import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);

  const handleLogin = async () => {
    await AsyncStorage.clear();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(email, password);
      if (data.access_token) {
        await AsyncStorage.setItem('scan_count', String(data.scan_count || 0));
        await AsyncStorage.setItem('scan_limit', String(data.scan_limit || 100));
        navigation.replace('Dashboard');
      } else {
        const msg = data.detail || 'Invalid credentials';
        setBlocked(msg.includes('Too many') || msg.includes('Try again'));
        setError(msg);
      }
    } catch (e) {
      setError('Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.card, {
        backgroundColor: theme.card,
        borderWidth: theme.dark ? 1 : 0,
        borderColor: theme.border,
      }]}>
        <Text style={styles.title}>VulnAssess</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Web Vulnerability Scanner
        </Text>

        {error.length > 0 && (
          <View style={blocked
            ? styles.blockedBox
            : [styles.errorBox, {
                backgroundColor: theme.dangerBg,
                borderColor: theme.dangerBorder,
              }]}>
            <Text style={blocked ? styles.blockedText :
              [styles.errorText, { color: theme.danger }]}>
              {error}
            </Text>
          </View>
        )}

        <TextInput
          style={[styles.input, {
            backgroundColor: theme.input,
            borderColor: theme.inputBorder,
            color: theme.text,
          }]}
          placeholder="Email"
          placeholderTextColor={theme.textMuted}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); setBlocked(false); }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!blocked}
        />

        <TextInput
          style={[styles.input, {
            backgroundColor: theme.input,
            borderColor: theme.inputBorder,
            color: theme.text,
          }]}
          placeholder="Password"
          placeholderTextColor={theme.textMuted}
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          secureTextEntry
          editable={!blocked}
        />

        <TouchableOpacity
          style={[styles.btn, (loading || blocked) && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading || blocked}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>
                {blocked ? 'Account Blocked' : 'Sign In'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.link, { color: theme.blue }]}>
            Don't have an account? Register
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 28,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D6FEB',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  blockedBox: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  blockedText: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: '#1D6FEB',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  link: { textAlign: 'center', fontSize: 14 },
});