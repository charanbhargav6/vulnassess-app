/**
 * VulnAssess — Shared API Core
 * ─────────────────────────────────────────────────────────────────────────────
 * All API calls live here. This file is platform-agnostic.
 *
 * It is initialised with a storage adapter so it works on both platforms:
 *
 *   Web   → uses localStorage  (synchronous, wrapped to look async)
 *   Mobile → uses AsyncStorage (already async)
 *
 * Usage
 * ─────
 *   // web:    import { api } from './api';
 *   // mobile: import { api } from '../services/api';
 *
 * Both import files call createApi(storageAdapter) and re-export the result.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const BASE_URL = 'https://vulnassess-backend.onrender.com/api';

/**
 * Factory — call once per platform, pass in the storage adapter.
 *
 * @param {Object} storage
 * @param {(key: string) => Promise<string|null>}         storage.get
 * @param {(key: string, value: string) => Promise<void>} storage.set
 * @param {(key: string) => Promise<void>}                storage.remove
 * @param {() => Promise<void>}                           storage.clear
 */
export function createApi(storage) {

  // ── helpers ────────────────────────────────────────────────────────────────

  const getHeaders = async () => {
    const token = await storage.get('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  /** Thin fetch wrapper — throws on network error, returns parsed JSON. */
  const req = async (method, path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: await getHeaders(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return res.json();
  };

  const get    = (path)        => req('GET',    path);
  const post   = (path, body)  => req('POST',   path, body);
  const put    = (path, body)  => req('PUT',    path, body);
  const del    = (path, body)  => req('DELETE', path, body);

  // ── public API ─────────────────────────────────────────────────────────────

  return {

    // ── Auth ──────────────────────────────────────────────────────────────────

    login: async (email, password) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.access_token) {
        await storage.set('token', data.access_token);
        await storage.set('role',  data.role  || 'user');
        await storage.set('email', data.email || email);
        if (data.scan_count  != null) await storage.set('scan_count',  String(data.scan_count));
        if (data.scan_limit  != null) await storage.set('scan_limit',  String(data.scan_limit));
      }
      return data;
    },

    register: async (email, password) => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },

    logout: async () => {
      try { await post('/auth/logout'); } catch (_) {}
      await storage.clear();
    },

    getMe:           ()           => get('/auth/me'),
    verifyPassword:  (password)   => post('/auth/verify-password', { password }),
    deleteAccount:   (password)   => del('/auth/delete-account',   { password }),

    // ── Scans ─────────────────────────────────────────────────────────────────

    getScans: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status)     params.set('status',     filters.status);
      if (filters.risk_level) params.set('risk_level', filters.risk_level);
      if (filters.date_from)  params.set('date_from',  filters.date_from);
      if (filters.date_to)    params.set('date_to',    filters.date_to);
      if (filters.search)     params.set('search',     filters.search);
      const qs = params.toString() ? `?${params}` : '';
      return get(`/scans${qs}`);
    },

    /** Unified scan launcher — accepts both web (flat args) and mobile (named) */
    startScan: (target_url, username, password, proxy_enabled, proxy_url, proxy_type) =>
      post('/scans', {
        target_url,
        username:      username      || null,
        password:      password      || null,
        proxy_enabled: proxy_enabled || false,
        proxy_url:     proxy_url     || null,
        proxy_type:    proxy_type    || 'http',
      }),

    /** Alias kept for backward-compat with mobile screens that call createScan */
    createScan: (target_url, username, password, proxy_enabled, proxy_url, proxy_type) =>
      post('/scans', {
        target_url,
        username:      username      || null,
        password:      password      || null,
        proxy_enabled: proxy_enabled || false,
        proxy_url:     proxy_url     || null,
        proxy_type:    proxy_type    || 'http',
      }),

    getScan:          (id)           => get(`/scans/${id}`),
    cancelScan:       (id)           => post(`/scans/${id}/cancel`),
    deleteScan:       (id)           => del(`/scans/${id}`),

    deleteScanVerified: (id, password) =>
      del(`/scans/${id}/verify-delete`, { password }),

    deleteScansVerified: async (ids, password) => {
      const headers = await getHeaders();
      return Promise.all(
        ids.map(id =>
          fetch(`${BASE_URL}/scans/${id}/verify-delete`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ password }),
          })
        )
      );
    },

    // ── Reports ───────────────────────────────────────────────────────────────

    downloadPDF: async (id) => {
      const res = await fetch(`${BASE_URL}/reports/${id}/pdf`, {
        headers: await getHeaders(),
      });
      if (!res.ok) return null;
      return res.blob();
    },

    getAIRemediation: (scanId) => get(`/reports/${scanId}/ai-remediation`),

    downloadAIPDF: async (scanId) => {
      const res = await fetch(`${BASE_URL}/reports/${scanId}/ai-remediation/pdf`, {
        headers: await getHeaders(),
      });
      if (!res.ok) return null;
      return res.blob();
    },

    // ── Compare ───────────────────────────────────────────────────────────────

    compareScans: (id1, id2) =>
      get(`/compare?scan1_id=${id1}&scan2_id=${id2}`),

    // ── Modules ───────────────────────────────────────────────────────────────

    getModules:          ()              => get('/modules'),
    updateModule:        (key, enabled)  => put(`/modules/${key}`,         { enabled }),
    updateModuleOrder:   (key, order)    => put(`/modules/${key}/order`,    { order }),
    restoreModuleDefaults: ()            => post('/modules/restore-defaults'),

    // ── Profile ───────────────────────────────────────────────────────────────

    getProfile:      ()                            => get('/profile'),
    updateProfile:   (full_name)                   => put('/profile', { full_name }),
    changePassword:  (current_password, new_password) =>
      put('/profile/change-password', { current_password, new_password }),

    // ── Admin ─────────────────────────────────────────────────────────────────

    getUsers:        ()               => get('/admin/users'),
    deleteUser:      (userId)         => del(`/admin/users/${userId}`),
    updateRole:      (userId, role)   => put(`/admin/users/${userId}/role`,  { role }),
    updateUserRole:  (userId, role)   => put(`/admin/users/${userId}/role`,  { role }), // alias
    updateScanLimit: (userId, limit)  => put(`/admin/users/${userId}/limit`, { scan_limit: limit }),
    toggleUser:      (userId)         => put(`/admin/users/${userId}/toggle`),
    getAllScans:      ()               => get('/admin/scans'),
    adminDeleteScan: (scanId)         => del(`/admin/scans/${scanId}`),
    getAdminStats:   ()               => get('/admin/stats'),
    getStats:        ()               => get('/admin/stats'), // alias
    getLogs:         ()               => get('/admin/logs'),

    // ── Schedules ─────────────────────────────────────────────────────────────

    getSchedules:   () => get('/schedules'),

    createSchedule: (target_url, timeframe, username, password) =>
      post('/schedules', { target_url, timeframe, username, password }),

    toggleSchedule: (id, is_active) =>
      put(`/schedules/${id}`, { is_active }),

    deleteSchedule: (id) => del(`/schedules/${id}`),

    // ── Storage passthrough (for screens that read cached values) ─────────────

    storage,
  };
}