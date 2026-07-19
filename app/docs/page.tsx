import { Navigation } from '@/components/Navigation';
import { DocsLayout } from '@/components/DocsLayout';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-base">
      <Navigation />
      <DocsLayout />
    </div>
  );
}
