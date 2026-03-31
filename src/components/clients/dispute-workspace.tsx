"use client";

import {
	CalendarClock,
	ClipboardList,
	Files,
	FileText,
	FolderOpen,
	Layers3,
	type LucideIcon,
	ScrollText,
	ShieldAlert,
	Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClientStatus } from "@/types";

type Bureau = "equifax" | "experian" | "transunion";
type DisputeStatus =
	| "identified"
	| "drafted"
	| "sent"
	| "responded"
	| "verified"
	| "removed"
	| "escalated"
	| "closed";

interface ClientDisputeWorkspaceProps {
	client: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		goals: string;
		status: ClientStatus;
		notes: string;
		createdAt: string;
	};
	tradelines?: Array<{
		id: string;
		bureau: Bureau;
		creditor: string;
		accountType: string;
		status: string;
		balance?: string;
		lastVerifiedAt?: string;
	}>;
	disputes?: Array<{
		id: string;
		bureau: Bureau;
		status: DisputeStatus;
		reason: string;
		round: number;
		dueDate?: string;
		notes?: string;
	}>;
	documents?: Array<{
		id: string;
		name: string;
		type: string;
		uploadedAt?: string;
	}>;
	letters?: Array<{
		id: string;
		title: string;
		bureau?: Bureau;
		status: string;
		createdAt?: string;
	}>;
}

const bureauLabels: Record<Bureau, string> = {
	equifax: "Equifax",
	experian: "Experian",
	transunion: "TransUnion",
};

const disputeStatusLabels: Record<DisputeStatus, string> = {
	identified: "Identified",
	drafted: "Drafted",
	sent: "Sent",
	responded: "Responded",
	verified: "Verified",
	removed: "Removed",
	escalated: "Escalated",
	closed: "Closed",
};

function formatDate(value?: string) {
	if (!value) return "TBD";
	return new Date(value).toLocaleDateString();
}

function getStatusBadge(status: DisputeStatus) {
	switch (status) {
		case "identified":
			return "secondary";
		case "drafted":
			return "outline";
		case "sent":
			return "default";
		case "responded":
			return "secondary";
		case "verified":
			return "outline";
		case "removed":
			return "default";
		case "escalated":
			return "destructive";
		case "closed":
			return "outline";
	}
}

function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
			<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
				<Icon className="h-5 w-5 text-muted-foreground" />
			</div>
			<h3 className="font-semibold">{title}</h3>
			<p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
		</div>
	);
}

function MetricTile({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border bg-background/70 px-4 py-3 shadow-sm">
			<p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className="mt-1 text-2xl font-semibold">{value}</p>
		</div>
	);
}

