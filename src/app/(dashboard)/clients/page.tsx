import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agencies, clients } from "@/lib/db/schema";
import type { ClientStatus } from "@/types";

export default async function ClientsPage() {
	const { data } = await getAuth().getSession();
	if (!data?.user) redirect("/login");

	const agency = await db.query.agencies.findFirst({
		where: eq(agencies.ownerId, data.user.id),
	});
	if (!agency) redirect("/signup");

	const clientList = await db.query.clients.findMany({
		where: eq(clients.agencyId, agency.id),
		with: { contract: true },
		orderBy: [desc(clients.createdAt)],
	});

	return (
		<div className="p-6 space-y-6 max-w-6xl mx-auto">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Clients</h1>
					<p className="text-muted-foreground text-sm">{clientList.length} total</p>
				</div>
				<Button asChild>
					<Link href="/clients/new">
						<Plus className="h-4 w-4 mr-2" />
						Add Client
					</Link>
				</Button>
			</div>

			{clientList.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					<p className="mb-4">No clients yet.</p>
					<Button asChild>
						<Link href="/clients/new">Onboard your first client</Link>
					</Button>
				</div>
			) : (
				<div className="border rounded-md">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Contract</TableHead>
								<TableHead>Added</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{clientList.map((client) => (
								<TableRow key={client.id}>
									<TableCell className="font-medium">
										{client.firstName} {client.lastName}
									</TableCell>
									<TableCell className="text-muted-foreground">{client.email}</TableCell>
									<TableCell>
										<ClientStatusBadge status={client.status as ClientStatus} />
									</TableCell>
									<TableCell className="text-muted-foreground text-sm capitalize">
										{client.contract?.status.replace("_", " ") ?? "\u2014"}
									</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{new Date(client.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/clients/${client.id}`}>View</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
