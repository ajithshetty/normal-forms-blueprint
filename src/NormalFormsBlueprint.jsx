import React, { useState } from "react";
import { Play, RotateCcw, ArrowRight, Rows3, SplitSquareVertical, Workflow } from "lucide-react";

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
.nf-mono { font-family: 'IBM Plex Mono', monospace; }
.nf-sans { font-family: 'IBM Plex Sans', sans-serif; }
.nf-grid-bg {
  background-color: #0B2036;
  background-image:
    linear-gradient(rgba(79, 209, 232, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 209, 232, 0.07) 1px, transparent 1px);
  background-size: 28px 28px;
}
@keyframes nf-flash {
  0% { background-color: rgba(242, 169, 59, 0.55); }
  100% { background-color: rgba(242, 169, 59, 0.08); }
}
.nf-flash { animation: nf-flash 1.1s ease-out; }
@keyframes nf-slide-in {
  0% { opacity: 0; transform: translateY(-8px); }
  100% { opacity: 1; transform: translateY(0); }
}
.nf-slide-in { animation: nf-slide-in 0.5s ease-out; }
@keyframes nf-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.nf-fade-in { animation: nf-fade-in 0.6s ease-out; }
`;

const TABS = [
  { id: "1", label: "1NF", sub: "Atomic Values", icon: Rows3 },
  { id: "2", label: "2NF", sub: "No Partial Dependency", icon: SplitSquareVertical },
  { id: "3", label: "3NF", sub: "No Transitive Dependency", icon: Workflow },
];

const COPY = {
  1: {
    title: "1NF — Atomic Values, No Repeating Groups",
    what: "Every column holds one single, indivisible value — no comma-separated lists or repeated fields crammed into one cell. If a cell can hold more than one value, the table isn't in 1NF yet.",
    when: "Use as the very first normalization pass on any table where a single field stores multiple values, like a \"products\" column listing several items for one order.",
    tradeoff: "Removes ambiguity about how many values a cell holds and makes each value individually queryable and joinable, but the table grows taller — one order now spans as many rows as it has products.",
    action: "Split the multi-valued products field into one row per product",
    panelLabel: "ORDERS",
  },
  2: {
    title: "2NF — No Partial Dependency",
    what: "Every non-key column must depend on the whole composite primary key, not just part of it. This rule only applies to tables with a composite (multi-column) key. If a column only depends on part of that key, it gets moved into its own table.",
    when: "Use when a table's primary key spans two or more columns and some other columns only relate to one piece of that key — like product_name only ever depending on product_id, not on the order.",
    tradeoff: "Removes duplicated product data that would otherwise repeat on every order line, but reconstructing the full order detail now needs a join between the two tables.",
    action: "Move product_name and product_price into their own products table",
    panelLabel: "ORDER_ITEMS",
  },
  3: {
    title: "3NF — No Transitive Dependency",
    what: "Every non-key column must depend only on the primary key — directly, not by way of another non-key column. If city is really determined by zip_code, and zip_code is determined by the key, then city depends on the key only transitively, through zip_code.",
    when: "Use when one non-key column is really determined by another non-key column rather than by the entity itself — e.g. a customer's city is really a property of their zip code, not of the customer.",
    tradeoff: "Removes redundant city data that would otherwise repeat for every customer sharing a zip code, but looking up a customer's city now requires a join to the zip-code table.",
    action: "Move city into its own zip_code lookup table",
    panelLabel: "CUSTOMERS",
  },
};

// ---- cell + record-table helpers -------------------------------------
// A "record table" renders as a real <table> from sm breakpoint up, and as
// stacked label/value cards below sm — no horizontal scrolling required.

function cell(value, opts = {}) {
  return { value, flash: !!opts.flash, dim: !!opts.dim, className: opts.className || "" };
}

function Th({ children }) {
  return (
    <th className="nf-mono text-[10px] uppercase tracking-widest text-cyan-300/70 font-medium px-3 py-2 text-left border-b border-cyan-400/20 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ cell: c }) {
  return (
    <td
      className={`nf-mono text-[13px] px-3 py-2.5 border-b border-cyan-400/10 whitespace-nowrap ${
        c.dim ? "text-slate-500 line-through" : "text-slate-200"
      } ${c.flash ? "nf-flash" : ""} ${c.className}`}
    >
      {c.value}
    </td>
  );
}

function RecordTable({ columns, rows, caption }) {
  return (
    <div>
      {caption && (
        <div className="nf-mono text-[10px] text-cyan-300/60 tracking-widest uppercase mb-1.5 px-1">
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
            <tr key={ri} className={row.isNew ? "nf-slide-in" : ""}>
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
              row.isNew ? "nf-slide-in border-amber-400/30" : "border-cyan-400/15"
            }`}
          >
            {row.cells.map((c, ci) => (
              <div key={ci} className="flex items-baseline justify-between gap-3 px-3 py-2">
                <span className="nf-mono text-[10px] uppercase tracking-widest text-cyan-300/60 shrink-0">
                  {columns[ci]}
                </span>
                <span
                  className={`nf-mono text-[13px] text-right ${
                    c.dim ? "text-slate-500 line-through" : "text-slate-200"
                  } ${c.flash ? "nf-flash px-1.5 py-0.5 rounded-sm" : ""} ${c.className}`}
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
      <span className="nf-mono text-[10px] text-amber-400/90 tracking-widest">FIG.{n}NF</span>
      <span className="nf-mono text-[10px] text-cyan-300/60 tracking-widest uppercase">{label}</span>
    </div>
  );
}

function ApplyButton({ onClick, applied }) {
  return (
    <button
      onClick={onClick}
      disabled={applied}
      className={`nf-mono text-[11px] tracking-wide uppercase flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm border transition-colors ${
        applied
          ? "border-cyan-400/20 text-slate-500 cursor-not-allowed"
          : "border-amber-400/60 text-amber-300 hover:bg-amber-400/10"
      }`}
    >
      <Play size={12} />
      {applied ? "Normalized" : "Normalize"}
    </button>
  );
}

function ResetButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="nf-mono text-[11px] tracking-wide uppercase flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm border border-slate-500/30 text-slate-400 hover:text-slate-200 hover:border-slate-400/50 transition-colors"
    >
      <RotateCcw size={12} />
      Reset
    </button>
  );
}

