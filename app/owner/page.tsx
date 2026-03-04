'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  Settings,
  LogOut,
  ShieldCheck,
  Plus,
  ScanLine,
  User,
} from 'lucide-react';

import OwnerDashboard from '@/components/Owner/OwnerDashboard';
import MenuUpload from '@/components/Owner/MenuUpload';
import PersonaSetup from '@/components/Owner/PersonaSetup';
import MenuImport from '@/components/Owner/MenuImport';
import { Button } from '@/components/ui/button';
import initialMenu from '@/data/menuItems.json';
import { loadOrdersFromStorage } from '@/utils/guestMemory';

type Tab = 'dashboard' | 'menu' | 'persona' | 'settings' | 'import';

export default function OwnerPortalPage() {
  const router = useRouter();
  const [ownerData, setOwnerData] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [menu, setMenu] = useState<any[]>(initialMenu);
  const [orders, setOrders] = useState<any[]>([]);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [settingsEditing, setSettingsEditing] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ restaurantName: '', username: '', email: '', phone: '', tableCount: '' });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ownerData');
    if (saved) setOwnerData(JSON.parse(saved));
    setOrders(loadOrdersFromStorage());
    setHydrated(true);
  }, []);

  const handleLogin = () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }
    if (ownerData && loginUsername === ownerData.username && loginPassword === ownerData.password) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Please check your username and password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
    router.push('/');
  };

  // Not yet hydrated — avoid flash
  if (!hydrated) return null;

  // No owner data — prompt registration
  if (!ownerData) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-stone-100 p-10 space-y-8 text-center"
        >
          <div className="w-16 h-16 apple-red rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/20">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-black text-stone-900">Welcome to Sliced.ai</h2>
            <p className="text-stone-500 mt-2">Set up your restaurant Mission Control to get started.</p>
          </div>
          <div className="space-y-3">
            <Link href="/onboarding">
              <Button className="w-full py-4 rounded-2xl font-bold text-base h-auto">
                <Plus className="w-4 h-4 mr-2" /> Register Your Restaurant
              </Button>
            </Link>
            <Link href="/" className="block text-stone-400 text-xs font-bold uppercase tracking-widest hover:text-stone-600 transition-colors pt-2">
              Back to Landing
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Owner data exists — show login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-stone-100 p-10 space-y-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 apple-red rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-serif font-black text-stone-900">Mission Control</h2>
            <p className="text-stone-500">
              Secure access for{' '}
              <span className="font-bold text-stone-700">{ownerData.restaurantName || 'Restaurant Owner'}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Username</label>
              <input
                type="text"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm"
                value={loginUsername}
                onChange={e => { setLoginUsername(e.target.value); setLoginError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Password</label>
              <input
                type="password"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm"
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
            <Button onClick={handleLogin} className="w-full py-4 rounded-2xl font-bold h-auto">
              Login to Dashboard
            </Button>

            <div className="flex flex-col items-center gap-4 pt-4 border-t border-stone-100">
              <p className="text-xs text-stone-400 font-medium">Not registered yet?</p>
              <Link href="/onboarding">
                <button className="flex items-center gap-2 px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-all">
                  <Plus className="w-3 h-3" />
                  Register New Restaurant
                </button>
              </Link>
            </div>

            <Link href="/" className="block text-center text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:text-stone-600 transition-colors pt-2">
              Back to Landing
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Logged in — full owner portal
  const TABS = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu' as Tab, label: 'Menu Intelligence', icon: UtensilsCrossed },
    { id: 'import' as Tab, label: 'Import Menu', icon: ScanLine },
    { id: 'persona' as Tab, label: 'AI Persona', icon: Sparkles },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-stone-100 p-8 flex flex-col shadow-sm">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 apple-red rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-stone-900 leading-none">Sliced.ai</h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              {ownerData.restaurantName}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {TABS.map(tab => (
            <React.Fragment key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20'
                    : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
              {tab.id === 'persona' && (
                <Link
                  href="/ordering"
                  target="_blank"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-all"
                >
                  <User className="w-5 h-5" />
                  Guest View
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Quick links */}
        <div className="pt-4 border-t border-stone-100 space-y-1">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-4 py-2 text-stone-400 hover:text-stone-600 font-bold text-xs transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Operator Dashboard (AI)
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-red-500 font-bold text-sm transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <OwnerDashboard menu={menu} orders={orders} />}
            {activeTab === 'menu' && <MenuUpload menu={menu} onUpdate={setMenu} />}
            {activeTab === 'import' && <MenuImport />}
            {activeTab === 'persona' && ownerData.persona && (
              <PersonaSetup
                config={ownerData.persona}
                onUpdate={p => {
                  const updated = { ...ownerData, persona: p };
                  setOwnerData(updated);
                  localStorage.setItem('ownerData', JSON.stringify(updated));
                }}
              />
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-stone-900">Settings</h2>
                    <p className="text-stone-500">Manage your restaurant configuration.</p>
                  </div>
                  {!settingsEditing && (
                    <button
                      onClick={() => {
                        setSettingsForm({
                          restaurantName: ownerData.restaurantName || '',
                          username: ownerData.username || '',
                          email: ownerData.email || '',
                          phone: ownerData.phone || '',
                          tableCount: String(ownerData.tableCount || ''),
                        });
                        setSettingsEditing(true);
                        setSettingsSaved(false);
                      }}
                      className="px-5 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-700 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm space-y-6">
                  <h3 className="text-xl font-serif font-bold text-stone-900">Restaurant Info</h3>

                  {settingsEditing ? (
                    <div className="space-y-4">
                      {[
                        { key: 'restaurantName', label: 'Restaurant Name', type: 'text' },
                        { key: 'username', label: 'Owner Name', type: 'text' },
                        { key: 'email', label: 'Email', type: 'email' },
                        { key: 'phone', label: 'Phone Number', type: 'tel' },
                        { key: 'tableCount', label: 'Number of Tables', type: 'number' },
                      ].map(({ key, label, type }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</label>
                          <input
                            type={type}
                            value={(settingsForm as any)[key]}
                            onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/10 text-sm font-bold text-stone-900"
                          />
                        </div>
                      ))}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            const updated = {
                              ...ownerData,
                              restaurantName: settingsForm.restaurantName,
                              username: settingsForm.username,
                              email: settingsForm.email,
                              phone: settingsForm.phone,
                              tableCount: Number(settingsForm.tableCount) || ownerData.tableCount,
                            };
                            setOwnerData(updated);
                            localStorage.setItem('ownerData', JSON.stringify(updated));
                            setSettingsEditing(false);
                            setSettingsSaved(true);
                          }}
                          className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setSettingsEditing(false)}
                          className="px-6 py-3 bg-stone-50 text-stone-600 rounded-xl font-bold text-sm border border-stone-200 hover:bg-stone-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      {[
                        { label: 'Restaurant Name', value: ownerData.restaurantName },
                        { label: 'Tables', value: ownerData.tableCount },
                        { label: 'Owner Name', value: ownerData.username },
                        { label: 'Email', value: ownerData.email || '—' },
                        { label: 'Phone', value: ownerData.phone || '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{label}</p>
                          <p className="font-bold text-stone-900">{value}</p>
                        </div>
                      ))}
                      {settingsSaved && (
                        <div className="col-span-2">
                          <p className="text-green-600 text-xs font-bold">Settings saved successfully.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm">
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Danger Zone</h3>
                  <p className="text-stone-400 text-sm mb-4">This will erase all data and return you to onboarding.</p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all data?')) {
                        localStorage.removeItem('ownerData');
                        localStorage.removeItem('slicedOrders');
                        router.push('/onboarding');
                      }
                    }}
                    className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    Reset Restaurant Data
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
