import GlobalLayout from '@/components/GlobalLayout';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <GlobalLayout>{children}</GlobalLayout>;
}
