'use client';
import { useState } from "react";
import { toast } from "@/shared/ui/Toaster";

export function AddCooWizard({ ltsdId, nodeId, onDone }: { ltsdId: string; nodeId: string; onDone: ()=>void }) {
  const [file, setFile] = useState<File|null>(null);
  const [form, setForm] = useState({ issuer:"", hs:"", validFrom:"", validTo:"", country:"", agreement:"", coveragePct:100 });
  const [busy, setBusy] = useState(false);
  async function handleUpload() {
    if (!file) { toast.error("Kies een PDF."); return; }
    setBusy(true);
    try {
      const init = await fetch(`/api/chain/${ltsdId}/node/${nodeId}/coo/init`, { method:"POST", headers: { "X-Role":"SUPPLIER" } }).then(r=>r.json());
      const up = await fetch(init.uploadUrl, { method:"PUT", body:file });
      if (!up.ok) throw new Error(`Upload HTTP ${up.status}`);
      const meta = { fileName:file.name, issuer:form.issuer, hs: form.hs || undefined, validFrom:form.validFrom, validTo:form.validTo, countryOfOrigin:form.country, agreement:form.agreement || undefined, coveragePct:form.coveragePct };
      const comp = await fetch(`/api/chain/${ltsdId}/node/${nodeId}/coo/complete`, { method:"POST", headers: { "Content-Type":"application/json", "X-Role":"SUPPLIER" }, body: JSON.stringify(meta)});
      if (!comp.ok) throw new Error(`Complete HTTP ${comp.status}`);
      await fetch(`/api/chain/${ltsdId}/node/${nodeId}/revalidate`, { method:"POST", headers: { "X-Role":"SUPPLIER" } });
      toast.success("CoO toegevoegd.");
      onDone();
    } catch(e){ toast.error("Upload mislukt."); } finally { setBusy(false) }
  }
  return (
    <div className="space-y-4">
      <label className="block"><span className="block text-sm text-text-soft mb-1">Bestand (PDF)</span><input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] ?? null)} /></label>
      <div className="grid md:grid-cols-2 gap-4">
        {["issuer","hs","validFrom","validTo","country","agreement","coveragePct"].map((k)=>(
          <label key={k} className="block"><span className="block text-sm text-text-soft mb-1">{k}</span>
            <input className="w-full rounded-xl border border-border px-3 py-2" type={k in {validFrom:1,validTo:1}? "date" : (k==="coveragePct"?"number":"text")}
              value={(form as any)[k]} onChange={e=>setForm(s=>({...s, [k]: k==="coveragePct" ? Number(e.target.value) : e.target.value }))}/>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button className="px-3 py-2 rounded-xl border">Annuleren</button>
        <button onClick={handleUpload} disabled={busy || !file || !form.issuer || !form.validFrom || !form.validTo || !form.country} aria-busy={busy}
          className="px-4 py-2 rounded-xl bg-brand text-brand-on focus:ring-2 focus:ring-brand disabled:opacity-60">{busy ? "Opslaan…" : "Opslaan"}</button>
      </div>
    </div>
  );
}
