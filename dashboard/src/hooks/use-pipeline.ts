"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAgency,
  getStages,
  type Agency,
  type Company,
  type Stage,
} from "@/lib/data";

type PipelinePayload = {
  companies?: Company[];
  stages?: Stage[];
  agency?: Agency;
  /** true when the store is a valid but empty book (M09) — not an error. */
  empty?: boolean;
  error?: string;
};

/** Live book of record: GET /api/pipeline/data (Blob after Phase 1). */
export function usePipeline() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stages, setStages] = useState<Stage[]>(() => getStages());
  const [agency, setAgency] = useState<Agency>(() => getAgency());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** true when the API returned a valid but empty book (M09) — render a zero
   *  state, not an error. Distinct from a failed/unreadable fetch. */
  const [isEmpty, setIsEmpty] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/data");
      const data = (await res.json()) as PipelinePayload;
      if (!res.ok) {
        // Only a real failure (missing/garbled store, HTTP error) lands here.
        // A valid empty book returns 200 and is handled below.
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const next = Array.isArray(data.companies) ? data.companies : [];
      setCompanies(next);
      setIsEmpty(next.length === 0);
      if (Array.isArray(data.stages) && data.stages.length) setStages(data.stages);
      if (data.agency && data.agency.name) setAgency(data.agency);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { companies, stages, agency, loading, error, isEmpty, reload, setCompanies };
}
