import { Calendar, ExternalLink, Link2, Mail, MapPin, Phone } from "lucide-react";

import {
  displayUrl,
  formatDate,
  telHref,
  toHref,
  type Company,
} from "@/lib/data";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Phone, email, website, Facebook, address, and last-contact date. */
export function ClientContact({
  company,
  className,
}: {
  company: Company;
  className?: string;
}) {
  const websiteHref = toHref(company.website);

  return (
    <div className={cn(glassCard, "flex flex-col gap-3 p-5", className)}>
      <h2 className="text-sm font-semibold text-foreground">Contact</h2>

      <dl className="flex flex-col gap-2.5 text-sm">
        <ContactRow icon={MapPin} label={company.location} />
        {company.phone ? (
          <ContactRow
            icon={Phone}
            label={company.phone}
            href={telHref(company.phone) ?? undefined}
          />
        ) : null}
        {company.email ? (
          <ContactRow
            icon={Mail}
            label={company.email}
            href={`mailto:${company.email}`}
          />
        ) : null}
        {websiteHref ? (
          <ContactRow
            icon={ExternalLink}
            label={displayUrl(company.website) ?? company.website ?? ""}
            href={websiteHref}
            external
          />
        ) : null}
        {company.facebook ? (
          <ContactRow icon={Link2} label="Facebook" href={company.facebook} external />
        ) : null}
      </dl>

      {company.lastContact || company.lastUpdated ? (
        <div className="mt-1 flex flex-col gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {company.lastContact ? (
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              Last contact: {formatDate(company.lastContact)}
            </span>
          ) : null}
          {company.lastUpdated ? (
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              Updated: {formatDate(company.lastUpdated)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <span className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );

  if (!href) return <div>{content}</div>;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="transition-colors hover:text-primary"
    >
      {content}
    </a>
  );
}
