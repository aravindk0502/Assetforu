export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireUser } from '@/app/api/_utils/userAuth';
import { loadTransactions } from '@/app/api/_utils/blobTransactions';

type WalletTxn = {
  id: string;
  direction?: 'credit' | 'debit' | string;
  credits?: number;
  description?: string;
  reference_id?: string;
  status?: string;
  created_at?: string;
  phone_last10?: string;
};

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const txns = (await loadTransactions()) as WalletTxn[];
  const mine = txns
    .filter((t) => t.phone_last10 === auth.phoneLast10)
    .filter((t) => String(t.status || '').toLowerCase() === 'completed')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  let balance = 0;
  for (const t of mine) {
    const credits = Number(t.credits || 0);
    if (!Number.isFinite(credits) || credits <= 0) continue;
    if (t.direction === 'debit') balance -= credits;
    else balance += credits;
  }
  if (balance < 0) balance = 0;

  return Response.json({
    success: true,
    data: {
      balance,
      transactions: mine.slice(0, 50).map((t) => ({
        id: t.id,
        type: t.direction === 'debit' ? 'debit' : 'credit',
        description: t.description || 'Transaction',
        credits: Number(t.credits || 0),
        reference_id: t.reference_id || '',
        createdAt: t.created_at || new Date().toISOString(),
      })),
    },
  });
}

