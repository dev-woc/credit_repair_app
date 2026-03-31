import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ContractPreview } from "@/components/clients/contract-preview";
import { ClientDisputeWorkspace } from "@/components/clients/dispute-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
	agencies,
	clientDocuments,
	clients,
	creditReports,
	disputeItems,
	disputeLetters,
} from "@/lib/db/schema";
import type { ClientStatus } from "@/types";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { data } = await getAuth().getSession();
	if (!data?.user) redirect("/login");

	const agency = await db.query.agencies.findFirst({
		where: eq(agencies.ownerId, data.user.id),
	});
	if (!agency) redirect("/signup");

	const { id } = await params;
	const client = await db.query.clients.findFirst({
		where: and(eq(clients.id, id), eq(clients.agencyId, agency.id)),
		with: { contract: true },
	});

	if (!client) notFound();

	const [creditReportRows, disputeItemRows, disputeLetterRows, documentRows] = await Promise.all([
		db.query.creditReports.findMany({
			where: and(eq(creditReports.clientId, client.id), eq(creditReports.agencyId, agency.id)),
			with: { tradelines: true },
		}),
		db.query.disputeItems.findMany({
			where: and(eq(disputeItems.clientId, client.id), eq(disputeItems.agencyId, agency.id)),
			orderBy: [disputeItems.createdAt],
		}),
		db.query.disputeLetters.findMany({
			where: and(eq(disputeLetters.clientId, client.id), eq(disputeLetters.agencyId, agency.id)),
			with: { disputeItem: true },
			orderBy: [disputeLetters.generatedAt],
		}),
		db.query.clientDocuments.findMany({
			where: and(eq(clientDocuments.clientId, client.id), eq(clientDocuments.agencyId, agency.id)),
			orderBy: [clientDocuments.uploadedAt],
		}),
	]);

	const goalsDisplay = client.goals
		.split(",")
		.map((g) => g.trim().replace(/_/g, " "))
		.join(", ");
	const tradelineRows = creditReportRows.flatMap((report) => report.tradelines);

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/clients">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">
						{client.firstName} {client.lastName}
					</h1>
					<p className="text-muted-foreground text-sm">{client.email}</p>
				</div>
				<ClientStatusBadge status={client.status as ClientStatus} />
			</div>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Client Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-2 gap-2 text-sm">
							<span className="text-muted-foreground">Phone</span>
							<span>{client.phone || "\u2014"}</span>
							<span className="text-muted-foreground">Goals</span>
							<span className="capitalize">{goalsDisplay}</span>
							<span className="text-muted-foreground">Added</span>
							<span>{new Date(client.createdAt).toLocaleDateString()}</span>
							<span className="text-muted-foreground">Status</span>
							<ClientStatusBadge status={client.status as ClientStatus} />
						</div>
						{client.notes && (
							<div className="pt-2 border-t">
								<p className="text-xs text-muted-foreground mb-1">Notes</p>
								<p className="text-sm">{client.notes}</p>
							</div>
						)}
					</CardContent>
				</Card>

				{client.contract && (
					<ContractPreview clientId={client.id} contract={client.contract} onSigned={() => {}} />
				)}
			</div>

			<ClientDisputeWorkspace
				client={{
					firstName: client.firstName,
					lastName: client.lastName,
					email: client.email,
					phone: client.phone,
					goals: client.goals,
					status: client.status as ClientStatus,
					notes: client.notes,
					createdAt: new Date(client.createdAt).toISOString(),
				}}
				tradelines={tradelineRows.map((tradeline) => ({
					id: tradeline.id,
					bureau: tradeline.bureau,
					creditor: tradeline.creditorName,
					accountType: tradeline.accountType || "Unspecified account",
					status: tradeline.accountStatus || "Unknown",
					balance: tradeline.balance || undefined,
					lastVerifiedAt: tradeline.reportedDate?.toISOString(),
				}))}
				disputes={disputeItemRows.map((item) => ({
					id: item.id,
					bureau: item.bureau,
					status: item.status,
					reason: item.reason,
					round: item.roundNumber,
					dueDate: item.dueDate?.toISOString(),
					notes: item.notes || item.evidenceSummary || undefined,
				}))}
				documents={documentRows.map((document) => ({
					id: document.id,
					name: document.fileName,
					type: document.documentType,
					uploadedAt: document.uploadedAt.toISOString(),
				}))}
				letters={disputeLetterRows.map((letter) => ({
					id: letter.id,
					title: `${letter.type.replace("_", " ")} dispute letter`,
					bureau: letter.disputeItem?.bureau,
					status: letter.status,
					createdAt: letter.generatedAt.toISOString(),
				}))}
			/>
		</div>
	);
}
