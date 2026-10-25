# RepairPath

> **A dependable, privacy-first home appliance maintenance and financial decision application.**

RepairPath helps homeowners and renters answer three practical questions:
1. *"What might be wrong with my appliance?"* (Safe preliminary troubleshooting)
2. *"What happened the last time this problem occurred?"* (Repair Memory recurrence analysis)
3. *"Is this repair worth the money?"* (QuoteSense itemization & Repair-vs-Replace actuarial calculator)

---

## Key Features

### 1. Appliance Registry & Maintenance Management
- Comprehensive inventory with brand, model, serial, purchase date, purchase price, and location.
- Live lifespan tracking and age calculation based on manufacturer baselines.
- Upcoming warranty reminders and expiry tracking.

### 2. Safe Preliminary Troubleshooter
- **Emergency Hazard Screening:** Automatic safety lockouts for gas leaks, electrical sparking/smoke, or active flooding with clear emergency instructions.
- **Sequential Diagnostic Checks:** Non-destructive preliminary steps with technical explanations of the intent behind each test.
- **Session Logging:** Saves diagnostic session outcomes directly to the appliance's permanent record.

### 3. Repair Memory & Technician Briefing
- **Stem-Matched Recurrence Detection:** Automatically scans historical repair logs for matching symptoms (e.g., recurring defrost clogs, pump obstructions).
- **Pre-Visit Technician Packet:** Exports an itemized diagnostic packet with exact dates of prior failures, past parts replaced, and targeted questions for the technician.

### 4. QuoteSense — Quotation Management & Comparison
- Evaluates contractor quotes using the exact financial formula:
  $$\text{Total} = \text{Labour} + \text{Parts} + \text{Taxes} + \text{Additional Fees} - \text{Discounts}$$
- Itemized parts list with OEM numbers and unit pricing.
- Side-by-side comparison across multiple quotes with automatic lowest-cost highlighting.
- Clear data attribution: distinctly labels user-entered data versus verified market rates.

### 5. Repair-vs-Replace Actuarial Calculator
- Transparent financial decision model over customizable 2, 3, 5, or 7-year time horizons.
- Evaluates:
  - **The 50% Prudence Ceiling:** Warns if repair cost exceeds 50% of buying a comparable new machine.
  - **Remaining Lifespan Depreciation:** Flags when an aged chassis cannot amortize heavy mechanical overhaul.
  - **Annualized Cost Comparison:** Direct capital vs normalized annual running cost difference.
- Explicit modeling limitations and missing input notices (no arbitrary AI confidence percentages).

### 6. Persistence & Privacy
- **100% Offline-First:** Stores all data locally in the browser's `localStorage` under `repairpath_v1_store`.
- **Zero Tracking:** No cloud accounts, passwords, analytics, or remote database sync.
- **Cascade Deletion:** Safely cleans up all related repair, diagnostic, and quotation records when an appliance is deleted.
- **Demo Data Reset:** Built-in mechanism to restore original demo records with confirmation.

---

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Vanilla Tailwind CSS with custom editorial palette:
  - `#F5F4EF` (Warm Stone Background)
  - `#252923` (Charcoal Typography)
  - `#285B45` (Forest Green Accent)
  - `#DADBD3` (Subtle Borders)
- **Icons:** Lucide React

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
# Clone the repository
git clone <your-repository-url>
cd repairpath

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Verification & Testing
RepairPath includes automated verification test suites:

```bash
# Run Part 2 Verification (Repair Memory & Troubleshooter)
npx tsx src/tests/verify_part2.ts

# Run Part 3 Verification (QuoteSense formula, 50% rule, persistence cascade)
npx tsx src/tests/verify_part3.ts

# Run production build validation
npm run build
```

---

## License
MIT License.
