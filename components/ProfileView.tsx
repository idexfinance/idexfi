'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { loadHistory } from '@/lib/history';

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadLocalProfile(address: string) {
  try {
    const raw = localStorage.getItem(`idex_profile_${address.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveLocalProfile(address: string, username: string, avatar: string) {
  try {
    localStorage.setItem(
      `idex_profile_${address.toLowerCase()}`,
      JSON.stringify({ username, avatar })
    );
  } catch { /* ignore */ }
}

// ── Stats derived from history ────────────────────────────────────────────────
async function computeStats(address: string) {
  const records = await loadHistory(address);
  const swapCount = records.length;

  const STABLES = ['USDC', 'USDT', 'DAI'];
  let volumeUsd = 0;
  for (const r of records) {
    if (STABLES.includes(r.tokenOut.toUpperCase())) {
      volumeUsd += parseFloat(r.amountOut) || 0;
    } else if (STABLES.includes(r.tokenIn.toUpperCase())) {
      volumeUsd += parseFloat(r.amountIn) || 0;
    }
  }

  const days = new Set(records.map(r => new Date(r.timestamp).toDateString()));
  const activeDays = days.size;

  const firstTs = records.length > 0
    ? Math.min(...records.map(r => r.timestamp))
    : null;

  return { swapCount, volumeUsd, activeDays, firstTs };
}

// ── Avatar list ───────────────────────────────────────────────────────────────
const AVATARS = ['🦊','🐺','🦁','🐯','🐻','🦝','🐼','🦄','🐉','🤖','👾','🎭'];

// ── Not connected ─────────────────────────────────────────────────────────────
export function ProfileView() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl p-10 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Connect Your Wallet</h2>
        <p className="text-gray-500 text-sm">Connect your wallet to view your profile.</p>
      </div>
    );
  }

  return <ProfileContent address={address!} />;
}

// ── Main profile content ──────────────────────────────────────────────────────
function ProfileContent({ address }: { address: string }) {
  const [username, setUsername]   = useState('iDEX User');
  const [avatar, setAvatar]       = useState('🦊');
  const [editOpen, setEditOpen]   = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editAvatar, setEditAvatar] = useState('🦊');
  const [stats, setStats] = useState({ swapCount: 0, volumeUsd: 0, activeDays: 0, firstTs: null as number | null });

  useEffect(() => {
    const p = loadLocalProfile(address);
    if (p) { setUsername(p.username); setAvatar(p.avatar); }
    computeStats(address).then(setStats);
  }, [address]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setUsername(trimmed);
    setAvatar(editAvatar);
    setEditOpen(false);
    saveLocalProfile(address, trimmed, editAvatar);
  };

  const memberSince = stats.firstTs
    ? new Date(stats.firstTs).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* ── Card 1: Profile info ── */}
      <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl px-6 py-6">
        {/* Avatar left, info right, Edit button bottom right */}
        <div className="flex items-start gap-5">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-orange-100/10 border-4 border-[#9B8AFF] flex items-center justify-center text-4xl shadow-lg shrink-0">
            {avatar}
          </div>

          {/* Center: name + address + basescan */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-extrabold text-gray-800 mb-1">{username}</p>
            <p className="text-xs font-mono text-gray-500 break-all leading-relaxed">
              {address}
            </p>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              View on BaseScan
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Edit button — bottom right, aligned with BaseScan */}
          <div className="flex flex-col items-end justify-end self-stretch">
            <button
              onClick={() => { setEditValue(username); setEditAvatar(avatar); setEditOpen(true); }}
              className="flex items-center gap-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-400/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full transition-all mt-auto"
            >
              ✏️ Edit
            </button>
          </div>

        </div>
      </div>

      {/* ── Card 2: iDEX statistics ── */}
      <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl px-6 py-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          iDEX Statistics
        </p>

        <div className="grid grid-cols-3 gap-4">
          {/* Swap count */}
          <div className="bg-orange-500/8 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-800">{stats.swapCount}</p>
            <p className="text-xs text-gray-500 mt-1">Total Swaps</p>
          </div>

          {/* Hacim */}
          <div className="bg-orange-500/8 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-800">
              {stats.volumeUsd >= 1000
                ? `$${(stats.volumeUsd / 1000).toFixed(1)}K`
                : `$${stats.volumeUsd.toFixed(0)}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">Volume (USD)</p>
          </div>

          {/* Active days */}
          <div className="bg-orange-500/8 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-800">{stats.activeDays}</p>
            <p className="text-xs text-gray-500 mt-1">Active Days</p>
          </div>
        </div>

        {/* First transaction date */}
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-orange-100/10">
          <span className="text-xs text-gray-500">First Transaction</span>
          <span className="text-xs font-semibold text-gray-700">{memberSince}</span>
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-orange-100/15">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Profile</h3>

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Avatar</label>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setEditAvatar(a)}
                  className={`text-2xl w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                    editAvatar === a
                      ? 'bg-orange-500/20 border-2 border-orange-400 scale-110'
                      : 'bg-orange-100/5 border-2 border-transparent hover:bg-orange-100/10'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              maxLength={32}
              placeholder="iDEX User"
              className="w-full px-4 py-2.5 bg-orange-100/5 border border-orange-200/20 rounded-xl outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/10 text-gray-800 text-sm mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm transition-all"
              >
                Save
              </button>
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 bg-gray-100/10 hover:bg-gray-100/20 text-gray-600 rounded-xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
