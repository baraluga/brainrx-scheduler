# BrainRX Scheduler

A modern React + TypeScript application for managing brain training programs, students, trainers, and scheduling sessions.

## Features

- **Dashboard**: Overview of programs, students, trainers, and today's sessions
- **Program Management**: Create and manage brain training programs
- **Student Management**: Track student profiles, progress, and enrollment
- **Trainer Management**: Manage trainer profiles, schedules, and specializations
- **Calendar & Scheduling**: View and manage training session schedules

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Date Utilities**: date-fns
- **Development**: ESLint, PostCSS, Autoprefixer

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd brainrx-scheduler
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code linting
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Layout.tsx      # Main layout with navigation
│   └── Navigation.tsx  # Navigation component
├── pages/              # Page-level components
│   ├── Dashboard.tsx   # Dashboard overview
│   ├── Programs.tsx    # Program management
│   ├── Students.tsx    # Student management
│   ├── Trainers.tsx    # Trainer management
│   └── Calendar.tsx    # Calendar and scheduling
├── types/              # TypeScript type definitions
│   └── index.ts        # Application types and interfaces
├── utils/              # Utility functions and helpers
│   └── index.ts        # Common utility functions
├── App.tsx             # Main application component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## Development Guidelines

### Code Style

- Follow the existing TypeScript and React patterns
- Use Tailwind CSS for styling
- Implement proper TypeScript types for all data structures
- Follow the component structure established in the project

### Path Aliases

The project uses path aliases for cleaner imports:

- `@/` - src directory
- `@components/` - src/components
- `@pages/` - src/pages
- `@types/` - src/types
- `@utils/` - src/utils

### Adding New Features

1. Create appropriate TypeScript types in `src/types/`
2. Implement components in `src/components/` or pages in `src/pages/`
3. Add utility functions to `src/utils/` if needed
4. Update routing in `src/App.tsx` for new pages
5. Follow the established styling patterns using Tailwind CSS

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the project guidelines
3. Run `npm run lint` and `npm run typecheck` to ensure code quality
4. Test your changes thoroughly
5. Submit a pull request with a clear description of changes

## License

This project is private and proprietary.