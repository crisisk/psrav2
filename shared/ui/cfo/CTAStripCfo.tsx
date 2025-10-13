export function CTAStripCfo(){
  return (
    <div className="mt-6 rounded-2xl border border-border bg-white p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div><h3 className="text-xl font-semibold">Snelle acties</h3><p className="text-text-soft">Keur aanvragen goed of bekijk risico’s.</p></div>
      <div className="flex gap-3">
        <a href="/cfo/approvals" className="px-4 py-2 rounded-xl bg-brand text-brand-on focus:ring-2 focus:ring-brand">Approve LTSD</a>
        <a href="/cfo/risks" className="px-4 py-2 rounded-xl border border-brand text-brand hover:bg-brand/5 focus:ring-2 focus:ring-brand">View Exceptions</a>
      </div>
    </div>
  );
}
