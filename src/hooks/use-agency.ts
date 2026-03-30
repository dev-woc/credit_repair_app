"use client";

import { useCallback, useEffect, useState } from "react";
import type { Agency } from "@/types";

export function useAgency() {
	const [agency, setAgency] = useState<Agency | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAgency = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/agencies");
			if (!res.ok) throw new Error("Failed to fetch agency");
			const data = await res.json();
			setAgency(data.agency);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAgency();
	}, [fetchAgency]);

	return { agency, isLoading, error, refetch: fetchAgency };
}
