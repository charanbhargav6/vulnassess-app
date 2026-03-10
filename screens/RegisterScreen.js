import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !confirm) { setError('All fields are required'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const data = await api.register(email, password);
      if (data.id) { setSuccess(true); }
      else { setError(data.detail || 'Registration failed'); }
    } catch (e) { setError('Cannot connect to server'); }
    setLoading(false);
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.card, {
          backgroundColor: theme.card,
          borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
        }]}>
          <Text style={styles.successIcon}>OK</Text>
          <Text style={[styles.successTitle, { color: theme.success }]}>Account Created!</Text>
          <Text style={[styles.successText, { color: theme.textSecondary }]}>
            A verification email has been sent to:
          </Text>
          <Text style={[styles.successEmail, { color: theme.blue }]}>{email}</Text>
          <Text style={[styles.successSubtext, { color: theme.textSecondary }]}>
            Please check your inbox and click the verification link before logging in.
          </Text>
          <View style={[styles.devBox, {
            backgroundColor: theme.dark ? '#422006' : '#FEF3C7',
            borderColor: theme.dark ? '#854D0E' : '#FDE68A',
          }]}>
            <Text style={[styles.devTitle, { color: theme.dark ? '#FCD34D' : '#92400E' }]}>
              No email server?
            </Text>
            <Text style={[styles.devText, { color: theme.dark ? '#FDE68A' : '#78350F' }]}>
              Check the backend CMD window for the verification URL printed in development mode.
            </Text>
          </View>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.blue }]}
            onPress={() => navigation.replace('Login')}>
            <Text style={styles.btnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.scrollContainer, { backgroundColor: theme.bg }]}>
      <View style={styles.container}>
        <View style={[styles.card, {
          backgroundColor: theme.card,
          borderWidth: theme.dark ? 1 : 0, borderColor: theme.border,
        }]}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join VulnAssess</Text>

          {error.length > 0 && (
            <View style={[styles.errorBox, {
              backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder,
            }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            </View>
          )}

          {[
            { placeholder: 'Email', value: email, setter: setEmail, keyboard: 'email-address' },
            { placeholder: 'Password', value: password, setter: setPassword, secure: true },
            { placeholder: 'Confirm Password', value: confirm, setter: setConfirm, secure: true },
          ].map((field, i) => (
            <TextInput key={i}
              style={[styles.input, {
                backgroundColor: theme.input, borderColor: theme.border, color: theme.text,
              }]}
              placeholder={field.placeholder}
              placeholderTextColor={theme.textMuted}
              value={field.value}
              onChangeText={(t) => { field.setter(t); setError(''); }}
              autoCapitalize="none"
              keyboardType={field.keyboard || 'default'}
              secureTextEntry={field.secure || false}
            />
          ))}

          <View style={[styles.rulesBox, { backgroundColor: theme.blueBg, borderColor: theme.blueBorder }]}>
            <Text style={[styles.rulesTitle, { color: theme.blue }]}>Password Requirements:</Text>
            {['At least 8 characters', 'One uppercase letter (A-Z)',
              'One lowercase letter (a-z)', 'One number (0-9)'].map((rule, i) => (
              <Text key={i} style={[styles.ruleText, { color: theme.textSecondary }]}>• {rule}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.blue }, loading && styles.btnDisabled]}
            onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: theme.blue }]}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },
  card: { borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', alignSelf: 'center', elevation: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1D6FEB', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14 },
  rulesBox: { borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1 },
  rulesTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  ruleText: { fontSize: 12, marginBottom: 3 },
  btn: { padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', fontSize: 14 },
  successIcon: { fontSize: 32, fontWeight: 'bold', color: '#16A34A', textAlign: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  successText: { fontSize: 14, textAlign: 'center' },
  successEmail: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginVertical: 8 },
  successSubtext: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  devBox: { borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1 },
  devTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  devText: { fontSize: 12, lineHeight: 18 },
});