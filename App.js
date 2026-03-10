import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import NewScanScreen from './screens/NewScanScreen';
import ScanProgressScreen from './screens/ScanProgressScreen';
import ReportScreen from './screens/ReportScreen';
import AdminScreen from './screens/AdminScreen';
import ProfileScreen from './screens/ProfileScreen';
import ScansScreen from './screens/ScansScreen';
import CompareScreen from './screens/CompareScreen';
import ScheduleScreen from './screens/ScheduleScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');
  const { theme } = useTheme();

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setInitialRoute('Login');
        setReady(true);
        return;
      }
      try {
        const res = await fetch('http://localhost:8000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          await AsyncStorage.clear();
          setInitialRoute('Login');
        } else {
          setInitialRoute('Dashboard');
        }
      } catch (e) {
        // Server offline — keep user logged in
        setInitialRoute('Dashboard');
      }
      setReady(true);
    };
    checkToken();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center',
        alignItems: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.blue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: theme.header },
          headerTintColor: theme.headerText,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen}
          options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen}
          options={{ title: 'Create Account' }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen}
          options={{ headerShown: false }} />
        <Stack.Screen name="NewScan" component={NewScanScreen}
          options={{ title: 'New Scan' }} />
        <Stack.Screen name="ScanProgress" component={ScanProgressScreen}
          options={{ title: 'Scan Progress' }} />
        <Stack.Screen name="Report" component={ReportScreen}
          options={{ title: 'Report' }} />
        <Stack.Screen name="Admin" component={AdminScreen}
          options={{ title: 'Admin Panel' }} />
        <Stack.Screen name="Profile" component={ProfileScreen}
          options={{ title: 'My Profile' }} />
        <Stack.Screen name="Scans" component={ScansScreen}
          options={{ title: 'My Scans' }} />
        <Stack.Screen name="Compare" component={CompareScreen}
          options={{ title: 'Scan Comparison' }} />
        <Stack.Screen name="Schedule" component={ScheduleScreen}
          options={{ title: 'Scheduled Scans' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppNavigator />
      </NotificationProvider>
    </ThemeProvider>
  );
}