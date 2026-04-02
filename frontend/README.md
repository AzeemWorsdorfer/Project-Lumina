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

- **Mind Map Editor** - Interactive node-based visualization with ReactFlow
- **PDF Viewer** - Side-by-side document viewing
- **Socratic Hints** - AI-powered learning guidance
- **Session Management** - Create, save, and resume study sessions
- **User Authentication** - Supabase Auth integration

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
│   │   └── ProtectedRoute.jsx
│   ├── pages/              # Page components
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx
│   ├── services/           # API services
│   │   └── api.js
│   ├── lib/                # Libraries
│   │   └── supabase.js
│   ├── utils/              # Utilities
│   │   └── mapTransform.js
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
- **Styling**: Tailwind CSS
- **State**: React Context
- **Backend**: FastAPI
- **Database**: Supabase
