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
import { getUserSubscriptionClient } from '@/lib/subscription/client';

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
  const [subscription, setSubscription] = useState<{ tier: 'free' | 'pro' | null; isActive: boolean } | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let channel: any;

    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Initial fetch
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
          // Fetch subscription status
          const sub = await getUserSubscriptionClient(user.id);
          setSubscription(sub);
        } else {
          setProfile({ full_name: user.email?.split('@')[0] || 'User' });
          setSubscription({ tier: 'free', isActive: true });
        }

        // Subscribe to changes
        channel = supabase
          .channel(`profile-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
            },
            async (payload) => {
              setProfile(payload.new);
              // Refresh subscription status when profile changes
              const updatedSub = await getUserSubscriptionClient(user.id);
              setSubscription(updatedSub);
            }
          )
          .subscribe();
      }
    }

    getProfile();

    // Listen for subscription update events (e.g., after payment completion)
    const handleSubscriptionUpdate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updatedSub = await getUserSubscriptionClient(user.id);
        setSubscription(updatedSub);
      }
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
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
            <div className="relative shrink-0">
              <Image
                alt="User Profile"
                className="size-10 rounded-full object-cover"
                src={(profile?.avatar_url && !profile.avatar_url.includes('picsum.photos')) ? profile.avatar_url : "/avatars/default.png"}
                width={40}
                height={40}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">
                  {profile?.full_name || 'Loading...'}
                </p>
                {subscription && (
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ${
                    subscription.tier === 'pro' && subscription.isActive 
                      ? 'bg-amber-50 text-amber-600/70' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {subscription.tier === 'pro' && subscription.isActive ? 'Pro' : 'Free'}
                  </span>
                )}
              </div>
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
