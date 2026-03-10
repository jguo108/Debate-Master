'use client';

import { Crown } from 'lucide-react';

interface SubscriptionBadgeProps {
  tier: 'free' | 'pro' | null;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'top-right' | 'top-left' | 'bottom-left';
  showOnFree?: boolean;
}

export default function SubscriptionBadge({ 
  tier, 
  isActive = true, 
  size = 'sm',
  position = 'bottom-right',
  showOnFree = false
}: SubscriptionBadgeProps) {
  if (!tier || (tier === 'free' && !showOnFree)) return null;
  
  const isPro = tier === 'pro' && isActive;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const positionClasses = {
    'bottom-right': 'bottom-0 right-0',
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-left': 'bottom-0 left-0'
  };
  
  return (
    <div className={`absolute ${positionClasses[position]} ${sizeClasses[size]} rounded-full border-2 border-white flex items-center justify-center ${
      isPro ? 'bg-amber-500' : 'bg-slate-400'
    }`} title={isPro ? 'Pro Member' : 'Free Member'}>
      <Crown className={`${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'} text-white`} fill="currentColor" />
    </div>
  );
}