// ---- the three demos -----------------------------------------------------

function tablesFor1NF(applied) {
  if (!applied) {
    return [
      {
        caption: "orders — violates 1NF (repeating group in one cell)",
        columns: ["order_id", "customer_name", "products"],
        rows: [
          {
            cells: [
              cell("1001"),
              cell("Diana Prince"),
              cell("Laptop, Mouse", { className: "text-amber-300" }),
            ],
          },
        ],
      },
    ];
  }
  return [
    {
      caption: "orders — 1NF (atomic values, one product per row)",
      columns: ["order_id", "customer_name", "product"],
      rows: [
        { cells: [cell("1001"), cell("Diana Prince"), cell("Laptop", { className: "text-amber-300" })] },
        {
          isNew: true,
          cells: [cell("1001"), cell("Diana Prince"), cell("Mouse", { className: "text-amber-300" })],
        },
      ],
    },
  ];
}

function tablesFor2NF(applied) {
  if (!applied) {
    return [
      {
        caption: "order_items — 1NF, but violates 2NF (partial dependency on product_id)",
        columns: ["order_id", "product_id", "product_name", "product_price", "quantity"],
        rows: [
          {
            cells: [
              cell("5001"),
              cell("P01"),
              cell("Laptop", { className: "text-amber-300" }),
              cell("€899", { className: "text-amber-300" }),
              cell("1"),
            ],
          },
          {
            cells: [
              cell("5001"),
              cell("P02"),
              cell("Mouse", { className: "text-amber-300" }),
              cell("€19", { className: "text-amber-300" }),
              cell("2"),
            ],
          },
          {
            cells: [
              cell("5002"),
              cell("P01"),
              cell("Laptop", { className: "text-amber-300" }),
              cell("€899", { className: "text-amber-300" }),
              cell("1"),
            ],
          },
        ],
      },
    ];
  }
  return [
    {
      caption: "order_items — 2NF",
      columns: ["order_id", "product_id", "quantity"],
      rows: [
        { cells: [cell("5001"), cell("P01"), cell("1")] },
        { cells: [cell("5001"), cell("P02"), cell("2")] },
        { cells: [cell("5002"), cell("P01"), cell("1")] },
      ],
    },
    {
      caption: "products — 2NF (new table)",
      columns: ["product_id", "product_name", "product_price"],
      rows: [
        {
          isNew: true,
          cells: [cell("P01"), cell("Laptop", { className: "text-amber-300" }), cell("€899", { className: "text-amber-300" })],
        },
        {
          isNew: true,
          cells: [cell("P02"), cell("Mouse", { className: "text-amber-300" }), cell("€19", { className: "text-amber-300" })],
        },
      ],
    },
  ];
}

