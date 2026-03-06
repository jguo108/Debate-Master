'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    Camera,
    Save,
    Loader2,
    ArrowLeft,
    Shield,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { updateProfile } from '@/app/actions/user';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient();

const PRESET_AVATARS = [
    'https://picsum.photos/seed/alex/100/100',
    'https://picsum.photos/seed/sophia/100/100',
    'https://picsum.photos/seed/marcus/100/100',
    'https://picsum.photos/seed/lisa/100/100',
    'https://picsum.photos/seed/david/100/100',
    'https://picsum.photos/seed/elena/100/100',
];

export default function SettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setProfile(data);
                    setFullName(data.full_name || '');
                    setAvatarUrl(data.avatar_url || '');
                } else {
                    setFullName(user.email?.split('@')[0] || '');
                }
            }
            setLoading(false);
        }
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await updateProfile({
                full_name: fullName,
                avatar_url: avatarUrl
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Update local state to reflect changes immediately
            setProfile((prev: any) => ({ ...prev, full_name: fullName, avatar_url: avatarUrl }));

            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file.' });
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setMessage({ type: 'error', text: 'Image size should be less than 2MB.' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Image uploaded! Remember to save changes.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload image' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f6f6f8]">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
                <div className="px-8 pt-16 lg:pt-24 pb-10 max-w-4xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-12 relative">
                        <Link
                            href="/mode-selection"
                            className="absolute left-0 top-0 flex items-center gap-2 text-slate-500 hover:text-[#585bf3] font-bold transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </Link>
                        <div className="text-center">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4"
                            >
                                Settings
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-slate-500 text-lg max-w-2xl mx-auto"
                            >
                                Personalize your profile and arena appearance.
                            </motion.p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Avatar Preview */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                <div className="relative group mb-6">
                                    <div className="size-32 rounded-full overflow-hidden border-4 border-[#585bf3]/10 relative shadow-inner">
                                        <Image
                                            src={avatarUrl || 'https://picsum.photos/seed/alex/100/100'}
                                            alt="Avatar Preview"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCameraClick}
                                        disabled={uploading}
                                        className="absolute -bottom-2 -right-2 size-10 bg-[#585bf3] rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Camera className="w-5 h-5" />
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">{fullName || 'Your Name'}</h3>
                                <p className="text-xs font-bold text-[#585bf3] uppercase tracking-widest mt-1">
                                    {profile?.rank || 'Novice Debater'}
                                </p>
                            </div>

                            <div className="bg-[#585bf3] rounded-[32px] p-8 text-white shadow-lg shadow-[#585bf3]/20 relative overflow-hidden">
                                <Shield className="w-20 h-20 absolute -right-4 -bottom-4 opacity-10 rotate-12" />
                                <h4 className="text-lg font-bold mb-2">Pro Member</h4>
                                <p className="text-blue-100 text-sm leading-relaxed">
                                    Your identity is your shield in the arena. Choose wisely.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Edit Form */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-8">
                                {/* Form Sections */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Display Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#585bf3]/20 focus:border-[#585bf3] transition-all outline-none"
                                            />
                                        </div>
                                    </div>


                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Or Choose a Preset
                                        </label>
                                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                            {PRESET_AVATARS.map((url, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setAvatarUrl(url)}
                                                    className={`size-14 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${avatarUrl === url ? 'border-[#585bf3] scale-110 shadow-lg' : 'border-slate-100 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <Image src={url} alt={`Preset ${i}`} width={56} height={56} className="object-cover h-full w-full" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between">
                                    <AnimatePresence>
                                        {message && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className={`flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
                                                    }`}
                                            >
                                                {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                                {message.text}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving || loading}
                                        className="ml-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
