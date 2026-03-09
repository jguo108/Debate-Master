import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f6f6f8] font-sans text-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto overflow-x-hidden relative">
                {children}
            </div>
        </div>
    );
}
