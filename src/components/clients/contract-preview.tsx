"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientContract, ContractStatus } from "@/types";

const statusVariant: Record<ContractStatus, "default" | "secondary" | "outline"> = {
	pending_signature: "secondary",
	signed: "default",
	cancelled: "outline",
};

const statusLabel: Record<ContractStatus, string> = {
	pending_signature: "Pending Signature",
	signed: "Signed",
	cancelled: "Cancelled",
};

interface ContractPreviewProps {
	clientId: string;
	contract: ClientContract;
	onSigned: (updated: ClientContract) => void;
}

export function ContractPreview({ clientId, contract, onSigned }: ContractPreviewProps) {
	const [isSigning, setIsSigning] = useState(false);
	const [current, setCurrent] = useState(contract);

	const handleSign = async () => {
		setIsSigning(true);
		try {
			const res = await fetch(`/api/clients/${clientId}/sign-contract`, {
				method: "POST",
			});
			if (!res.ok) {
				const data = await res.json();
				toast.error(data.error ?? "Failed to sign contract");
				return;
			}
			const { contract: updated } = await res.json();
			setCurrent(updated);
			onSigned(updated);
			toast.success("Contract signed successfully");
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSigning(false);
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle className="text-base">CROA Client Agreement</CardTitle>
					<CardDescription>
						{current.status === "signed" && current.signedAt
							? `Signed on ${new Date(current.signedAt).toLocaleDateString()}`
							: "Review and sign the contract below"}
					</CardDescription>
				</div>
				<Badge variant={statusVariant[current.status as ContractStatus]}>
					{statusLabel[current.status as ContractStatus]}
				</Badge>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="bg-muted rounded-md p-4 max-h-96 overflow-y-auto">
					<pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
						{current.contractText}
					</pre>
				</div>
				{current.status === "pending_signature" && (
					<Button onClick={handleSign} disabled={isSigning} className="w-full">
						{isSigning ? "Signing..." : "Sign Contract"}
					</Button>
				)}
				{current.status === "signed" && current.cancellationDeadline && (
					<p className="text-xs text-muted-foreground text-center">
						3-day cancellation window expires:{" "}
						{new Date(current.cancellationDeadline).toLocaleDateString()}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
