"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientGoal } from "@/types";

const GOALS: { value: ClientGoal; label: string }[] = [
	{ value: "mortgage", label: "Mortgage Qualification" },
	{ value: "auto_loan", label: "Auto Loan" },
	{ value: "credit_card", label: "Credit Card Approval" },
	{ value: "general", label: "General Credit Improvement" },
];

export function IntakeForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		notes: "",
		goals: [] as ClientGoal[],
	});

	const toggleGoal = (goal: ClientGoal) => {
		setForm((prev) => ({
			...prev,
			goals: prev.goals.includes(goal)
				? prev.goals.filter((g) => g !== goal)
				: [...prev.goals, goal],
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});

		if (!form.firstName) return setErrors({ firstName: "First name is required" });
		if (!form.lastName) return setErrors({ lastName: "Last name is required" });
		if (!form.email) return setErrors({ email: "Email is required" });
		if (form.goals.length === 0) return setErrors({ goals: "Select at least one goal" });

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/clients", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName: form.firstName,
					lastName: form.lastName,
					email: form.email,
					phone: form.phone || undefined,
					goals: form.goals,
					notes: form.notes || undefined,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				toast.error(data.error ?? "Failed to create client");
				return;
			}

			const { client } = await res.json();
			toast.success(`${client.firstName} ${client.lastName} added successfully`);
			router.push(`/clients/${client.id}`);
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
			<Card>
				<CardHeader>
					<CardTitle>Client Information</CardTitle>
					<CardDescription>Basic contact details for the new client</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name *</Label>
							<Input
								id="firstName"
								value={form.firstName}
								onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
								placeholder="Jane"
							/>
							{errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name *</Label>
							<Input
								id="lastName"
								value={form.lastName}
								onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
								placeholder="Smith"
							/>
							{errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email *</Label>
						<Input
							id="email"
							type="email"
							value={form.email}
							onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
							placeholder="jane@example.com"
						/>
						{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
					</div>

					<div className="space-y-2">
						<Label htmlFor="phone">Phone (optional)</Label>
						<Input
							id="phone"
							type="tel"
							value={form.phone}
							onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
							placeholder="(555) 123-4567"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Credit Goals *</CardTitle>
					<CardDescription>What is this client working toward?</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3">
						{GOALS.map((goal) => {
							const selected = form.goals.includes(goal.value);
							return (
								<button
									key={goal.value}
									type="button"
									onClick={() => toggleGoal(goal.value)}
									className={`rounded-md border px-4 py-3 text-sm text-left transition-colors ${
										selected
											? "border-primary bg-primary/5 text-primary font-medium"
											: "border-muted-foreground/20 hover:border-primary/50"
									}`}
								>
									{goal.label}
								</button>
							);
						})}
					</div>
					{errors.goals && <p className="text-xs text-destructive mt-2">{errors.goals}</p>}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Internal Notes</CardTitle>
					<CardDescription>Optional notes visible only to your agency</CardDescription>
				</CardHeader>
				<CardContent>
					<Textarea
						value={form.notes}
						onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
						placeholder="Referred by..."
						rows={3}
						maxLength={500}
					/>
				</CardContent>
			</Card>

			<Button type="submit" disabled={isSubmitting} className="w-full">
				{isSubmitting ? "Creating Client..." : "Create Client & Generate Contract"}
			</Button>
		</form>
	);
}
