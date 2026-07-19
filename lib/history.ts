// Swap history — localStorage (offline cache) + Supabase (persistent)

import { supabase } from './supabase';

export interface SwapRecord {
  hash: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: number; // ms
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = (wallet: string) => `idex_history_${wallet.toLowerCase()}`;

function lsLoad(wallet: string): SwapRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY(wallet));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsSave(wallet: string, records: SwapRecord[]): void {
  try {
    localStorage.setItem(LS_KEY(wallet), JSON.stringify(records.slice(0, 100)));
  } catch { /* ignore */ }
}

// ── Save swap — localStorage + Supabase ──────────────────────────────────────
export async function saveSwap(wallet: string, record: SwapRecord): Promise<void> {
  // 1. localStorage
  const existing = lsLoad(wallet);
  const updated  = [record, ...existing.filter(r => r.hash !== record.hash)];
  lsSave(wallet, updated);

  // 2. Supabase (fire and forget — don't block UI)
  supabase.from('transactions').upsert({
    hash:       record.hash,
    wallet:     wallet.toLowerCase(),
    token_in:   record.tokenIn,
    token_out:  record.tokenOut,
    amount_in:  record.amountIn,
    amount_out: record.amountOut,
    timestamp:  record.timestamp,
  }, { onConflict: 'hash' }).then(({ error }) => {
    if (error) console.error('Supabase saveSwap error:', error.message);
  });
}

// ── Load history — Supabase first, fallback to localStorage ──────────────────
export async function loadHistory(wallet: string): Promise<SwapRecord[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('hash, token_in, token_out, amount_in, amount_out, timestamp')
    .eq('wallet', wallet.toLowerCase())
    .order('timestamp', { ascending: false })
    .limit(200);

  if (error || !data) {
    // If Supabase is unreachable, fall back to localStorage
    return lsLoad(wallet);
  }

  const records: SwapRecord[] = data.map((r: any) => ({
    hash:      r.hash,
    tokenIn:   r.token_in,
    tokenOut:  r.token_out,
    amountIn:  r.amount_in,
    amountOut: r.amount_out,
    timestamp: r.timestamp,
  }));

  // Also update localStorage (offline cache)
  lsSave(wallet, records);

  return records;
}
