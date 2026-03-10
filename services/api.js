import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://vulnassess-backend.onrender.com/api';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.access_token) {
      await AsyncStorage.setItem('token', data.access_token);
      await AsyncStorage.setItem('role', data.role || 'user');
      await AsyncStorage.setItem('email', data.email || email);
    }
    return data;
  },

  logout: async () => {
  try {
    const headers = await getHeaders();
    await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers });
  } catch (e) {}
  await AsyncStorage.clear(); // clears EVERYTHING at once
},

  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  register: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  createScan: async (target_url, username, password, proxy_enabled, proxy_url, proxy_type) => {
    const res = await fetch(`${BASE_URL}/scans`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        target_url,
        username,
        password,
        proxy_enabled: proxy_enabled || false,
        proxy_url: proxy_url || null,
        proxy_type: proxy_type || 'http'
      }),
    });
    return res.json();
  },

  getScans: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.risk_level) params.append('risk_level', filters.risk_level);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/scans${query}`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  getScan: async (scanId) => {
    const res = await fetch(`${BASE_URL}/scans/${scanId}`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  deleteScan: async (scanId) => {
    const res = await fetch(`${BASE_URL}/scans/${scanId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.json();
  },

  getModules: async () => {
    const res = await fetch(`${BASE_URL}/modules`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  updateModule: async (moduleKey, enabled) => {
    const res = await fetch(`${BASE_URL}/modules/${moduleKey}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ enabled }),
    });
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  deleteUser: async (userId) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.json();
  },

  updateRole: async (userId, role) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ role }),
    });
    return res.json();
  },

  getAllScans: async () => {
    const res = await fetch(`${BASE_URL}/admin/scans`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  getLogs: async () => {
    const res = await fetch(`${BASE_URL}/admin/logs`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  adminDeleteScan: async (scanId) => {
    const res = await fetch(`${BASE_URL}/admin/scans/${scanId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.json();
  },

  updateScanLimit: async (userId, limit) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/limit`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ scan_limit: limit }),
    });
    return res.json();
  },

  toggleUser: async (userId) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/toggle`, {
      method: 'PUT',
      headers: await getHeaders(),
    });
    return res.json();
  },

  updateModuleOrder: async (moduleKey, order) => {
    const res = await fetch(`${BASE_URL}/modules/${moduleKey}/order`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ order }),
    });
    return res.json();
  },

  restoreModuleDefaults: async () => {
    const res = await fetch(`${BASE_URL}/modules/restore-defaults`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return res.json();
  },
  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  updateProfile: async (full_name) => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ full_name }),
    });
    return res.json();
  },

  changePassword: async (current_password, new_password) => {
    const res = await fetch(`${BASE_URL}/profile/change-password`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ current_password, new_password }),
    });
    return res.json();
  },
  compareScans: async (scan1_id, scan2_id) => {
    const res = await fetch(
      `${BASE_URL}/compare?scan1_id=${scan1_id}&scan2_id=${scan2_id}`,
      { headers: await getHeaders() }
    );
    return res.json();
  },

  // Cancel a running scan
  cancelScan: async (scanId) => {
    const res = await fetch(`${BASE_URL}/scans/${scanId}/cancel`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return res.json();
  },

  // Delete scan with password verification
  deleteScanVerified: async (scanId, password) => {
    const res = await fetch(`${BASE_URL}/scans/${scanId}/verify-delete`, {
      method: 'DELETE',
      headers: await getHeaders(),
      body: JSON.stringify({ password }),
    });
    return res.json();
  },

  // Delete multiple scans with password
  deleteScansVerified: async (scanIds, password) => {
    const headers = await getHeaders();
    const results = await Promise.all(
      scanIds.map(id => fetch(`${BASE_URL}/scans/${id}/verify-delete`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ password }),
      }))
    );
    return results;
  },

  // Verify password
  verifyPassword: async (password) => {
    const res = await fetch(`${BASE_URL}/auth/verify-password`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ password }),
    });
    return res.json();
  },

  // Delete account with password
  deleteAccount: async (password) => {
    const res = await fetch(`${BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: await getHeaders(),
      body: JSON.stringify({ password }),
    });
    return res.json();
  },

  // Schedule APIs
  getSchedules: async () => {
    const res = await fetch(`${BASE_URL}/schedules`, {
      headers: await getHeaders(),
    });
    return res.json();
  },

  createSchedule: async (target_url, timeframe, username, password) => {
    const res = await fetch(`${BASE_URL}/schedules`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ target_url, timeframe, username, password }),
    });
    return res.json();
  },

  toggleSchedule: async (scheduleId, is_active) => {
    const res = await fetch(`${BASE_URL}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ is_active }),
    });
    return res.json();
  },

  deleteSchedule: async (scheduleId) => {
    const res = await fetch(`${BASE_URL}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.json();
  },
};