'use client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChainGraph } from "@/shared/lib/api/chain.schemas";
import { toast } from "@/shared/ui/Toaster";

export function MissingCooList({ ltsdId }: { ltsdId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["chain","graph", ltsdId],
    queryFn: async () => {
      const r = await fetch(`/api/chain/${ltsdId}/graph`, { headers: { "X-Role":"COMPLIANCE_MANAGER" } });
      const j = await r.json();
      return (await import("@/shared/lib/api/chain.schemas")).ChainGraph.parse(j);
    },
    staleTime: 10_000
  });

  const req = useMutation({
    mutationFn: async (nodeId: string) => {
      const r = await fetch(`/api/chain/${ltsdId}/node/${nodeId}/request-coo`, {
        method:"POST",
        headers: { "Content-Type":"application/json", "X-Role":"COMPLIANCE_MANAGER" },
        body: JSON.stringify({ email: "test@test.com" })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => { toast.success("Aanvraag verstuurd (test@test.com)."); qc.invalidateQueries({ queryKey: ["chain","graph", ltsdId] }); },
    onError: () => toast.error("Kon aanvraag niet versturen.")
  });

  if (isLoading || !data) return <div className="rounded-2xl border p-5 bg-white animate-pulse h-32"/>;
  const missing: {id:string; label:string; hs:string}[] = [];
  const walk = (n:any) => { if ((n.completeness ?? 0) < 100) missing.push({ id:n.id, label:n.materialName, hs:n.hsCode }); (n.children||[]).forEach(walk); };
  data.nodes.forEach(walk);

  if (missing.length === 0) return <div className="rounded-2xl border p-5 bg-white"><h3 className="text-lg font-semibold">Alle nodes gedekt</h3><p className="text-text-soft text-sm">Keten compleet voor LTSD {data.ltsdId}.</p></div>;

  return (
    <div className="rounded-2xl border p-5 bg-white shadow-card">
      <h3 className="text-lg font-semibold mb-3">Ontbrekende Certificates of Origin</h3>
      <ul className="space-y-3">
        {missing.map(m => (
          <li key={m.id} className="flex items-center justify-between gap-3">
            <div><div className="font-medium">{m.label}</div><div className="text-xs text-text-soft">HS {m.hs}</div></div>
            <button onClick={()=>req.mutate(m.id)} className="px-3 py-2 rounded-xl bg-brand text-brand-on focus:ring-2 focus:ring-brand disabled:opacity-60" disabled={req.isPending}>
              {req.isPending ? "Versturen…" : "Vraag CoO aan"}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-soft mt-3">* Nu nog naar <b>test@test.com</b>. Later auto-fill uit supplier-DB.</p>
    </div>
  );
}
