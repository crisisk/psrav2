'use client';
import { useQuery } from "@tanstack/react-query";
import { ChainGraph } from "@/shared/lib/api/chain.schemas";

interface ChainOverviewProps {
  ltsdId: string;
  onSelectNode?: (nodeId: string | null) => void;
}

export function ChainOverview({ ltsdId, onSelectNode }: ChainOverviewProps) {
  const { data } = useQuery({
    queryKey: ['chain','graph', ltsdId],
    queryFn: async () => {
      const r = await fetch(`/api/chain/${ltsdId}/graph`, { headers: { "X-Role":"SUPPLIER" } });
      const j = await r.json();
      return (await import("@/shared/lib/api/chain.schemas")).ChainGraph.parse(j);
    },
    staleTime: 10_000
  });
  if (!data) return <div className="rounded-2xl border p-5 bg-white animate-pulse h-36"/>;
  const statusMap: Record<string,string> = { INCOMPLETE:"bg-warning/10 text-warning", PENDING_REVIEW:"bg-info/10 text-info", COMPLETE:"bg-success/10 text-success" };
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div><h3 className="text-xl font-semibold">Chain overview</h3><p className="text-text-soft">LTSD {data.ltsdId} • Agreement {data.agreement}</p></div>
        <span className={`px-3 py-1 rounded-full text-sm ${statusMap[data.status]}`}>{data.status}</span>
      </div>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <Metric t="Coverage" v={`${Math.round(data.coveragePct)}%`} />
        <Metric t="Missing nodes" v={`${data.missingCount}`} />
        <Metric t="Root HS" v={data.rootHs} />
      </div>
    </div>
  );
}
function Metric({t,v}:{t:string;v:string}){return(<div className="rounded-xl border p-4"><div className="text-sm text-text-soft">{t}</div><div className="text-2xl font-semibold">{v}</div></div>)}
