import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  Database,
  Mail,
  RefreshCw,
  Building2,
  Smartphone,
} from 'lucide-react';
import { StoreApi } from '../../services/api';
import { getDefaultPaymentInstructions } from '../../services/firestoreStore';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminSettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Public Store Identity
  const [storeName, setStoreName] = useState('MK Labs Digital Store');
  const [storeDescription, setStoreDescription] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('PKR');
  const [isStoreVisible, setIsStoreVisible] = useState(true);

  // Payment Instructions: Bank Transfer
  const [bankEnabled, setBankEnabled] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountTitle, setBankAccountTitle] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankBranchCode, setBankBranchCode] = useState('');
  const [bankInstructions, setBankInstructions] = useState('');

  // Payment Instructions: Easypaisa
  const [epEnabled, setEpEnabled] = useState(false);
  const [epAccountTitle, setEpAccountTitle] = useState('');
  const [epAccountNumber, setEpAccountNumber] = useState('');
  const [epInstructions, setEpInstructions] = useState('');

  // Payment Instructions: JazzCash
  const [jcEnabled, setJcEnabled] = useState(false);
  const [jcAccountTitle, setJcAccountTitle] = useState('');
  const [jcAccountNumber, setJcAccountNumber] = useState('');
  const [jcInstructions, setJcInstructions] = useState('');

  // General Payment Notes & Support Email
  const [generalInstructions, setGeneralInstructions] = useState(
    getDefaultPaymentInstructions().generalInstructions || ''
  );
  const [supportEmail, setSupportEmail] = useState('');

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const [res, payCfg] = await Promise.all([
        StoreApi.getStoreSettings(),
        StoreApi.getPaymentInstructions(),
      ]);

      setStoreName(res.storeName);
      setStoreDescription(res.storeDescription || '');
      setDefaultCurrency(res.defaultCurrency || 'PKR');
      setIsStoreVisible(res.isStoreVisible ?? true);

      setBankEnabled(payCfg.bankTransfer.enabled);
      setBankName(payCfg.bankTransfer.bankName);
      setBankAccountTitle(payCfg.bankTransfer.accountTitle);
      setBankAccountNumber(payCfg.bankTransfer.accountNumber);
      setBankIban(payCfg.bankTransfer.iban || '');
      setBankBranchCode(payCfg.bankTransfer.branchCode || '');
      setBankInstructions(payCfg.bankTransfer.instructions || '');

      setEpEnabled(payCfg.easypaisa.enabled);
      setEpAccountTitle(payCfg.easypaisa.accountTitle);
      setEpAccountNumber(payCfg.easypaisa.accountNumber);
      setEpInstructions(payCfg.easypaisa.instructions || '');

      setJcEnabled(payCfg.jazzcash.enabled);
      setJcAccountTitle(payCfg.jazzcash.accountTitle);
      setJcAccountNumber(payCfg.jazzcash.accountNumber);
      setJcInstructions(payCfg.jazzcash.instructions || '');

      setGeneralInstructions(payCfg.generalInstructions || '');
      setSupportEmail(payCfg.supportEmail || '');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load store settings.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    void fetchSettings();
  }, [isAdmin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccess(false);

    if (
      bankEnabled &&
      (!bankName.trim() || !bankAccountTitle.trim() || !bankAccountNumber.trim())
    ) {
      setErrorMsg(
        'Bank Name, Account Title, and Account Number are required when Bank Transfer is enabled.'
      );
      return;
    }
    if (epEnabled && (!epAccountTitle.trim() || !epAccountNumber.trim())) {
      setErrorMsg(
        'Easypaisa Account Title and Account Number are required when Easypaisa is enabled.'
      );
      return;
    }
    if (jcEnabled && (!jcAccountTitle.trim() || !jcAccountNumber.trim())) {
      setErrorMsg(
        'JazzCash Account Title and Account Number are required when JazzCash is enabled.'
      );
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all([
        StoreApi.updateStoreSettings({
          storeName,
          storeDescription,
          defaultCurrency,
          isStoreVisible,
        }),
        StoreApi.updatePaymentInstructions({
          bankTransfer: {
            enabled: bankEnabled,
            bankName,
            accountTitle: bankAccountTitle,
            accountNumber: bankAccountNumber,
            iban: bankIban,
            branchCode: bankBranchCode,
            instructions: bankInstructions,
          },
          easypaisa: {
            enabled: epEnabled,
            accountTitle: epAccountTitle,
            accountNumber: epAccountNumber,
            instructions: epInstructions,
          },
          jazzcash: {
            enabled: jcEnabled,
            accountTitle: jcAccountTitle,
            accountNumber: jcAccountNumber,
            instructions: jcInstructions,
          },
          generalInstructions,
          supportEmail,
        }),
      ]);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to save settings.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout currentTab="settings">
      <div className="space-y-6 max-w-4xl pb-12 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Store &amp; Payment Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure Bank Transfer, Easypaisa, and JazzCash payment instructions shown to customers after placing an order.
            </p>
          </div>

          {saveSuccess && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200 self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Settings saved to Firestore!</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium break-words">
            {errorMsg}
          </div>
        )}

        {/* Active Architecture Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  Cloud Firestore
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected &amp; Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Products, categories, customer orders, and manual payment instructions are persisted in Cloud Firestore.
            </p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  PDF Fulfillment Mode
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Manual Email Delivery
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Starter Tier mode (no Firebase Storage). Admins verify manual payments in Orders and send local PDFs via Gmail.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-6 sm:space-y-8 text-xs"
        >
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading store &amp; payment configuration...
            </div>
          ) : (
            <>
              {/* Section 1: Manual Payment Instructions */}
              <div className="space-y-5">
                <div className="pb-2 border-b border-slate-100 space-y-1.5">
                  <h2 className="text-sm font-bold text-slate-900">
                    Manual Payment Instructions (Customer Order Confirmation)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Enable the local payment channels you accept and enter your account details. Only enabled methods are displayed on order confirmation pages.
                  </p>
                  <p className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-3 py-2 leading-relaxed">
                    <strong>Payoneer Orders:</strong> Payoneer uses per-order Payment Request Links that you create inside your Payoneer account and paste directly into <strong>Admin → Orders</strong>. Your Payoneer bank receiving account details are never stored or displayed publicly.
                  </p>
                </div>

                {/* Bank Transfer */}
                <div className="p-3.5 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Bank Transfer
                    </span>
                    <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700 min-h-[40px] sm:min-h-0 px-1">
                      <input
                        type="checkbox"
                        checked={bankEnabled}
                        onChange={(e) => setBankEnabled(e.target.checked)}
                        className="rounded text-blue-600 w-4 h-4"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Meezan Bank / HBL"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        value={bankAccountTitle}
                        onChange={(e) => setBankAccountTitle(e.target.value)}
                        placeholder="Account holder name"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="Account number"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        IBAN (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankIban}
                        onChange={(e) => setBankIban(e.target.value)}
                        placeholder="PK..."
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Branch Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankBranchCode}
                        onChange={(e) => setBankBranchCode(e.target.value)}
                        placeholder="0000"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Bank Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankInstructions}
                        onChange={(e) => setBankInstructions(e.target.value)}
                        placeholder="Include your Order ID in transfer remarks"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Easypaisa & JazzCash */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                        <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                        Easypaisa
                      </span>
                      <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700 min-h-[40px] sm:min-h-0 px-1">
                        <input
                          type="checkbox"
                          checked={epEnabled}
                          onChange={(e) => setEpEnabled(e.target.checked)}
                          className="rounded text-blue-600 w-4 h-4"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        value={epAccountTitle}
                        onChange={(e) => setEpAccountTitle(e.target.value)}
                        placeholder="Account holder name"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Easypaisa Number
                      </label>
                      <input
                        type="text"
                        value={epAccountNumber}
                        onChange={(e) => setEpAccountNumber(e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={epInstructions}
                        onChange={(e) => setEpInstructions(e.target.value)}
                        placeholder="Enter TID after sending"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                        <Smartphone className="w-4 h-4 text-rose-600 shrink-0" />
                        JazzCash
                      </span>
                      <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700 min-h-[40px] sm:min-h-0 px-1">
                        <input
                          type="checkbox"
                          checked={jcEnabled}
                          onChange={(e) => setJcEnabled(e.target.checked)}
                          className="rounded text-blue-600 w-4 h-4"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        value={jcAccountTitle}
                        onChange={(e) => setJcAccountTitle(e.target.value)}
                        placeholder="Account holder name"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        JazzCash Number
                      </label>
                      <input
                        type="text"
                        value={jcAccountNumber}
                        onChange={(e) => setJcAccountNumber(e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={jcInstructions}
                        onChange={(e) => setJcInstructions(e.target.value)}
                        placeholder="Enter TID after sending"
                        className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Support Email (Shown on Order Confirmation)
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="orders@mklabs.example"
                      className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded text-slate-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      General Payment &amp; Delivery Note
                    </label>
                    <textarea
                      rows={2}
                      value={generalInstructions}
                      onChange={(e) => setGeneralInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Store Identity */}
              <div>
                <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 mb-4">
                  Store Identity &amp; Visibility
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                      className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Default Currency
                    </label>
                    <select
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="w-full px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded text-slate-900 bg-white"
                    >
                      <option value="PKR">PKR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Store Tagline / Description
                    </label>
                    <textarea
                      rows={2}
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      className="w-full px-3 py-2 text-base sm:text-xs border border-slate-300 rounded text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 min-h-[40px] sm:min-h-0">
                      <input
                        type="checkbox"
                        checked={isStoreVisible}
                        onChange={(e) => setIsStoreVisible(e.target.checked)}
                        className="rounded text-blue-600 w-4 h-4 shrink-0"
                      />
                      <span>Make Store Visible in Navigation and Public Routes</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? 'Saving Settings...'
                      : 'Save Store & Payment Settings'}
                  </span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </AdminLayout>
  );
};
