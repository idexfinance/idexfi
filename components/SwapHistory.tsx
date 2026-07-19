'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { loadHistory, type SwapRecord } from '@/lib/history';

const PAGE_SIZE = 10;

// ── Time helper ───────────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Single row ────────────────────────────────────────────────────────────────
function HistoryRow({ record }: { record: SwapRecord }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-orange-100/10 last:border-0">
      <div>
        <p className="font-bold text-gray-800 text-sm">
          Swap {record.tokenIn} → {record.tokenOut}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{timeAgo(record.timestamp)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full">
          Confirmed
        </span>
        <a
          href={`https://basescan.org/tx/${record.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on BaseScan"
          className="text-gray-500 hover:text-orange-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Pagination controls ───────────────────────────────────────────────────────
function Pagination({
  page, totalPages, onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Show at most 5 page buttons around current page
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1.5 py-4 border-t border-orange-100/10">
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm text-gray-500 hover:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Previous
      </button>

      {/* Page numbers */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
            p === page
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
              : 'text-gray-500 hover:bg-orange-500/10 hover:text-orange-400'
          }`}
        >
          {p}
        </button>
      ))}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm text-gray-500 hover:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function SwapHistory() {
  const { address, isConnected } = useAccount();
  const [records, setRecords]   = useState<SwapRecord[]>([]);
  const [page, setPage]         = useState(1);

  const reload = async () => {
    if (!address) return;
    const data = await loadHistory(address);
    setRecords(data);
    setPage(1);
  };

  useEffect(() => {
    reload();
    window.addEventListener('idex_swap_completed', reload);
    return () => window.removeEventListener('idex_swap_completed', reload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const totalPages  = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!isConnected) {
    return (
      <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl p-10 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Connect Your Wallet</h2>
        <p className="text-gray-500 text-sm">Connect your wallet to view transaction history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-orange-100/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
          {records.length > 0 && (
            <span className="text-xs text-gray-500">
              {records.length} transactions · Page {page}/{totalPages}
            </span>
          )}
        </div>

        {/* Rows */}
        <div className="px-6">
          {records.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">No transactions yet.</p>
              <a href="/" className="mt-3 inline-block text-sm font-medium text-orange-400 hover:underline">
                Start swapping →
              </a>
            </div>
          ) : (
            pageRecords.map((r) => <HistoryRow key={r.hash} record={r} />)
          )}
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
