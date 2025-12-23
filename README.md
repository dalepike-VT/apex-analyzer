# Apex Analyzer

F1 corner-by-corner performance analysis application powered by the [OpenF1 API](https://openf1.org).

## Features

- Load any historical F1 race weekend (2023+)
- Select specific sessions (Practice, Qualifying, Race)
- View driver participation and team affiliations
- **Coming Soon**: Interactive track maps with corner analysis
- **Coming Soon**: Telemetry comparisons (speed, throttle, brake)
- **Coming Soon**: Driver performance comparisons by corner

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Data Fetching**: TanStack Query (React Query)
- **Visualization**: D3.js (planned)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/apex-analyzer.git
cd apex-analyzer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create a `.env.local` file (optional - defaults work out of the box):

```env
NEXT_PUBLIC_OPENF1_BASE_URL=https://api.openf1.org/v1
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

This application is configured for deployment on [Railway](https://railway.app):

1. Push to GitHub
2. Connect repository to Railway
3. Railway auto-detects Next.js and deploys

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── selectors/          # Year/Track/Session selectors
│   └── analysis/           # Analysis and visualization components
├── hooks/                  # Custom React hooks
├── lib/
│   └── openf1/             # OpenF1 API client
└── data/
    └── tracks/             # Track definitions (planned)
```

## API Reference

This application uses the [OpenF1 API](https://openf1.org) for F1 data:

- `/meetings` - Grand Prix weekends
- `/sessions` - Individual sessions
- `/drivers` - Driver information
- `/laps` - Lap and sector times
- `/car_data` - Telemetry data
- `/location` - Track position data

## License

MIT