export function ClientDisputeWorkspace({
	client,
	tradelines = [],
	disputes = [],
	documents = [],
	letters = [],
}: ClientDisputeWorkspaceProps) {
	const pendingDisputes = disputes.filter((item) =>
		["identified", "drafted", "sent", "responded", "escalated"].includes(item.status),
	).length;
	const overdueDisputes = disputes.filter((item) => {
		if (!item.dueDate) return false;
		const dueTime = new Date(item.dueDate).getTime();
		return (
			Number.isFinite(dueTime) &&
			dueTime < Date.now() &&
			item.status !== "removed" &&
			item.status !== "verified"
		);
	}).length;

	return (
		<Card className="overflow-hidden">
			<CardHeader className="border-b bg-gradient-to-r from-muted/50 via-background to-muted/30">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-1">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Layers3 className="h-5 w-5 text-muted-foreground" />
							Dispute workspace
						</CardTitle>
						<CardDescription>
							Track tradelines, disputes, evidence, and letters for {client.firstName}{" "}
							{client.lastName}.
						</CardDescription>
					</div>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
						<MetricTile label="Tradelines" value={tradelines.length} />
						<MetricTile label="Open disputes" value={pendingDisputes} />
						<MetricTile label="Overdue" value={overdueDisputes} />
						<MetricTile label="Documents" value={documents.length} />
						<MetricTile label="Letters" value={letters.length} />
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<Tabs defaultValue="overview" className="w-full flex-col gap-0">
					<TabsList variant="line" className="w-full justify-start overflow-x-auto">
						<TabsTrigger value="overview" className="px-4">
							Overview
						</TabsTrigger>
						<TabsTrigger value="tradelines" className="px-4">
							Tradelines
						</TabsTrigger>
						<TabsTrigger value="disputes" className="px-4">
							Disputes
						</TabsTrigger>
						<TabsTrigger value="documents" className="px-4">
							Documents
						</TabsTrigger>
						<TabsTrigger value="letters" className="px-4">
							Letters
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="mt-6 space-y-6">
						<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
							<Card className="border-muted/60 bg-muted/15 shadow-none">
								<CardHeader>
									<CardTitle className="text-base">Case Snapshot</CardTitle>
									<CardDescription>
										High-level context that future dispute records can hang off.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 text-sm">
									<div className="grid grid-cols-2 gap-3">
										<div>
											<p className="text-xs uppercase tracking-wide text-muted-foreground">
												Status
											</p>
											<Badge className="mt-2" variant="secondary">
												{client.status}
											</Badge>
										</div>
										<div>
											<p className="text-xs uppercase tracking-wide text-muted-foreground">
												Created
											</p>
											<p className="mt-2 font-medium">{formatDate(client.createdAt)}</p>
										</div>
										<div>
											<p className="text-xs uppercase tracking-wide text-muted-foreground">Goals</p>
											<p className="mt-2 font-medium capitalize">
												{client.goals
													.split(",")
													.map((goal) => goal.trim().replace(/_/g, " "))
													.join(", ")}
											</p>
										</div>
										<div>
											<p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
											<p className="mt-2 font-medium">{client.phone || "—"}</p>
										</div>
									</div>
									<Separator />
									<div>
										<p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
										<p className="mt-2 leading-6 text-muted-foreground">
											{client.notes ||
												"No intake notes yet. Add dispute context, bureau notes, or evidence summaries here."}
										</p>
									</div>
								</CardContent>
							</Card>

							<Card className="border-muted/60 bg-background shadow-none">
								<CardHeader>
									<CardTitle className="text-base">Next Steps</CardTitle>
									<CardDescription>
										A practical sequence for the first dispute round.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 text-sm">
									<div className="flex items-start gap-3">
										<div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
											<ClipboardList className="h-4 w-4 text-muted-foreground" />
										</div>
										<div>
											<p className="font-medium">Import credit report items</p>
											<p className="text-muted-foreground">
												Add tradelines, inquiries, or collections from each bureau before drafting.
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
											<Target className="h-4 w-4 text-muted-foreground" />
										</div>
										<div>
											<p className="font-medium">Create dispute items</p>
											<p className="text-muted-foreground">
												Track reason, bureau, round, due date, and disposition for each item.
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
											<ScrollText className="h-4 w-4 text-muted-foreground" />
										</div>
										<div>
											<p className="font-medium">Generate letters and follow-ups</p>
											<p className="text-muted-foreground">
												Draft round 1 letters now so the workflow can scale to follow-up and
												escalation.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="tradelines" className="mt-6 space-y-4">
						{tradelines.length === 0 ? (
							<EmptyState
								icon={Files}
								title="No tradelines imported yet"
								description="This section will show bureau, creditor, status, balance, and verification details once credit report data is connected."
							/>
						) : (
							<div className="grid gap-4">
								{tradelines.map((item) => (
									<Card key={item.id} className="shadow-none">
										<CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
											<div className="space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="font-medium">{item.creditor}</p>
													<Badge variant="outline">{bureauLabels[item.bureau]}</Badge>
												</div>
												<p className="text-sm text-muted-foreground">
													{item.accountType}
													{item.balance ? ` · Balance ${item.balance}` : ""}
												</p>
												<p className="text-xs text-muted-foreground">
													Last verified {formatDate(item.lastVerifiedAt)}
												</p>
											</div>
											<Badge variant="secondary">{item.status}</Badge>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="disputes" className="mt-6 space-y-4">
						{disputes.length === 0 ? (
							<EmptyState
								icon={ShieldAlert}
								title="No dispute items yet"
								description="Create dispute items from tradelines or manually capture issue, bureau, round, and deadline data."
							/>
						) : (
							<div className="grid gap-4">
								{disputes.map((item) => (
									<Card key={item.id} className="shadow-none">
										<CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
											<div className="space-y-2">
												<div className="flex flex-wrap items-center gap-2">
													<p className="font-medium">{item.reason}</p>
													<Badge variant="outline">{bureauLabels[item.bureau]}</Badge>
													<Badge variant={getStatusBadge(item.status)}>
														{disputeStatusLabels[item.status]}
													</Badge>
												</div>
												<p className="text-sm text-muted-foreground">
													Round {item.round}
													{item.dueDate
														? ` · Due ${formatDate(item.dueDate)}`
														: " · No deadline set"}
												</p>
												{item.notes && (
													<p className="text-xs text-muted-foreground">{item.notes}</p>
												)}
											</div>
											<div className="flex items-center gap-2">
												{item.dueDate && (
													<Badge variant="secondary">
														<CalendarClock className="mr-1 h-3 w-3" />
														{formatDate(item.dueDate)}
													</Badge>
												)}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="documents" className="mt-6 space-y-4">
						{documents.length === 0 ? (
							<EmptyState
								icon={FolderOpen}
								title="No documents uploaded"
								description="Upload PDFs, screenshots, correspondence, and bureau responses here so evidence stays tied to the case."
							/>
						) : (
							<div className="grid gap-4">
								{documents.map((item) => (
									<Card key={item.id} className="shadow-none">
										<CardContent className="flex items-center justify-between p-4">
											<div className="space-y-1">
												<p className="font-medium">{item.name}</p>
												<p className="text-xs text-muted-foreground">
													{item.type}
													{item.uploadedAt ? ` · Uploaded ${formatDate(item.uploadedAt)}` : ""}
												</p>
											</div>
											<Badge variant="outline">Attached</Badge>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="letters" className="mt-6 space-y-4">
						{letters.length === 0 ? (
							<EmptyState
								icon={FileText}
								title="No generated letters yet"
								description="Generated letters, drafts, and escalations will land here once the letter workflow is connected."
							/>
						) : (
							<div className="grid gap-4">
								{letters.map((item) => (
									<Card key={item.id} className="shadow-none">
										<CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
											<div className="space-y-1">
												<p className="font-medium">{item.title}</p>
												<p className="text-xs text-muted-foreground">
													{item.bureau ? `${bureauLabels[item.bureau]} · ` : ""}
													{item.createdAt
														? `Created ${formatDate(item.createdAt)}`
														: "Generated draft"}
												</p>
											</div>
											<Badge variant="secondary">{item.status}</Badge>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
