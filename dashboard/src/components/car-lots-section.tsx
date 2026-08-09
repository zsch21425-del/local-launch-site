import { Car, CircleAlert, ExternalLink, Lightbulb, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarLotsPipeline } from "@/lib/data";
import { toHref } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CarLotsSection({ data }: { data: CarLotsPipeline }) {
  const unschemad = data.competitors.filter((c) => !c.hasSchema).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="text-primary size-5" />
            {data.title}
          </CardTitle>
          <Badge variant="outline" className="rounded-full bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/25">
            {unschemad}/{data.competitors.length} competitors missing schema
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="bg-primary/5 border-primary/20 flex gap-3 rounded-lg border p-4">
          <Lightbulb className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-sm leading-relaxed">{data.marketIntel}</p>
        </div>

        {data.dealers.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              In pipeline
            </h3>
            <ul className="flex flex-col gap-2">
              {data.dealers.map((dealer) => {
                const href = toHref(dealer.website);
                return (
                  <li
                    key={dealer.id}
                    className="border-border/60 bg-background/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{dealer.name}</p>
                      <p className="text-muted-foreground text-xs">{dealer.notes}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {dealer.status}
                      </Badge>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs transition-colors"
                        >
                          Visit
                          <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Competitors
          </h3>
          <div className="border-border/60 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Dealer</th>
                  <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">
                    Website
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Schema</th>
                </tr>
              </thead>
              <tbody>
                {data.competitors.map((competitor) => {
                  const href = toHref(competitor.website);
                  return (
                    <tr
                      key={competitor.name}
                      className="border-border/60 hover:bg-accent/30 border-t transition-colors"
                    >
                      <td className="px-3 py-2 font-medium">{competitor.name}</td>
                      <td className="hidden px-3 py-2 sm:table-cell">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                          >
                            {competitor.website}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                            competitor.hasSchema
                              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25"
                              : "bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-400/25",
                          )}
                        >
                          {competitor.hasSchema ? (
                            <ShieldCheck className="size-3" />
                          ) : (
                            <CircleAlert className="size-3" />
                          )}
                          {competitor.hasSchema ? "Has schema" : "None"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