function tablesFor3NF(applied) {
  if (!applied) {
    return [
      {
        caption: "customers — 2NF, but violates 3NF (city depends on zip_code, not on customer_id)",
        columns: ["customer_id", "customer_name", "zip_code", "city"],
        rows: [
          {
            cells: [
              cell("C01"),
              cell("Diana Prince"),
              cell("1000-001"),
              cell("Lisbon", { className: "text-amber-300" }),
            ],
          },
          {
            cells: [
              cell("C02"),
              cell("Bruce Wayne"),
              cell("1000-001"),
              cell("Lisbon", { className: "text-amber-300" }),
            ],
          },
          {
            cells: [
              cell("C03"),
              cell("Clark Kent"),
              cell("4000-000"),
              cell("Porto", { className: "text-amber-300" }),
            ],
          },
        ],
      },
    ];
  }
  return [
    {
      caption: "customers — 3NF",
      columns: ["customer_id", "customer_name", "zip_code"],
      rows: [
        { cells: [cell("C01"), cell("Diana Prince"), cell("1000-001")] },
        { cells: [cell("C02"), cell("Bruce Wayne"), cell("1000-001")] },
        { cells: [cell("C03"), cell("Clark Kent"), cell("4000-000")] },
      ],
    },
    {
      caption: "zip_codes — 3NF (new table)",
      columns: ["zip_code", "city"],
      rows: [
        { isNew: true, cells: [cell("1000-001"), cell("Lisbon", { className: "text-amber-300" })] },
        { isNew: true, cells: [cell("4000-000"), cell("Porto", { className: "text-amber-300" })] },
      ],
    },
  ];
}

const TABLE_BUILDERS = { 1: tablesFor1NF, 2: tablesFor2NF, 3: tablesFor3NF };

