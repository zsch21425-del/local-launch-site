import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Full-bleed cinematic page hero — one distinct art image per page with a
 * serif-italic eyebrow + oversized display title. Shared across the flagship
 * section pages so each keeps a consistent editorial grammar.
 */
export function PageHero({
  image,
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel,
}: {
  image: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="relative flex min-h-[42vh] items-end overflow-hidden">
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/15" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />

      <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-10 md:px-20">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> {backLabel ?? "Back"}
          </Link>
        ) : null}
        <p className="font-serif text-lg italic text-cyan-300/90">{eyebrow}</p>
        <h1 className="font-display mt-2 text-4xl font-medium text-foreground md:text-6xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
