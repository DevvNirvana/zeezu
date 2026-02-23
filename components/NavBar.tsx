import Link from 'next/link';
import { Zap, Users, MessageSquare, LayoutDashboard } from 'lucide-react';

export default function NavBar() {
  return (
    <nav className="w-full bg-indigo border-b-2 border-electric/50 shadow-[0_4px_20px_rgba(138,46,255,0.2)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="bg-void border border-electric/50 p-1.5 rounded-md group-hover:bg-electric/20 transition-colors">
            <Zap className="text-cyan w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tighter lowercase bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent group-hover:from-cyan group-hover:to-electric transition-all">
            zeezu
          </span>
        </Link>

        {/* The "Chunky" 2000s Style Links */}
        <div className="hidden md:flex items-center gap-2">
          <NavButton href="/dashboard" icon={<LayoutDashboard size={18} />} text="Home" />
          <NavButton href="/profile" icon={<Users size={18} />} text="Profile" />
          <NavButton href="/zeewall" icon={<MessageSquare size={18} />} text="ZeeWall" />
        </div>

        {/* BBM-Style Status Indicator */}
        <div className="flex items-center gap-3 bg-void px-3 py-1.5 border border-gray-800 rounded-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-lime shadow-[0_0_8px_#B4FF00] animate-pulse"></div>
          <span className="text-xs font-mono text-gray-300">ZID: ACTIVE</span>
        </div>

      </div>
    </nav>
  );
}

// A helper component for those 4K Glossy Buttons
function NavButton({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-indigo to-void border border-gray-700 hover:border-electric hover:from-electric/20 hover:to-void text-gray-300 hover:text-white rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all font-semibold text-sm"
    >
      {icon}
      {text}
    </Link>
  );
}