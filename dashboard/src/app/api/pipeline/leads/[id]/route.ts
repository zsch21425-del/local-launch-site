import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";
import { isRequestAuthed } from "@/lib/session";
import { isObject } from "@/lib/validate";

/**
 * Editable fields on the client workstation cold-call sheet. Whitelist keeps
 * arbitrary data out of the pipeline — only these keys can be updated.
 */
const EDITABLE_FIELDS = [
  "name",
  "category",
  "location",
  "phone",
  "email",
  "website",
  "facebook",
  "instagram",
  "ownerName",
  "offer",
  "priority",
  "summary",
  "responseStatus",
  "saleValue",
  "demoUrl",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

const VALID_PRIORITY = ["high", "medium-high", "medium", "low"] as const;
const MAX_STR = 4000;

/**
 * Runtime value schema. Whitelisting keys is not enough — a bad *value*
 * (priority:null, name:{}, email:42, saleValue:"lots") persists and later
 * crashes downstream `.toLowerCase()` / `.trim()` / arithmetic. Every editable
 * field is validated here and a non-conforming value is rejected with a 400 +
 * field detail BEFORE anything is written. Values are never silently coerced.
 */
function validateFieldValue(
  key: EditableField,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  if (key === "priority") {
    if (typeof value === "string" && (VALID_PRIORITY as readonly string[]).includes(value)) {
      return { ok: true, value };
    }
    return { ok: false, error: `priority must be one of: ${VALID_PRIORITY.join(", ")}` };
  }

  if (key === "saleValue") {
    if (value === null) return { ok: true, value: null };
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return { ok: true, value };
    }
    return { ok: false, error: "saleValue must be a finite number >= 0, or null" };
  }

  if (key === "name") {
    if (typeof value === "string" && value.trim().length > 0 && value.length <= MAX_STR) {
      return { ok: true, value };
    }
    return { ok: false, error: `name must be a non-empty string (<= ${MAX_STR} chars)` };
  }

  // Remaining editable fields: bounded string, or explicit null to clear.
  // (category, location, phone, email, website, facebook, instagram,
  //  ownerName, offer, summary, responseStatus, demoUrl)
  if (value === null) return { ok: true, value: null };
  if (typeof value === "string" && value.length <= MAX_STR) {
    return { ok: true, value };
  }
  return { ok: false, error: `${key} must be a string (<= ${MAX_STR} chars) or null` };
}

/**
 * PATCH /api/pipeline/leads/[id] — edit a single lead's fields.
 * Body: { fields: { [key]: value, ... } }
 * Only whitelisted fields are applied. Writes Blob (atomic via mutatePipeline).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isRequestAuthed(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // M06: reject a wrong-shape OUTER body (null, array, string, number) with a
  // structured 400. The H11 per-field value validation below is unchanged.
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object", field: "body" },
      { status: 400 },
    );
  }
  const fields = (body.fields ?? {}) as Record<string, unknown>;

  if (!isObject(fields) || Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "fields is required" }, { status: 400 });
  }

  // Whitelist filter + runtime value validation
  const updates: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (!(key in fields)) continue;
    const checked = validateFieldValue(key, fields[key]);
    if (!checked.ok) {
      return NextResponse.json(
        { error: `invalid value for "${key}": ${checked.error}`, field: key },
        { status: 400 },
      );
    }
    updates[key] = checked.value;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: `no editable fields provided; allowed: ${EDITABLE_FIELDS.join(", ")}` },
      { status: 400 },
    );
  }

  let updatedCompany: any = null;
  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      const idx = companies.findIndex(
        (c: any) => (c.id ?? "").toLowerCase() === id.toLowerCase(),
      );
      if (idx === -1) throw new Error("__NOTFOUND__");

      const now = new Date().toISOString().slice(0, 10);
      const prev = companies[idx];
      const next: any = { ...prev, ...updates, lastUpdated: now };

      // M04: a changed recipient email invalidates any stored pre-send gate —
      // it was checked against the OLD address. Drop the stale `emailGate` and
      // clear a stale "bounce-risk" `responseStatus` so a fresh gate for the
      // new address starts clean. Genuine bounce history lives in
      // `reviewFeedback` / `sendTruth` and is left untouched here.
      if ("email" in updates) {
        const prevEmail = (prev.email ?? "").trim().toLowerCase();
        const nextEmail = (
          typeof updates.email === "string" ? updates.email : ""
        )
          .trim()
          .toLowerCase();
        if (prevEmail !== nextEmail) {
          delete next.emailGate;
          if (
            !("responseStatus" in updates) &&
            String(next.responseStatus ?? "").toLowerCase() === "bounce-risk"
          ) {
            next.responseStatus = "unknown";
          }
        }
      }

      companies[idx] = next;
      updatedCompany = companies[idx];
      return true;
    });
    if (!r.ok) return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  } catch (e: any) {
    if (e?.message === "__NOTFOUND__")
      return NextResponse.json({ error: `Not found: ${id}` }, { status: 404 });
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, company: updatedCompany });
}
