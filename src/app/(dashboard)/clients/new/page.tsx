import { IntakeForm } from "@/components/clients/intake-form";

export default function NewClientPage() {
	return (
		<div className="p-6 max-w-6xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-bold">New Client</h1>
				<p className="text-muted-foreground text-sm">
					Complete the intake form. A CROA-compliant contract will be generated automatically.
				</p>
			</div>
			<IntakeForm />
		</div>
	);
}
