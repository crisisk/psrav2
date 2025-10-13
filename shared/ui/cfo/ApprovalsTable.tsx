'use client';
import { useQuery } from "@tanstack/react-query";
import { ApprovalsResponse } from '@/shared/lib/api/cfo.schemas';

interface ApprovalsTableProps {
  onApprovalClick?: (approval: any) => void;
}

export function ApprovalsTable({ onApprovalClick }: ApprovalsTableProps = {}){
  const { data, isLoading } = useQuery({ queryKey:['cfo','approvals'], queryFn: async ()=> ApprovalsResponse.parse(await (await fetch('/api/cfo/approvals?limit=20')).json()) });
  if (isLoading) return <div className="h-32 bg-bg-muted rounded-2xl animate-pulse" />;
  if (!data || data.total===0) return <div className="rounded-2xl border border-border bg-white p-10 text-center"><h3 className="text-xl font-semibold mb-2">Geen open approvals</h3></div>;
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
      <h3 className="font-semibold mb-3">Pending approvals</h3>
      <table className="min-w-full text-sm">
        <thead className="text-left text-text-soft border-b border-border"><tr><th className="py-3 pr-4">Title</th><th className="py-3 pr-4">Requested by</th><th className="py-3 pr-4">Created</th><th className="py-3 pr-4">Impact</th><th className="py-3 pr-4"></th></tr></thead>
        <tbody>{data.items.map(i => (
          <tr key={i.id} className="border-b border-border/60 last:border-none">
            <td className="py-3 pr-4">{i.title}</td>
            <td className="py-3 pr-4">{i.requestedBy}</td>
            <td className="py-3 pr-4">{new Date(i.createdAt).toLocaleString()}</td>
            <td className="py-3 pr-4">{i.impact}</td>
            <td className="py-3 pr-4 text-right"><button onClick={() => onApprovalClick?.(i)} className="px-3 py-1 rounded-xl bg-brand text-brand-on">Approve</button></td>
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}
