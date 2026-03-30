import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/types";

const statusConfig: Record<
	ClientStatus,
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
	active: { label: "Active", variant: "default" },
	inactive: { label: "Inactive", variant: "secondary" },
	graduated: { label: "Graduated", variant: "outline" },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
	const config = statusConfig[status];
	return <Badge variant={config.variant}>{config.label}</Badge>;
}
