Awesome—rebuild is the right call. I reviewed your code and here’s a clean refactor plan that fixes the editing bugs and splits the app into small, testable React components without losing styling.

---

# What’s causing the budget-cell weirdness

* You parse/round on every `onChange`, then re-render a formatted value; that forces caret jumps and “eats” digits. Your `updateFlightValue` rounds and recalculates per keypress (e.g., `roundToCents(parseFloat(value) || 0)` and recalcs impressions/traffic immediately). That’s exactly the pattern that produces “typing 7 becomes 1 / only last decimal changes.” 

**Fix pattern:** keep a string **edit buffer** while the input is focused; only parse/round **on blur / Enter**. Recompute impressions/traffic on commit (or debounce ~200ms), not per keystroke. (You already have the math hooks/utilities—reuse them.) 

---

# Component breakdown (preserves Tailwind styling)

Think in three layers: **page → table → cells/modals**.

## 1) Page/State

* **`CampaignPage`**
  Owns `campaigns`, `activeTab`, history (undo/redo), and top-level modals. You already keep history/undo/redo; move that here intact.  
* **`TopBar`**
  Buttons for Undo/Redo, Reset, Export CSV, etc. Export logic can stay as a utility called from here. 

**Keep these utilities as modules (no logic change):**

* `calculateImpressions`, `calculateBudget`, `roundToCents`, `gracefulRound`, `formatDate`, `formatDateForInput`, `getMonthsBetween`, `calculateTotals`, etc. You’re already using them throughout generation/validation; just move to `/utils`.  

## 2) Table

* **`FlightTable`** (pure, controlled)

  * Props: `campaign`, `onCommitCell`, `onSelectRows`, `onSplit`, `onLock`, `selection`, `collapsedParents`, etc.
  * Renders header/body/footer based on `templateType` (you already branch for sem-social/programmatic/youtube—centralize that here). 
  * Uses subcomponents below. Keeps sticky header/footer.

* **`TableHeader`**
  Outputs Tailwind classNames exactly as you have them (no style loss). 

* **`TableFooterTotals`**
  Receives `totals` and mirrors your totals row (don’t re-calc inside the component; pass from parent). 

* **`FlightRow`**
  One row per flight. Applies row states (hover, child/parent, collapsed) with your existing classes. Handles multi-select click behavior (line cell toggles). 

## 3) Cells (single-purpose, reusable)

* **`LineCell`**
  Shows line number, “-” for child, caret for collapse if parent. Contains your collapse/selection logic. 

* **`DateCell`**
  Displays formatted date; on click, opens a **lightweight popover** with `type="date"` inputs for start/end (no always-on inputs in the grid). Commit on blur/Enter; Esc to cancel. You already use date inputs in forms and edit modals—reuse that UX in the popover. 

* **`MoneyCell` (Budget)**
  The crucial one: controlled **edit buffer**.

  * Display mode: `$50.00` (formatted).
  * Edit mode: raw string (e.g., `50.00`) in a `type="text"` with `inputMode="decimal"`.
  * On focus → set buffer from current value. On change → update buffer only. On blur/Enter → parse, round, call `onCommitCell('budget', value)`.
  * On Esc → revert buffer.
    Uses your existing `updateFlightValue` on commit so downstream fields (impressions/traffic) recalc once. 

* **`NumberCell` (Impressions/Views)**
  Same edit-buffer pattern but integer-only. On commit, back-compute budget via your `calculateBudget` when unlocked. 

* **`DerivedCell` (Traffic Budget/Impressions, Daily Budget/Retail)**
  Read-only unless you explicitly allow overrides. If editable, still use the edit-buffer pattern and your existing branch logic for programmatic vs. YouTube. 

* **`ActionsCell`**
  Buttons for Split, Lock, Zero, etc., calling the handlers you already have (split/lock/redistribute code stays in the page container). 

## 4) Modals/Drawers

* **`EditCampaignModal`** — already formats numbers with `toFixed(2)` safely (not per keystroke). Keep that pattern. 
* **`RedistributeModal`** — your existing open/execute logic just moves out of the table into its own component. 

## 5) Hooks (tiny, focused)

* **`useEditBuffer()`** → { value, set, start(value), commit(parseFn), cancel() }
* **`useKeyboardNav()`** → applies Excel keys (Enter/Tab/Arrows) to move focus across cells/rows.
* **`useSelection()`** → Shift+Click range, Cmd/Ctrl+Click toggle, exposes selected ids and helpers.
* **`useUndoRedo()`** → wraps your history logic; the underlying code is already solid. 

---

# Styling: keep every Tailwind class

* **Extract class “tokens”** to objects so styles move with components:

  ```js
  export const td = "border border-gray-200 px-4 py-3 text-sm text-gray-900";
  export const th = "border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900";
  export const row = "hover:bg-gray-50";
  ```

  Use them in components with `clsx`/`tailwind-merge` to compose states (selected, child, collapsed) without changing visuals. Your current header/body/footer class names can be copied verbatim into these tokens. 

* **No global CSS rewrites** needed—each component renders the same Tailwind strings you have now, so the look stays identical.

---

# Start/End date editor (no always-on inputs)

* Click date cell → popover with two native `input[type=date]` fields (`Start`, `End`) and quick **“±1 month”** nudge buttons. Commit on blur/Enter; Esc cancels.
* Optional shortcuts: `[`/`]` shift date range by −/+ 1 month for the focused row; add bulk shift in a small floating toolbar when multiple rows selected. This aligns with the monthly generation logic you already use. 

---

# Data flow on commit (Budget/Impressions)

Use the function you already centralized:

* **Budget commit:** set `flight.budget = roundToCents(parsed)`, then if rate present, recompute impressions and traffic fields.  
* **Impressions commit:** integer → back-compute budget with `calculateBudget`, then traffic fields. 

Totals row still sums via your `calculateTotals` and displays in `TableFooterTotals`. 

---

# Minimal code you’ll drop into cells (pattern)

```jsx
function MoneyCell({ valueCents, onCommit }) {
  const [editing, setEditing] = React.useState(false);
  const [buf, setBuf] = React.useState('');

  const display = `$${(valueCents/100).toFixed(2)}`;

  return editing ? (
    <input
      type="text"
      inputMode="decimal"
      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
      value={buf}
      autoFocus
      onChange={(e) => setBuf(e.target.value)}
      onBlur={() => { onCommit(buf); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { onCommit(buf); setEditing(false); }
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  ) : (
    <button className="w-full text-left px-2 py-1" onClick={() => { setBuf((valueCents/100).toFixed(2)); setEditing(true); }}>
      {display}
    </button>
  );
}
```

Hook `onCommit` to your existing `updateFlightValue(campaignIndex, flightId, 'budget', parsed)`. That keeps all your math and locking rules intact. 

---

# Quick quality-of-life adds (all optional)

* **Sticky totals/footer** and **frozen “Line” column**. You already compute the totals; freezing line helps selection. 
* **Bulk toolbar** when selection exists: Lock/Unlock, Zero→Redistribute, Shift Dates, Set Budget…, all calling your existing handlers. 
* **Variance chips** when a row’s math is off (you already have `validateFlight`; use a tiny warning dot + “Fix” action). 

---

## Deliverables I can generate next

* Skeleton file tree (`/components/table/*`, `/components/modals/*`, `/hooks/*`, `/utils/*`)
* Drop-in **BudgetCell** and **DateCell** components wired to your current handlers
* A tiny **DatePopover** that uses native date inputs and your formatting helpers

If you want, I’ll output the React component files with your exact Tailwind classes so you can paste them straight in.
