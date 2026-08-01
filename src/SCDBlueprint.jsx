import React, { useState } from "react";
import { Play, RotateCcw, ArrowRight, Layers, History, Copy, FileStack } from "lucide-react";

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
.scd-mono { font-family: 'IBM Plex Mono', monospace; }
.scd-sans { font-family: 'IBM Plex Sans', sans-serif; }
.scd-grid-bg {
  background-color: #0B2036;
  background-image:
    linear-gradient(rgba(79, 209, 232, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 209, 232, 0.07) 1px, transparent 1px);
  background-size: 28px 28px;
}
@keyframes scd-flash {
  0% { background-color: rgba(242, 169, 59, 0.55); }
  100% { background-color: rgba(242, 169, 59, 0.08); }
}
.scd-flash { animation: scd-flash 1.1s ease-out; }
@keyframes scd-slide-in {
  0% { opacity: 0; transform: translateY(-8px); }
  100% { opacity: 1; transform: translateY(0); }
}
.scd-slide-in { animation: scd-slide-in 0.5s ease-out; }
@keyframes scd-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.scd-fade-in { animation: scd-fade-in 0.6s ease-out; }
`;

const TABS = [
  { id: "1", label: "TYPE 1", sub: "Overwrite", icon: Copy },
  { id: "2", label: "TYPE 2", sub: "New Row + History", icon: History },
  { id: "3", label: "TYPE 3", sub: "Previous-Value Column", icon: Layers },
  { id: "4", label: "TYPE 4", sub: "Separate History Table", icon: FileStack },
];

const COPY = {
  1: {
    title: "Type 1 — Overwrite",
    what: "The old value is replaced in place. No trace of the previous state remains.",
    when: "Use when history has no business value — typos, cosmetic corrections, or fields nobody reports on historically.",
    tradeoff: "Fastest and simplest, but every past report that joins to this row now silently sees today's value, even for yesterday's facts.",
    action: "Alice moves from Lisbon to Porto",
  },
  2: {
    title: "Type 2 — New Row + History",
    what: "The current row is closed out (end-dated, flagged inactive) and a brand-new row is inserted for the new value.",
    when: "Use when you need full history — e.g. \"what sales region was this customer in when the order was placed?\"",
    tradeoff: "Preserves complete history and works cleanly with point-in-time joins, but the table grows with every change and every query must filter for the active row.",
    action: "Alice moves from Lisbon to Porto",
  },
  3: {
    title: "Type 3 — Previous-Value Column",
    what: "The current value moves into a 'previous' column and the new value takes its place. Only one prior state is kept.",
    when: "Use for a lightweight before/after comparison — e.g. comparing this quarter's region to last quarter's — without the overhead of full row history.",
    tradeoff: "Cheap and simple to query, but only remembers one hop back. A second change overwrites the 'previous' value and the original is gone for good.",
    action: "Alice moves from Lisbon to Porto",
  },
  4: {
    title: "Type 4 — Separate History Table",
    what: "The main dimension table always holds only the current value. Every change is also appended as a new row in a separate history table.",
    when: "Use for high-churn attributes where you want a small, fast current table but still need a full audit trail elsewhere.",
    tradeoff: "Keeps the primary table lean and fast for normal joins, at the cost of maintaining and joining a second table whenever history is actually needed.",
    action: "Alice moves from Lisbon to Porto",
  },
};

// ---- cell + record-table helpers -------------------------------------
// A "record table" renders as a real <table> from sm breakpoint up, and as
// stacked label/value cards below sm. Nothing depends on horizontal
// scrolling or a visible scrollbar, since mobile browsers hide those.

function cell(value, opts = {}) {
  return { value, flash: !!opts.flash, dim: !!opts.dim, className: opts.className || "" };
}

function Th({ children }) {
  return (
    <th className="scd-mono text-[10px] uppercase tracking-widest text-cyan-300/70 font-medium px-3 py-2 text-left border-b border-cyan-400/20 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ cell: c }) {
  return (
    <td
      className={`scd-mono text-[13px] px-3 py-2.5 border-b border-cyan-400/10 whitespace-nowrap ${
        c.dim ? "text-slate-500 line-through" : "text-slate-200"
      } ${c.flash ? "scd-flash" : ""} ${c.className}`}
    >
      {c.value}
    </td>
  );
}

function RecordTable({ columns, rows, caption }) {
  return (
    <div>
      {caption && (
        <div className="scd-mono text-[10px] text-cyan-300/60 tracking-widest uppercase mb-1.5 px-1">
          {caption}
        </div>
      )}

      {/* sm and up: real table */}
      <table className="hidden sm:table w-full border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <Th key={c}>{c}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={row.isNew ? "scd-slide-in" : ""}>
              {row.cells.map((c, ci) => (
                <Td key={ci} cell={c} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* below sm: stacked label / value cards, no scrolling needed */}
      <div className="sm:hidden space-y-2.5">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`rounded-sm border divide-y divide-cyan-400/10 ${
              row.isNew ? "scd-slide-in border-amber-400/30" : "border-cyan-400/15"
            }`}
          >
            {row.cells.map((c, ci) => (
              <div key={ci} className="flex items-baseline justify-between gap-3 px-3 py-2">
                <span className="scd-mono text-[10px] uppercase tracking-widest text-cyan-300/60 shrink-0">
                  {columns[ci]}
                </span>
                <span
                  className={`scd-mono text-[13px] text-right ${
                    c.dim ? "text-slate-500 line-through" : "text-slate-200"
                  } ${c.flash ? "scd-flash px-1.5 py-0.5 rounded-sm" : ""} ${c.className}`}
                >
                  {c.value}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ children }) {
  return <div className="border border-cyan-400/20 bg-[#0d2740]/60 rounded-sm">{children}</div>;
}

function PanelHeader({ n, label }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cyan-400/20">
      <span className="scd-mono text-[10px] text-amber-400/90 tracking-widest">FIG.{n}</span>
      <span className="scd-mono text-[10px] text-cyan-300/60 tracking-widest uppercase">{label}</span>
    </div>
  );
}

function ApplyButton({ onClick, applied }) {
  return (
    <button
      onClick={onClick}
      disabled={applied}
      className={`scd-mono text-[11px] tracking-wide uppercase flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm border transition-colors ${
        applied
          ? "border-cyan-400/20 text-slate-500 cursor-not-allowed"
          : "border-amber-400/60 text-amber-300 hover:bg-amber-400/10"
      }`}
    >
      <Play size={12} />
      {applied ? "Change applied" : "Apply change"}
    </button>
  );
}

function ResetButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="scd-mono text-[11px] tracking-wide uppercase flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm border border-slate-500/30 text-slate-400 hover:text-slate-200 hover:border-slate-400/50 transition-colors"
    >
      <RotateCcw size={12} />
      Reset
    </button>
  );
}

// ---- the four demos -----------------------------------------------------

function Type1Demo({ applied }) {
  const columns = ["customer_id", "name", "city"];
  const rows = [
    {
      cells: [
        cell("101"),
        cell("Alice Nunes"),
        cell(applied ? "Porto" : "Lisbon", { flash: applied }),
      ],
    },
  ];
  return <RecordTable columns={columns} rows={rows} />;
}

function Type2Demo({ applied }) {
  const columns = ["customer_id", "name", "city", "start_date", "end_date", "current"];
  const rows = [
    {
      cells: [
        cell("101"),
        cell("Alice Nunes"),
        cell("Lisbon", { dim: applied }),
        cell("2023-01-01", { dim: applied }),
        cell(applied ? "2026-07-24" : "NULL", { flash: applied }),
        cell(applied ? "N" : "Y", { flash: applied }),
      ],
    },
  ];
  if (applied) {
    rows.push({
      isNew: true,
      cells: [
        cell("101"),
        cell("Alice Nunes"),
        cell("Porto", { className: "text-amber-300" }),
        cell("2026-07-24", { className: "text-amber-300" }),
        cell("NULL"),
        cell("Y", { className: "text-amber-300" }),
      ],
    });
  }
  return <RecordTable columns={columns} rows={rows} />;
}

function Type3Demo({ applied }) {
  const columns = ["customer_id", "name", "current_city", "previous_city", "change_date"];
  const rows = [
    {
      cells: [
        cell("101"),
        cell("Alice Nunes"),
        cell(applied ? "Porto" : "Lisbon", { flash: applied }),
        cell(applied ? "Lisbon" : "NULL", { flash: applied }),
        cell(applied ? "2026-07-24" : "NULL", { flash: applied }),
      ],
    },
  ];
  return <RecordTable columns={columns} rows={rows} />;
}

function Type4Demo({ applied }) {
  const currentColumns = ["customer_id", "name", "city"];
  const currentRows = [
    {
      cells: [cell("101"), cell("Alice Nunes"), cell(applied ? "Porto" : "Lisbon", { flash: applied })],
    },
  ];

  const historyColumns = ["customer_id", "city", "change_date"];
  const historyRows = [{ cells: [cell("101"), cell("Lisbon"), cell("2023-01-01")] }];
  if (applied) {
    historyRows.push({
      isNew: true,
      cells: [
        cell("101"),
        cell("Porto", { className: "text-amber-300" }),
        cell("2026-07-24", { className: "text-amber-300" }),
      ],
    });
  }

  return (
    <div className="space-y-5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
      <RecordTable columns={currentColumns} rows={currentRows} caption="dim_customer (current)" />
      <RecordTable columns={historyColumns} rows={historyRows} caption="dim_customer_history" />
    </div>
  );
}

const DEMOS = { 1: Type1Demo, 2: Type2Demo, 3: Type3Demo, 4: Type4Demo };

export default function SCDBlueprint() {
  const [activeTab, setActiveTab] = useState("1");
  const [applied, setApplied] = useState({ 1: false, 2: false, 3: false, 4: false });

  const setActiveApplied = (val) => setApplied((prev) => ({ ...prev, [activeTab]: val }));

  const Demo = DEMOS[activeTab];
  const info = COPY[activeTab];
  const isApplied = applied[activeTab];

  return (
    <div className="scd-grid-bg min-h-screen w-full flex justify-center py-8 px-4">
      <style>{FONT_STYLE}</style>
      <div className="w-full max-w-6xl">
        {/* corner registration marks */}
        <div className="relative border border-cyan-400/25 rounded-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400/70 z-10" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400/70 z-10" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400/70 z-10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400/70 z-10" />

          {/* header */}
          <div className="px-5 sm:px-8 pt-7 pb-5 border-b border-cyan-400/20">
            <div className="scd-mono text-[10px] tracking-[0.25em] text-amber-400/80 mb-2">
              BLUEPRINT NO. SCD—01/04
            </div>
            <h1 className="scd-mono text-xl sm:text-2xl text-slate-50 font-semibold tracking-tight">
              Slowly Changing Dimensions
            </h1>
            <p className="scd-sans text-[13px] text-slate-400 mt-1.5 leading-relaxed">
              Four ways to handle a dimension attribute that changes over time. Pick a type below, then apply the change and watch how each strategy actually stores it.
            </p>
          </div>

          {/* what is SCD */}
          <div className="px-5 sm:px-8 py-5 border-b border-cyan-400/20 bg-cyan-400/[0.03]">
            <div className="scd-mono text-[10px] uppercase tracking-widest text-amber-400/80 mb-2">
              What is a Slowly Changing Dimension?
            </div>
            <p className="scd-sans text-[13px] text-slate-300 leading-relaxed mb-3">
              In a data warehouse, a "dimension" is a table describing an entity — a customer, product, or store — that mostly stays the same but occasionally changes: a customer moves city, a product gets reclassified, a store changes region. An SCD strategy is just the rule for what your table does the moment that attribute changes: overwrite it, keep it, or park it somewhere else. "Slowly" just means these changes are infrequent compared to the fact data (orders, clicks, transactions) flowing in constantly.
            </p>
            <div className="scd-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
              When do you need to think about this at all
            </div>
            <p className="scd-sans text-[13px] text-slate-300 leading-relaxed">
              Any time a report could give a different answer depending on which point in time you ask about — "which region was this sale attributed to when it happened?" vs "which region is this customer in today?" If that distinction never matters for your use case, a plain overwrite (Type 1) is fine and you don't need to reach for anything fancier.
            </p>
          </div>

          {/* tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-cyan-400/20">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              const active = t.id === activeTab;
              const mobileRightBorder = i % 2 === 0 ? "border-r" : "";
              const mobileBottomBorder = i < 2 ? "border-b" : "";
              const desktopRightBorder = i < TABS.length - 1 ? "sm:border-r" : "sm:border-r-0";
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-3 border-cyan-400/20 transition-colors text-center sm:text-left ${mobileRightBorder} ${mobileBottomBorder} sm:border-b-0 ${desktopRightBorder} ${
                    active ? "bg-cyan-400/10" : "hover:bg-cyan-400/5"
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${active ? "text-amber-400" : "text-cyan-300/50"}`} />
                  <span className="min-w-0">
                    <span
                      className={`scd-mono block text-[11px] tracking-widest ${
                        active ? "text-amber-400" : "text-cyan-300/60"
                      }`}
                    >
                      {t.label}
                    </span>
                    <span className="scd-sans block text-[11px] text-slate-400 truncate">{t.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* body */}
          <div key={activeTab} className="scd-fade-in grid md:grid-cols-5 gap-5 p-5 sm:p-7">
            <div className="md:col-span-2 space-y-4 min-w-0">
              <h2 className="scd-mono text-[15px] text-slate-50 font-medium">{info.title}</h2>
              <div className="space-y-3">
                <div>
                  <div className="scd-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
                    What happens
                  </div>
                  <p className="scd-sans text-[13px] text-slate-300 leading-relaxed">{info.what}</p>
                </div>
                <div>
                  <div className="scd-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
                    When to use it
                  </div>
                  <p className="scd-sans text-[13px] text-slate-300 leading-relaxed">{info.when}</p>
                </div>
                <div>
                  <div className="scd-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
                    Tradeoff
                  </div>
                  <p className="scd-sans text-[13px] text-slate-300 leading-relaxed">{info.tradeoff}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3 min-w-0">
              <Panel>
                <PanelHeader n={activeTab} label="dim_customer" />
                <div className="p-4">
                  <Demo applied={isApplied} />
                </div>
              </Panel>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="scd-sans text-[12px] text-slate-400 flex items-center gap-1.5">
                  <ArrowRight size={12} className="text-amber-400/80 shrink-0" />
                  {info.action}
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2">
                  <ApplyButton onClick={() => setActiveApplied(true)} applied={isApplied} />
                  <ResetButton onClick={() => setActiveApplied(false)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scd-mono text-[10px] text-slate-600 tracking-widest mt-3 text-center">
          TAP "APPLY CHANGE" ON EACH TAB TO SEE THE UPDATE STRATEGY IN ACTION
        </div>
      </div>
    </div>
  );
}
