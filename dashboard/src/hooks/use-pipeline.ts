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
  error?: string;
};

/** Live book of record: GET /api/pipeline/data (Blob after Phase 1). */
export function usePipeline() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stages, setStages] = useState<Stage[]>(() => getStages());
  const [agency, setAgency] = useState<Agency>(() => getAgency());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/data");
      const data = (await res.json()) as PipelinePayload;
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const next = Array.isArray(data.companies) ? data.companies : [];
      if (next.length === 0) {
        throw new Error("Pipeline store empty");
      }
      setCompanies(next);
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

  return { companies, stages, agency, loading, error, reload, setCompanies };
}
