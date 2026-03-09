'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  History,
  Gavel,
  Users,
  Settings,
  Shield,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SidebarLink = ({ icon: Icon, label, href, onClick }: { icon: any, label: string, href: string, onClick?: (e: React.MouseEvent) => void }) => {
  const pathname = usePathname();

  // The Home button (href '/mode-selection') should also be active on debate setup pages
  const isHomeLink = href === '/mode-selection';
  const isDebateSetup = pathname?.startsWith('/debate/challenge') || pathname?.startsWith('/debate/practice');
  const active = pathname === href || (isHomeLink && isDebateSetup);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-all ${active
        ? 'bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20'
        : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
};

export default function Sidebar({ onNavigate }: { onNavigate?: (href: string) => boolean }) {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
        } else {
          setProfile({ full_name: user.email?.split('@')[0] || 'User' });
        }
      }
    }
    getProfile();
  }, [supabase]);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (onNavigate) {
      const allow = onNavigate(href);
      if (!allow) {
        e.preventDefault();
      }
    }
  };

  return (
    <aside className="w-72 flex flex-col bg-white border-r border-slate-200 p-6 shrink-0 h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="size-10 rounded-xl bg-[#585bf3] flex items-center justify-center text-white shadow-lg shadow-[#585bf3]/20">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-900 text-base font-bold leading-none">Debate Master</h1>
          <p className="text-[#585bf3] text-[10px] font-bold uppercase tracking-wider mt-1">Pro League</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-grow">
        <SidebarLink icon={Home} label="Home" href="/mode-selection" onClick={(e) => handleLinkClick(e, '/mode-selection')} />
        <SidebarLink icon={History} label="Debates" href="/debates" onClick={(e) => handleLinkClick(e, '/debates')} />
        <SidebarLink icon={Users} label="Network" href="/friends" onClick={(e) => handleLinkClick(e, '/friends')} />
        <SidebarLink icon={Settings} label="Settings" href="/settings" onClick={(e) => handleLinkClick(e, '/settings')} />
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl mt-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Image
              alt="User Profile"
              className="size-10 rounded-full object-cover shrink-0"
              src={profile?.avatar_url || "https://picsum.photos/seed/alex/100/100"}
              width={40}
              height={40}
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold truncate">
                {profile?.full_name || 'Loading...'}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                {profile?.rank || 'Debater'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
