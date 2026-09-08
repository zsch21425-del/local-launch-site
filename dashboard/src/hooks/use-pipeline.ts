"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

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

/**
 * ONE shared client cache for the live book (M16).
 *
 * Every `usePipeline()` instance — home board, sidebar badges, global search,
 * leads/clients/reports — used to fetch independently on mount and never hear
 * about each other's mutations. Now they all read the same module-level
 * snapshot and a single in-flight fetch is de-duped, so a move/approval/
 * playbook write that calls `invalidatePipeline()` refreshes every consumer
 * (including the nav badges) at once.
 */
type PipelineSnapshot = {
  companies: Company[];
  stages: Stage[];
  agency: Agency;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  /** epoch ms of the last successful load, or null before the first one. */
  lastSync: number | null;
};

let snapshot: PipelineSnapshot = {
  companies: [],
  stages: getStages(),
  agency: getAgency(),
  loading: true,
  error: null,
  isEmpty: false,
  lastSync: null,
};

const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

function setSnapshot(patch: Partial<PipelineSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Fetch the live book once; concurrent callers share the same request. */
export function invalidatePipeline(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/pipeline/data");
      const data = (await res.json()) as PipelinePayload;
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const next = Array.isArray(data.companies) ? data.companies : [];
      setSnapshot({
        companies: next,
        isEmpty: next.length === 0,
        stages:
          Array.isArray(data.stages) && data.stages.length
            ? data.stages
            : snapshot.stages,
        agency: data.agency && data.agency.name ? data.agency : snapshot.agency,
        error: null,
        loading: false,
        lastSync: Date.now(),
      });
    } catch (e) {
      setSnapshot({
        error: e instanceof Error ? e.message : "Could not load pipeline",
        loading: false,
      });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

const getSnapshot = () => snapshot;

/** Live book of record: GET /api/pipeline/data (shared cache). */
export function usePipeline() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    // First mounted consumer kicks off the shared load; later ones reuse it.
    if (snapshot.lastSync === null && !inFlight) void invalidatePipeline();
  }, []);

  const reload = useCallback(() => invalidatePipeline(), []);

  /** Optimistic local patch (e.g. kanban drag) — visible to every consumer. */
  const setCompanies = useCallback(
    (updater: Company[] | ((prev: Company[]) => Company[])) => {
      const nextCompanies =
        typeof updater === "function"
          ? (updater as (p: Company[]) => Company[])(snapshot.companies)
          : updater;
      setSnapshot({ companies: nextCompanies });
    },
    [],
  );

  return {
    companies: state.companies,
    stages: state.stages,
    agency: state.agency,
    loading: state.loading,
    error: state.error,
    isEmpty: state.isEmpty,
    lastSync: state.lastSync,
    reload,
    setCompanies,
  };
}
