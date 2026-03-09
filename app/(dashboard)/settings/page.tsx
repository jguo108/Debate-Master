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
        <div className="flex flex-1 min-w-0 h-full overflow-hidden bg-[#f6f6f8]">


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

                    <div className="max-w-2xl mx-auto w-full">
                        <div className="bg-white rounded-[40px] p-10 lg:p-12 border border-slate-100 shadow-sm space-y-10">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center text-center">
                                <div className="relative group mb-6">
                                    <div className="size-36 rounded-full overflow-hidden border-4 border-[#585bf3]/10 relative shadow-inner">
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
                                        className="absolute -bottom-2 -right-2 size-11 bg-[#585bf3] rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Camera className="w-6 h-6" />
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
                                <h3 className="text-2xl font-black text-slate-900">{fullName || 'Your Name'}</h3>
                                <p className="text-slate-400 text-sm mt-1">Update your profile picture and details</p>
                            </div>

                            {/* Form Sections */}
                            <div className="space-y-10">
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
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#585bf3]/20 focus:border-[#585bf3] transition-all outline-none font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Or Choose a Preset
                                    </label>
                                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                        {PRESET_AVATARS.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setAvatarUrl(url)}
                                                className={`size-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${avatarUrl === url ? 'border-[#585bf3] scale-105 shadow-md' : 'border-slate-50 hover:border-slate-200'
                                                    }`}
                                            >
                                                <Image src={url} alt={`Preset ${i}`} width={64} height={64} className="object-cover h-full w-full" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="flex flex-col items-center gap-6 pt-4">
                                <AnimatePresence>
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
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
                                    className="w-full sm:w-auto min-w-[200px] bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Saving Changes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 group-hover:animate-pulse" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
