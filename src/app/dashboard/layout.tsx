import { getSession } from '@/lib/auth/session';
import { getAdminClient } from '@/lib/supabase/admin';
import ClientLayout from './ClientLayout';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || !session.tenantId) {
    redirect('/login');
  }

  const db = getAdminClient();
  const { data: settings } = await db
    .from('tenant_settings')
    .select('setting_value')
    .eq('tenant_id', session.tenantId)
    .eq('setting_key', 'customization')
    .single();

  const { data: user } = await db
    .from('users')
    .select('first_name, last_name, email')
    .eq('user_id', session.userId)
    .single();

  if (!settings) {
    // The user has not deployed a store yet. Show the premium No Store page.
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-body">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF4D00]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
        
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

        {/* Minimal Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Monolith" className="w-8 h-8 rounded-md mix-blend-screen opacity-80" />
            <span className="font-heading text-xl tracking-tighter uppercase text-white/90">Monolith</span>
          </Link>
          <Link href="/" className="text-white/50 hover:text-white transition-colors text-sm font-medium tracking-wide">
            Back to Home
          </Link>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/60 text-xs font-accent uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-[#FF4D00] mr-2 animate-pulse" />
            Infrastructure Missing
          </div>
          
          <h1 className="font-heading text-6xl md:text-[80px] lg:text-[100px] leading-[0.9] tracking-tighter uppercase mb-6 max-w-4xl mx-auto">
            You Currently <br />
            <span className="text-white/40">Have No Store</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-16 leading-relaxed">
            Your empire is waiting to be built. Provision your infrastructure, select a premium architecture, and dominate your industry.
          </p>

          <Link 
            href="/#pricing"
            className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-[#111111] px-12 font-medium text-neutral-200 border border-white/10 transition-all duration-300 hover:border-[#FF4D00]/50 hover:shadow-[0_0_40px_rgba(255,77,0,0.3)]"
          >
            <span className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-8 bg-white/20" />
            </span>
            <span className="absolute inset-0 bg-[#FF4D00] translate-y-[100%] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
            <span className="relative z-10 flex items-center gap-2 font-accent uppercase tracking-widest text-sm font-bold group-hover:text-white transition-colors duration-300">
              Deploy Your Empire
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </span>
          </Link>
        </main>
      </div>
    );
  }

  return <ClientLayout user={user}>{children}</ClientLayout>;
}
