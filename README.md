# PageWise - GATE OS Visual & Infographic Tutor

> Interactive visual and infographic tutor for GATE Operating Systems numericals with steppable worked examples, predict-then-verify animations, and automated diagnostic feedback.

---

## ⚡ Overview

**PageWise** simplifies complex Operating Systems numericals for GATE aspirants and CS students through visual and steppable models:
- **Paging & Address Translation**: Multi-level paging, page table entries, physical address calculation.
- **TLB & Caching**: Hit/miss timelines, effective memory access time (EMAT).
- **Virtual Memory & Page Replacement**: FIFO, LRU, Optimal algorithms with visualization.
- **Predict-then-Verify Workflow**: Test your understanding step-by-step with immediate feedback.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/)

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation

```bash
git clone https://github.com/MihirKBAI/pagewise-gate-os.git
cd pagewise-gate-os
npm install
```

### Development Mode

Run the web version with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Running Tests

```bash
npm test
```

---

## 🖥️ Desktop Application & Executable

PageWise can be packaged and run as a standalone desktop application.

### 1. Run in Desktop Mode

```bash
npm run build
npm start
```

### 2. Build the Standalone Executable

To generate the standalone 64-bit Linux executable bundle:
```bash
npm run build
npm run package
```

This generates:
- **`./pagewise`**: Direct root launcher script.
- **`dist-desktop/pagewise-linux-x64/pagewise`**: Complete self-contained ELF executable bundle.
- **`dist-desktop/pagewise.desktop`**: Linux application menu entry with icon.

### 3. Launching

```bash
./pagewise
```

---

## 📁 Project Structure

```text
├── electron/              # Electron desktop main process
│   └── main.cjs
├── public/                # Static assets & web manifest
├── scripts/               # Packaging and bundling automation
│   └── bundle-app.js
├── src/
│   ├── content/           # Curated GATE OS problems & theories
│   ├── core/              # OS numerical simulators (paging, TLB, VM)
│   ├── ui/                # UI components, animations & layout
│   ├── App.tsx            # Root application view
│   └── main.tsx           # Entry point
├── pagewise               # Executable launcher
├── vite.config.ts         # Vite build configuration
└── package.json           # Dependencies and scripts
```

---

## 📜 License

MIT License.
