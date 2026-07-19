import { Navigation } from '@/components/Navigation';
import { SwapHistory } from '@/components/SwapHistory';

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-base">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SwapHistory />
      </main>
    </div>
  );
}
