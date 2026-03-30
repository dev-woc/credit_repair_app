"use client";

import { LayoutDashboard, LogOut, Menu, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAgency } from "@/hooks/use-agency";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/clients", label: "Clients", icon: Users },
	{ href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
	const pathname = usePathname();
	return (
		<nav className="flex flex-col gap-1">
			{navItems.map((item) => {
				const Icon = item.icon;
				const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onClick}
						className={cn(
							"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
							isActive
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						<Icon className="h-4 w-4" />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}

export function Sidebar() {
	const { agency } = useAgency();
	const [open, setOpen] = useState(false);

	return (
		<>
			{/* Desktop sidebar */}
			<aside className="hidden lg:flex flex-col w-64 border-r min-h-screen p-4 gap-6">
				<div className="flex flex-col gap-1">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						ScoreOS
					</span>
					<span className="font-semibold truncate">{agency?.name ?? "Loading..."}</span>
				</div>
				<NavLinks />
				<div className="mt-auto">
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start gap-2 text-muted-foreground"
					>
						<LogOut className="h-4 w-4" />
						Sign Out
					</Button>
				</div>
			</aside>

			{/* Mobile header with sheet */}
			<div className="lg:hidden flex items-center justify-between border-b px-4 py-3 fixed top-0 left-0 right-0 bg-background z-50">
				<span className="font-semibold">{agency?.name ?? "ScoreOS"}</span>
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon">
							<Menu className="h-5 w-5" />
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-64 p-4">
						<div className="mb-6">
							<span className="font-semibold">{agency?.name ?? "ScoreOS"}</span>
						</div>
						<NavLinks onClick={() => setOpen(false)} />
					</SheetContent>
				</Sheet>
			</div>
		</>
	);
}
