"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientWithContract } from "@/types";

export function useClients() {
	const [clients, setClients] = useState<ClientWithContract[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchClients = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/clients");
			if (!res.ok) throw new Error("Failed to fetch clients");
			const data = await res.json();
			setClients(data.clients);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchClients();
	}, [fetchClients]);

	return { clients, isLoading, error, refetch: fetchClients };
}
