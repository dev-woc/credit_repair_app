import { CalendarClock, ShieldAlert, Workflow } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface DisputeSummaryPanelProps {
	pendingCount?: number;
	overdueCount?: number;
	dueSoonCount?: number;
	workQueue?: Array<{
		id: string;
		clientName: string;
		bureau: string;
		status: string;
		dueDate?: string;
		priority?: "low" | "medium" | "high";
	}>;
}

function EmptyQueue() {
	return (
		<div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
			<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
				<ShieldAlert className="h-5 w-5 text-muted-foreground" />
			</div>
			<h3 className="font-semibold">No dispute work queued</h3>
			<p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
				Once dispute items are added, overdue follow-ups and draft-ready items will surface here.
			</p>
		</div>
	);
}

export function DisputeSummaryPanel({
	pendingCount = 0,
	overdueCount = 0,
	dueSoonCount = 0,
	workQueue = [],
}: DisputeSummaryPanelProps) {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="border-b bg-gradient-to-r from-muted/50 via-background to-muted/30">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-base">
							<Workflow className="h-5 w-5 text-muted-foreground" />
							Dispute workflow
						</CardTitle>
						<CardDescription>
							Pending, overdue, and follow-up work for the current client base.
						</CardDescription>
					</div>
					<Badge variant="outline">Phase 2</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-6 p-6">
				<div className="grid gap-4 sm:grid-cols-3">
					<StatsCard
						title="Pending"
						value={pendingCount}
						icon={Workflow}
						description="Items ready for action"
					/>
					<StatsCard
						title="Overdue"
						value={overdueCount}
						icon={ShieldAlert}
						description="Past their due date"
					/>
					<StatsCard
						title="Due soon"
						value={dueSoonCount}
						icon={CalendarClock}
						description="Upcoming follow-ups"
					/>
				</div>

				<Separator />

				{workQueue.length === 0 ? (
					<EmptyQueue />
				) : (
					<div className="grid gap-4">
						{workQueue.map((item) => (
							<Card key={item.id} className="shadow-none">
								<CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
									<div className="space-y-1">
										<p className="font-medium">{item.clientName}</p>
										<p className="text-sm text-muted-foreground">
											{item.bureau} · {item.status}
											{item.dueDate ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}` : ""}
										</p>
									</div>
									<Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
										{item.priority ?? "medium"}
									</Badge>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
