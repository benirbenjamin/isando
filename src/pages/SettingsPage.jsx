import React, { useState, useEffect } from 'react';
import { Settings, Save, Mail, HardDrive, Plus, Trash2, CheckCircle2, Info } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [guide, setGuide] = useState('');
  const [googleAccounts, setGoogleAccounts] = useState([]);
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Google Drive account state
  const [newDriveAcc, setNewDriveAcc] = useState({
    name: 'Primary Storage 15GB',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    folderId: '',
  });

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettings(res.settings || {});
      setGuide(res.googleDriveGuide || '');
      try {
        setGoogleAccounts(JSON.parse(res.settings?.google_drive_accounts || '[]'));
      } catch {
        setGoogleAccounts([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', {
        settings: {
          ...settings,
          google_drive_accounts: JSON.stringify(googleAccounts),
        }
      });
      alert('System settings saved successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return alert('Please enter a test recipient email address');
    setTestingEmail(true);
    try {
      const res = await api.post('/settings/test-email', { testEmail });
      alert(`Test Email Result (${res.result?.provider}): ${res.message}`);
    } catch (err) {
      alert('Test Email failed: ' + err.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleAddDriveAccount = () => {
    if (!newDriveAcc.clientId || !newDriveAcc.refreshToken) {
      return alert('Client ID and Refresh Token are required for Google Drive account');
    }
    setGoogleAccounts([...googleAccounts, newDriveAcc]);
    setNewDriveAcc({ name: '', clientId: '', clientSecret: '', refreshToken: '', folderId: '' });
  };

  const handleRemoveDriveAccount = (idx) => {
    setGoogleAccounts(googleAccounts.filter((_, i) => i !== idx));
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Settings className="w-8 h-8 text-brand-yellow" />
            <span>System Settings & Storage Integration</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Super Admin Control: Company branding, Resend/SMTP Email, Vercel Blob & Multi-Account Google Drive setup
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-6 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      <div className="space-y-8">
        {/* 1. General Branding Settings */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-lg text-brand-dark border-b pb-2">1. Company & Branding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-brand-dark block mb-1">Company Name</label>
              <input
                type="text"
                value={settings.company_name || 'Romantic T Solutions Ltd'}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-brand-dark block mb-1">WhatsApp Business Number</label>
              <input
                type="text"
                value={settings.whatsapp_number || '250786639945'}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="font-bold text-brand-dark block mb-1">Company Email</label>
              <input
                type="email"
                value={settings.company_email || 'info@romantictsolutions.com'}
                onChange={(e) => handleChange('company_email', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-brand-dark block mb-1">Physical Address</label>
              <input
                type="text"
                value={settings.company_address || 'Kigali, Rwanda'}
                onChange={(e) => handleChange('company_address', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* 2. Email Integration (Resend API + SMTP Fallback) */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-lg text-brand-dark flex items-center gap-2 border-b pb-2">
            <Mail className="w-5 h-5 text-brand-red" />
            <span>2. Email Service (Resend API + SMTP Fallback)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-brand-dark block mb-1">Resend API Key (Primary)</label>
              <input
                type="password"
                placeholder="re_123456789..."
                value={settings.resend_api_key || ''}
                onChange={(e) => handleChange('resend_api_key', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-mono"
              />
              <span className="text-[10px] text-gray-400">Primary provider for sending OTP login codes</span>
            </div>

            <div>
              <label className="font-bold text-brand-dark block mb-1">SMTP Host (Fallback)</label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                value={settings.smtp_host || ''}
                onChange={(e) => handleChange('smtp_host', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
              />
              <span className="text-[10px] text-gray-400">Triggers automatically if Resend fails</span>
            </div>

            <div>
              <label className="font-bold text-brand-dark block mb-1">SMTP Username</label>
              <input
                type="text"
                value={settings.smtp_user || ''}
                onChange={(e) => handleChange('smtp_user', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-brand-dark block mb-1">SMTP Password</label>
              <input
                type="password"
                value={settings.smtp_pass || ''}
                onChange={(e) => handleChange('smtp_pass', e.target.value)}
                className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
              />
            </div>
          </div>

          {/* Test Email Tester */}
          <div className="bg-brand-soft border border-brand-border p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3">
            <input
              type="email"
              placeholder="Test recipient email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 p-2 bg-white border border-brand-border rounded-xl text-xs"
            />
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="bg-brand-dark text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-black transition flex-shrink-0"
            >
              {testingEmail ? 'Testing Dispatch...' : 'Test Email Dispatch'}
            </button>
          </div>
        </div>

        {/* 3. Storage Provider Manager (Multi-Account Google Drive) */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-lg text-brand-dark flex items-center gap-2 border-b pb-2">
            <HardDrive className="w-5 h-5 text-brand-yellow" />
            <span>3. Storage Provider (Local / Vercel Blob / Multi-Account Google Drive)</span>
          </h3>

          <div>
            <label className="font-bold text-brand-dark block mb-2 text-xs">Select Active Storage Engine</label>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {['LOCAL', 'VERCEL_BLOB', 'GOOGLE_DRIVE'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleChange('storage_provider', mode)}
                  className={`p-3 rounded-2xl border font-bold text-center transition ${settings.storage_provider === mode ? 'bg-brand-yellow border-brand-yellow text-brand-dark shadow-md' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Account Google Drive Config */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm text-brand-dark">Configured Google Drive Accounts</h4>
                <p className="text-[11px] text-gray-500">When Account #1 reaches 98% quota, storage automatically fails over to Account #2</p>
              </div>
            </div>

            <div className="space-y-2">
              {googleAccounts.map((acc, idx) => (
                <div key={idx} className="p-3 bg-brand-soft border border-brand-border rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <b className="block text-brand-dark">{acc.name || `Drive Account ${idx + 1}`}</b>
                    <span className="text-[10px] text-gray-400 font-mono">Client ID: {acc.clientId?.substring(0, 20)}...</span>
                  </div>
                  <button onClick={() => handleRemoveDriveAccount(idx)} className="text-red-500 font-bold hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Form to add Google Drive Account */}
            <div className="bg-gray-50 p-4 border rounded-2xl space-y-3 text-xs">
              <b className="block text-brand-dark font-bold">Add Google Drive Storage Account</b>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Account Label (e.g. Account 1 - 15GB)"
                  value={newDriveAcc.name}
                  onChange={(e) => setNewDriveAcc({ ...newDriveAcc, name: e.target.value })}
                  className="p-2 bg-white border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Client ID"
                  value={newDriveAcc.clientId}
                  onChange={(e) => setNewDriveAcc({ ...newDriveAcc, clientId: e.target.value })}
                  className="p-2 bg-white border rounded-xl"
                />
                <input
                  type="password"
                  placeholder="Client Secret"
                  value={newDriveAcc.clientSecret}
                  onChange={(e) => setNewDriveAcc({ ...newDriveAcc, clientSecret: e.target.value })}
                  className="p-2 bg-white border rounded-xl"
                />
                <input
                  type="password"
                  placeholder="Refresh Token"
                  value={newDriveAcc.refreshToken}
                  onChange={(e) => setNewDriveAcc({ ...newDriveAcc, refreshToken: e.target.value })}
                  className="p-2 bg-white border rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={handleAddDriveAccount}
                className="bg-brand-yellow text-brand-dark font-extrabold px-4 py-2 rounded-xl hover:bg-brand-yellowDark transition shadow"
              >
                Add Account to Failover Pool
              </button>
            </div>

            {/* In-App Setup Instructions */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-xs space-y-2 text-amber-900">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <Info className="w-4 h-4" />
                <span>Google Drive Setup Instructions</span>
              </div>
              <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                {guide}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
