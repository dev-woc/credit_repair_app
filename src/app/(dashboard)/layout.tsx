import { Sidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<main className="flex-1 overflow-y-auto pt-16 lg:pt-0">{children}</main>
		</div>
	);
}
