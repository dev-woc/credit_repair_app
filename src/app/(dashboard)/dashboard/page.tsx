import { desc, eq } from "drizzle-orm";
import { GraduationCap, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { DisputeSummaryPanel } from "@/components/dashboard/dispute-summary-panel";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agencies, clients, disputeItems } from "@/lib/db/schema";
import type { ClientStatus } from "@/types";

export default async function DashboardPage() {
	const { data } = await getAuth().getSession();
	if (!data?.user) redirect("/login");

	const agency = await db.query.agencies.findFirst({
		where: eq(agencies.ownerId, data.user.id),
	});
	if (!agency) redirect("/signup");

	const allClients = await db.query.clients.findMany({
		where: eq(clients.agencyId, agency.id),
		orderBy: [desc(clients.createdAt)],
	});
	const allDisputeItems = await db.query.disputeItems.findMany({
		where: eq(disputeItems.agencyId, agency.id),
		with: { client: true },
		orderBy: [desc(disputeItems.createdAt)],
	});

	const active = allClients.filter((c) => c.status === "active").length;
	const graduated = allClients.filter((c) => c.status === "graduated").length;
	const recent = allClients.slice(0, 5);
	const pendingStatuses = new Set(["identified", "drafted", "sent", "responded", "escalated"]);
	const pendingDisputes = allDisputeItems.filter((item) => pendingStatuses.has(item.status));
	const overdueDisputes = pendingDisputes.filter((item) => {
		if (!item.dueDate) return false;
		return item.dueDate.getTime() < Date.now();
	});
	const dueSoonDisputes = pendingDisputes.filter((item) => {
		if (!item.dueDate) return false;
		const delta = item.dueDate.getTime() - Date.now();
		const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
		return delta >= 0 && delta <= sevenDaysMs;
	});
	const workQueue = pendingDisputes.slice(0, 5).map((item) => ({
		id: item.id,
		clientName: item.client ? `${item.client.firstName} ${item.client.lastName}` : "Unknown client",
		bureau: item.bureau,
		status: item.status,
		dueDate: item.dueDate?.toISOString(),
		priority: overdueDisputes.some((overdueItem) => overdueItem.id === item.id)
			? ("high" as const)
			: ("medium" as const),
	}));

	return (
		<div className="p-6 space-y-6 max-w-6xl mx-auto">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Dashboard</h1>
					<p className="text-muted-foreground text-sm">{agency.name}</p>
				</div>
				<Button asChild>
					<Link href="/clients/new">Add Client</Link>
				</Button>
			</div>

			<div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
				<StatsCard title="Total Clients" value={allClients.length} icon={Users} />
				<StatsCard
					title="Active"
					value={active}
					icon={UserCheck}
					description="Currently in program"
				/>
				<StatsCard
					title="Graduated"
					value={graduated}
					icon={GraduationCap}
					description="Program complete"
				/>
			</div>

			<DisputeSummaryPanel
				pendingCount={pendingDisputes.length}
				overdueCount={overdueDisputes.length}
				dueSoonCount={dueSoonDisputes.length}
				workQueue={workQueue}
			/>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">Recent Clients</CardTitle>
					<Button variant="ghost" size="sm" asChild>
						<Link href="/clients">View all</Link>
					</Button>
				</CardHeader>
				<CardContent>
					{recent.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-4">
							No clients yet.{" "}
							<Link href="/clients/new" className="underline">
								Add your first client
							</Link>
						</p>
					) : (
						<div className="divide-y">
							{recent.map((client) => (
								<div key={client.id} className="flex items-center justify-between py-3">
									<div>
										<Link href={`/clients/${client.id}`} className="font-medium hover:underline">
											{client.firstName} {client.lastName}
										</Link>
										<p className="text-xs text-muted-foreground">{client.email}</p>
									</div>
									<ClientStatusBadge status={client.status as ClientStatus} />
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
