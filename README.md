# Vakantie Dashboard

Persoonlijk vakantie-dashboard voor jullie reis. Budget tracker met bonnetjes-scanner, restaurants & activiteiten browser met filters, agenda met automatische dagstructuur, en AI-reisgids voor tips onderweg.

## Snel starten (lokaal)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

⚠️ De AI-tab en bonnetjes-scanner werken alleen als je de Vercel serverless function (`/api/messages`) draait. Voor full functionaliteit:

```bash
npm install -g vercel
vercel dev
```

Maak een `.env.local` aan:

```
ANTHROPIC_API_KEY=sk-ant-xxx...
```

Krijg een key op [console.anthropic.com](https://console.anthropic.com/) (eerste $5 gratis).

## Deploy naar Vercel

1. Push naar GitHub repo
2. Ga naar [vercel.com/new](https://vercel.com/new) → importeer de repo
3. Bij **Environment Variables**: voeg `ANTHROPIC_API_KEY` toe met je key
4. **Deploy** → klaar

Vercel detecteert Vite automatisch. De `/api` folder wordt serverless functions.

## Op je iPhone

1. Open de Vercel URL in **Safari**
2. Tap deel-knop → **"Zet op beginscherm"**
3. App opent nu als fullscreen native app

## Data updaten

Alle restaurants en activiteiten staan inline in `src/App.jsx` (in de `RESTAURANTS` en `ACTIVITIES` arrays bovenin). Wil je later andere bestemmingen, vraag Claude of edit handmatig.

## Storage

Alle persoonlijke data (uitgaven, agenda, AI-chat) wordt in `localStorage` opgeslagen — blijft op je apparaat, geen account nodig, geen server. Wis je browser-data en je begint opnieuw.

## Stack

- **React 18** + **Vite 5**
- **lucide-react** voor iconen
- **Vercel serverless** voor Anthropic API proxy
- Inline styling (geen Tailwind/CSS modules) — alle styles in App.jsx
- Mobile-first (max-width 480px)