export default function NormalFormsBlueprint() {
  const [activeTab, setActiveTab] = useState("1");
  const [applied, setApplied] = useState({ 1: false, 2: false, 3: false });

  const setActiveApplied = (val) => setApplied((prev) => ({ ...prev, [activeTab]: val }));

  const info = COPY[activeTab];
  const isApplied = applied[activeTab];
  const tables = TABLE_BUILDERS[activeTab](isApplied);
  const multi = tables.length > 1;

  return (
    <div className="nf-grid-bg min-h-screen w-full flex justify-center py-8 px-4">
      <style>{FONT_STYLE}</style>
      <div className="w-full max-w-3xl">
        {/* corner registration marks */}
        <div className="relative border border-cyan-400/25 rounded-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400/70 z-10" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400/70 z-10" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400/70 z-10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400/70 z-10" />

          {/* header */}
          <div className="px-5 sm:px-8 pt-7 pb-5 border-b border-cyan-400/20">
            <div className="nf-mono text-[10px] tracking-[0.25em] text-amber-400/80 mb-2">
              BLUEPRINT NO. NF—01/03
            </div>
            <h1 className="nf-mono text-xl sm:text-2xl text-slate-50 font-semibold tracking-tight">
              Database Normal Forms
            </h1>
            <p className="nf-sans text-[13px] text-slate-400 mt-1.5 leading-relaxed">
              Three rules for organizing tables so data isn't duplicated or ambiguous. Pick a form below, then normalize and watch the table actually split.
            </p>
          </div>

          {/* what is normalization */}
          <div className="px-5 sm:px-8 py-5 border-b border-cyan-400/20 bg-cyan-400/[0.03]">
            <div className="nf-mono text-[10px] uppercase tracking-widest text-amber-400/80 mb-2">
              What is normalization?
            </div>
            <p className="nf-sans text-[13px] text-slate-300 leading-relaxed mb-3">
              Normalization is the process of restructuring tables so each fact is stored in exactly one place. Left un-normalized, a table tends to repeat the same information — a product's price on every order line, a city name for every customer in that zip code — which wastes space and risks the copies drifting out of sync. Each normal form (1NF, 2NF, 3NF) is a stricter rule that catches a specific kind of redundancy.
            </p>
            <div className="nf-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
              When do you need to think about this at all
            </div>
            <p className="nf-sans text-[13px] text-slate-300 leading-relaxed">
              Whenever you're designing a table for an OLTP-style system — one that inserts and updates rows constantly — and you notice the same value would need to be written and kept in sync in more than one row. If a table is read-heavy, rarely updated, and denormalized on purpose (e.g. an analytics fact table), breaking these rules is often a deliberate, reasonable tradeoff rather than a mistake.
            </p>
          </div>

          {/* tabs */}
          <div className="grid grid-cols-3 border-b border-cyan-400/20">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              const active = t.id === activeTab;
              const desktopRightBorder = i < TABS.length - 1 ? "border-r" : "border-r-0";
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-4 py-3 border-cyan-400/20 transition-colors text-center sm:text-left ${desktopRightBorder} ${
                    active ? "bg-cyan-400/10" : "hover:bg-cyan-400/5"
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${active ? "text-amber-400" : "text-cyan-300/50"}`} />
                  <span className="min-w-0">
                    <span
                      className={`nf-mono block text-[11px] tracking-widest ${
                        active ? "text-amber-400" : "text-cyan-300/60"
                      }`}
                    >
                      {t.label}
                    </span>
                    <span className="nf-sans block text-[11px] text-slate-400 truncate">{t.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* body */}
          <div key={activeTab} className="nf-fade-in grid md:grid-cols-5 gap-5 p-5 sm:p-7">
            <div className="md:col-span-2 space-y-4 min-w-0">
              <h2 className="nf-mono text-[15px] text-slate-50 font-medium">{info.title}</h2>
              <div className="space-y-3">
                <div>
                  <div className="nf-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
                    What happens
                  </div>
                  <p className="nf-sans text-[13px] text-slate-300 leading-relaxed">{info.what}</p>
                </div>
                <div>
                  <div className="nf-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
                    When to use it
                  </div>
                  <p className="nf-sans text-[13px] text-slate-300 leading-relaxed">{info.when}</p>
                </div>
                <div>
                  <div className="nf-mono text-[10px] uppercase tracking-widest text-cyan-300/60 mb-1">
                    Tradeoff
                  </div>
                  <p className="nf-sans text-[13px] text-slate-300 leading-relaxed">{info.tradeoff}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3 min-w-0">
              <Panel>
                <PanelHeader n={activeTab} label={info.panelLabel} />
                <div className={`p-4 ${multi ? "space-y-5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4" : ""}`}>
                  {tables.map((t, i) => (
                    <RecordTable key={i} columns={t.columns} rows={t.rows} caption={t.caption} />
                  ))}
                </div>
              </Panel>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="nf-sans text-[12px] text-slate-400 flex items-center gap-1.5">
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

        <div className="nf-mono text-[10px] text-slate-600 tracking-widest mt-3 text-center">
          TAP "NORMALIZE" ON EACH TAB TO SEE THE TABLE ACTUALLY SPLIT
        </div>
      </div>
    </div>
  );
}
