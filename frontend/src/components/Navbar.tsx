"use client";

import { ArrowUpRight, Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const nav = [
  { name: "System", href: "#system" },
  { name: "Policy", href: "#policy" },
  { name: "Evidence", href: "#evidence" },
];

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#top" className="inline-flex items-center gap-3 rounded-sm text-ink focus-visible:outline-none">
      <span aria-hidden className="h-6 w-[3px] bg-accent" />
      <span className={compact ? "font-serif text-2xl tracking-[-0.045em]" : "font-serif text-[1.72rem] tracking-[-0.045em]"}>
        Axiom<span className="text-accent">.</span>
      </span>
    </a>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line-strong bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="border-b border-transparent py-1 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-ink cursor-pointer"
            >
              {item.name}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a href="/auth/sign-in" className="text-sm font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
            Sign in
          </a>
          <a href="/auth/sign-up" className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-2">
            Enter the console <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line text-ink hover:border-line-strong hover:bg-paper-tint lg:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-none border-l border-line bg-bg p-6 sm:max-w-md" aria-describedby="navigation-description">
            <SheetHeader className="border-b border-line-strong pb-6 text-left">
              <Wordmark compact />
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription id="navigation-description" className="mt-3 max-w-xs text-left text-sm leading-relaxed text-muted">
                Read the system, inspect the policy record, or enter the Axiom console.
              </SheetDescription>
            </SheetHeader>
            <nav aria-label="Mobile primary" className="mt-8 border-t border-line">
              {nav.map((item, index) => (
                <SheetClose asChild key={item.name}>
                  <a href={item.href} className="flex items-center justify-between border-b border-line py-4 font-serif text-2xl text-ink hover:text-accent">
                    <span>{item.name}</span>
                    <span className="font-mono text-[11px] text-muted">0{index + 1}</span>
                  </a>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              <SheetClose asChild>
                <a href="/auth/sign-up" className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-3 text-sm font-semibold text-accent-ink hover:bg-accent-2">
                  Enter the console <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="/auth/sign-in" className="inline-flex items-center justify-center rounded-sm border border-line px-4 py-3 text-sm font-semibold text-ink hover:border-line-strong">
                  Sign in
                </a>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
