import { JobsPanel } from "@/components/jobs-panel";

export const dynamic = "force-dynamic";

/** Work queue — durable autonomous jobs + gate status (Stage 3c). */
export default function JobsPage() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[900px] px-6 py-10 md:px-20">
      <h1 className="font-display text-4xl font-medium text-foreground md:text-5xl">
        Work queue
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        Autonomous jobs the agent is running on the batch — with their quality-gate
        status. A deliverable only advances once every required gate (visual 8.5,
        critic 9.5, 6-pass audit) passes.
      </p>
      <div className="mt-8">
        <JobsPanel />
      </div>
    </div>
  );
}
