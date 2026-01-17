# Prow Frontend

A production-grade frontend website for Prow, a secure AI service for enterprise employees. Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

## Design Philosophy

**Radical Clarity** — A refined, editorial fintech aesthetic inspired by Mercury.com. The design eschews generic "AI startup" tropes in favor of clean lines, generous whitespace, and sophisticated typography.

### Key Design Principles

- **Light & Airy**: Off-white backgrounds (`#F9F9F7`, `#F2F4F6`) instead of pure white
- **Distinctive Typography**: Space Grotesk for headings, IBM Plex Sans for body text
- **Sophisticated Accents**: Electric maritime blue (`#0066CC`) applied sparingly
- **Motion-First**: Every interaction is animated with custom bezier curves
- **Abstract Visualizations**: CSS/SVG-based graphics for AI processes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Ollama Cloud API key (required for AI chat functionality)

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Ollama Cloud API Key (required for AI chat)
OLLAMA_API_KEY=your_ollama_api_key_here
```

Get your Ollama Cloud API key from [ollama.com](https://ollama.com).

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
prowEncryption/
├── app/
│   ├── layout.tsx          # Root layout with font configuration
│   ├── page.tsx             # Main page composition
│   └── globals.css          # Global styles and CSS variables
├── components/
│   ├── Navigation.tsx       # Fixed navigation with scroll effects
│   ├── Hero.tsx             # Hero section with staggered animations
│   ├── Features.tsx         # Feature grid with hover effects
│   ├── SecurityVisualization.tsx  # Abstract security barrier visualization
│   ├── KnowledgePool.tsx    # Knowledge network visualization
│   ├── ChatIntegration.tsx  # Chat interface mockup with sidebar
│   └── Footer.tsx           # Footer component
└── package.json
```

## Features

- **Staggered Page Loads**: Elements slide up and fade in with custom bezier curves
- **Scroll-Triggered Animations**: Components animate as they enter the viewport
- **Micro-interactions**: Hover effects on buttons and cards
- **Abstract Visualizations**: 
  - Security barrier with particle filtering
  - Knowledge network with animated nodes
  - Chat integration mockup with sliding sidebar
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: Semantic HTML and high contrast ratios

## Customization

### Colors

Edit CSS variables in `app/globals.css`:

```css
:root {
  --color-background: #F9F9F7;
  --color-background-alt: #F2F4F6;
  --color-text: #1A1F2C;
  --color-accent: #0066CC;
}
```

### Typography

Fonts are configured in `app/layout.tsx`. To change fonts, update the Google Fonts imports and CSS variables.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Google Fonts** - Space Grotesk & IBM Plex Sans

## License

Private - All rights reserved.









