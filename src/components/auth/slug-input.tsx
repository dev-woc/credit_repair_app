"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugSchema } from "@/lib/validations";

interface SlugInputProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function SlugInput({ value, onChange, error: externalError }: SlugInputProps) {
	const [checking, setChecking] = useState(false);
	const [available, setAvailable] = useState<boolean | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const checkAvailability = useCallback(async (slug: string) => {
		const result = slugSchema.safeParse(slug);
		if (!result.success) {
			setValidationError(result.error.issues[0]?.message ?? "Invalid username");
			setAvailable(null);
			setChecking(false);
			return;
		}

		setValidationError(null);
		setChecking(true);

		try {
			const res = await fetch(`/api/agencies/check-slug?slug=${encodeURIComponent(slug)}`);
			const data = await res.json();
			if (!res.ok) {
				setAvailable(false);
				setValidationError(data.error ?? "Failed to check availability");
				return;
			}
			setAvailable(data.available);
			if (!data.available && data.error) {
				setValidationError(data.error);
			}
		} catch {
			setValidationError("Failed to check availability");
		} finally {
			setChecking(false);
		}
	}, []);

	useEffect(() => {
		if (!value || value.length < 3) {
			setAvailable(null);
			setValidationError(null);
			return;
		}

		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			checkAvailability(value);
		}, 300);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [value, checkAvailability]);

	const displayError = externalError || validationError;

	return (
		<div className="space-y-2">
			<Label htmlFor="slug">Username</Label>
			<div className="relative">
				<Input
					id="slug"
					placeholder="your-username"
					value={value}
					onChange={(e) => onChange(e.target.value.toLowerCase())}
					aria-label="Username"
				/>
				<div className="absolute right-3 top-1/2 -translate-y-1/2">
					{checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
					{!checking && available === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
					{!checking && available === false && <XCircle className="h-4 w-4 text-destructive" />}
				</div>
			</div>
			{displayError && <p className="text-sm text-destructive">{displayError}</p>}
			{value && (
				<p className="text-sm text-muted-foreground">
					Your page: {typeof window !== "undefined" ? window.location.origin : ""}/{value}
				</p>
			)}
		</div>
	);
}
