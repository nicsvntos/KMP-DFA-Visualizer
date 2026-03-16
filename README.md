# KMP DFA Visualizer

An interactive visualizer for the Knuth-Morris-Pratt (KMP) string matching algorithm with DFA (Deterministic Finite Automaton) graph visualization. Built with Svelte 5, TypeScript, and Tailwind CSS.

## Features

- **Visualizer Tab**: Watch the KMP algorithm execute step-by-step with:
  - Interactive DFA graph visualization using Cytoscape.js
  - Real-time pattern matching with character highlighting
  - Step-by-step execution controls (play, pause, next, previous, reset)

- **Benchmark Tab**: Performance testing to verify O(n+m) time complexity
  - Compare execution times across different text sizes
  - Test with 1MB, 10MB, and custom text sizes

- **Validator Tab**: Logic validation with truth tables
  - Verify pattern matching results
  - Display match positions and validation rules

## Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) (with runes)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **DFA Visualization**: [Cytoscape.js](https://js.cytoscape.org/)
- **Icons**: [Lucide Svelte](https://lucide.dev/)

## Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- npm (comes with Node.js) or [pnpm](https://pnpm.io/) or [yarn](https://yarnpkg.com/)

## Installation

### Windows

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/nicsvntos/KMP-DFA-Visualizer.git
   cd pattern-visualizer
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

   Or if you prefer using pnpm:
   ```powershell
   pnpm install
   ```

### macOS

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nicsvntos/KMP-DFA-Visualizer.git
   cd pattern-visualizer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   Or if you prefer using pnpm:
   ```bash
   pnpm install
   ```

   Or with yarn:
   ```bash
   yarn install
   ```

## Running the Project

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

Then open your browser and navigate to:
- Local: `http://localhost:5173`
- Network: `http://192.168.x.x:5173` (available on your local network)

### Build for Production

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Type Checking

Run Svelte and TypeScript type checking:

```bash
npm run check
```

## How to Use

1. **Enter a Pattern**: Type a search pattern in the input field (e.g., "ABABC")
2. **Enter Text**: Type or paste the text to search within
3. **Build DFA & Run**: Click the button to generate the DFA and start the KMP algorithm
4. **Step Through**: Use the controls to step through each comparison
5. **Watch the Graph**: See the DFA states transition as the algorithm runs
6. **View Matches**: See highlighted matches in the text
