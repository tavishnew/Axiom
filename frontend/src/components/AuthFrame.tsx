export function AuthFrame({ children, eyebrow = "Axiom / Access control" }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1440px] border-x border-line lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
          <a href="/" className="inline-flex items-center gap-3 self-start rounded-sm">
            <span aria-hidden className="h-6 w-[3px] bg-accent" />
            <span className="font-serif text-[1.72rem] tracking-[-0.045em]">Axiom<span className="text-accent">.</span></span>
          </a>
          <div className="max-w-md border-y border-line-strong py-8">
            <p className="editorial-eyebrow">{eyebrow}</p>
            <h1 className="font-serif text-5xl leading-[0.94] tracking-[-0.05em] text-ink">Make every permission a considered decision.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted">Policy, identity, and evidence belong in the same clear record—especially when someone needs to understand why access was granted or denied.</p>
          </div>
          <p className="border-t border-line pt-5 font-mono text-[11px] leading-5 text-muted">subject · action · resource<br /><span className="text-accent">evidence, not guesswork.</span></p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-md">
            <a href="/" className="mb-10 inline-flex items-center gap-3 rounded-sm lg:hidden">
              <span aria-hidden className="h-6 w-[3px] bg-accent" />
              <span className="font-serif text-2xl tracking-[-0.045em] text-ink">Axiom<span className="text-accent">.</span></span>
            </a>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
