import { ArrowLeft, Newspaper } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSubscription } from "@/hooks/useSubscription";
import { excerpt, NEWS_CATEGORY_LABELS, subscribePublishedNews } from "@/services/news";
import type { NewsArticle } from "@/types";

const longDate = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function NewspaperPage() {
  usePageTitle("Newspaper");
  const { state, retry } = useSubscription<NewsArticle[]>("news", subscribePublishedNews);
  const [openId, setOpenId] = useState<string | null>(null);

  const article = state.status === "ready" ? state.data.find((a) => a.id === openId) : undefined;

  if (article) return <Article article={article} onBack={() => setOpenId(null)} />;

  return (
    <>
      <PageHeader
        eyebrow="The conference paper"
        title="Newspaper"
        description="Briefings, committee reports and features from the press team."
      />

      {state.status === "loading" && (
        <div className="mt-6 space-y-4" aria-busy>
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-6 w-3/4" />
              <Skeleton className="mt-3 h-4 w-full" />
            </Panel>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <Panel className="mt-6">
          <ErrorState message={state.error.message} onRetry={retry} />
        </Panel>
      )}

      {state.status === "ready" && state.data.length === 0 && (
        <Panel className="mt-6">
          <EmptyState
            icon={Newspaper}
            title="No editions yet"
            description="Articles published by the press team will appear here."
          />
        </Panel>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:mt-8">
          {state.data.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setOpenId(a.id)}
              className={[
                "group text-left",
                // The latest piece runs full width as the lead story.
                i === 0 ? "md:col-span-2" : "",
              ].join(" ")}
            >
              <Panel className="h-full overflow-hidden transition-colors hover:border-line-strong">
                {a.coverUrl && (
                  <img
                    src={a.coverUrl}
                    alt=""
                    loading="lazy"
                    className={i === 0 ? "h-48 w-full object-cover sm:h-64" : "h-36 w-full object-cover"}
                  />
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={i === 0 ? "brass" : "slate"}>{NEWS_CATEGORY_LABELS[a.category]}</Badge>
                    <time dateTime={a.publishedAt.toISOString()} className="text-xs text-ink-faint">
                      {longDate(a.publishedAt)}
                    </time>
                  </div>
                  <h2
                    className={[
                      "mt-2 font-display leading-tight font-medium text-balance text-ink",
                      i === 0 ? "text-2xl sm:text-3xl" : "text-xl",
                    ].join(" ")}
                  >
                    {a.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-ink-soft">{excerpt(a)}</p>
                  {a.author && <p className="mt-3 text-xs text-ink-faint">By {a.author}</p>}
                </div>
              </Panel>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function Article({ article, onBack }: { article: NewsArticle; onBack: () => void }) {
  usePageTitle(article.title);
  // Blank-line separated paragraphs; React escapes each one.
  const paragraphs = article.body.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <article className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="size-4" />}>
        All articles
      </Button>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="brass">{NEWS_CATEGORY_LABELS[article.category]}</Badge>
        <time dateTime={article.publishedAt.toISOString()} className="text-xs text-ink-faint">
          {longDate(article.publishedAt)}
        </time>
      </div>

      <h1 className="mt-3 font-display text-[2rem] leading-[1.12] font-medium tracking-tight text-balance text-ink md:text-[2.75rem]">
        {article.title}
      </h1>
      {article.author && <p className="mt-3 text-sm text-ink-soft">By {article.author}</p>}

      {article.coverUrl && (
        <img src={article.coverUrl} alt="" className="mt-6 w-full rounded-xl object-cover" />
      )}

      <div className="mt-6 space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[1.0625rem] leading-[1.75] text-pretty text-ink-soft">
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
