import { Navigation } from '@/components/Navigation';
import { SwapInterface } from '@/components/SwapInterface';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <SwapInterface />
        </div>
      </main>
    </div>
  );
}
