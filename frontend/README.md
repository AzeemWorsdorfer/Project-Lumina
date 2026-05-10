# Lumina Frontend

React frontend for the Lumina Socratic mind mapping application.

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running at `http://localhost:8000`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Features

- **Mind Map Editor** — Interactive node-based visualization with ReactFlow
- **PDF Viewer** — Side-by-side document viewing
- **Socratic Hints** — AI-powered learning guidance
- **Session Management** — Create, save, and resume study sessions
- **User Authentication** — Supabase Auth integration
- **Light / Dark Mode** — Full theme system with toggle, localStorage persistence, and system preference detection. All components adapt via CSS custom properties and semantic theme tokens.

## Theme System

The app supports both light and dark modes using a CSS custom property approach:

- **`ThemeContext`** (`src/contexts/ThemeContext.jsx`) provides `{ theme, toggleTheme, setTheme }`
- Theme preference is persisted in `localStorage` under key `lumina-theme`
- On first visit, respects the OS `prefers-color-scheme` setting; defaults to dark
- The `.dark` class on `<html>` controls which set of CSS variables is active
- **Semantic utility classes** (`bg-primary`, `text-secondary`, `border-default`, `bg-glass`, etc.) are defined via Tailwind v4 `@utility` directives in `index.css` and reference CSS variables that change per theme
- Coloring amber accent is preserved in both modes (`#d97706` light, `#f59e0b` dark)

### Adding theme-aware components

Use the semantic utility classes instead of hardcoded Tailwind color classes:

```jsx
// Instead of:
<div className="bg-slate-900 text-slate-200 border-slate-700/30">

// Use:
<div className="bg-primary text-primary border-default">
```

Available utilities are defined in `src/index.css` under the `@utility` blocks (backgrounds, text, borders, shadows).

## Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.jsx
│   │   ├── MapCanvas.jsx
│   │   ├── Toolbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PdfViewer.jsx
│   │   ├── EditableNode.jsx
│   │   ├── PomodoroTimer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/              # Page components
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── services/           # API services
│   │   └── api.js
│   ├── lib/                # Libraries
│   │   └── supabase.js
│   ├── utils/              # Utilities
│   │   └── mapTransform.js
│   ├── hooks/              # Custom hooks
│   │   └── useKeyboardShortcuts.js
│   ├── config.js           # Environment configuration
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/                 # Static assets
├── package.json
├── vite.config.js
└── .env.example
```

## Tech Stack

- **Framework**: React 19 + Vite
- **UI Library**: @xyflow/react (ReactFlow)
- **Icons**: lucide-react
- **Styling**: Tailwind CSS v4 (with `@utility` directives for theme variables)
- **State**: React Context
- **Backend**: FastAPI
- **Database**: Supabase
