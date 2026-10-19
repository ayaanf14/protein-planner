
# Protein Planner

A responsive nutrition-tracking and meal-planning web application built with React and TypeScript.

**Live Demo:** https://protein-planner-alpha.vercel.app

## Features

- Track daily calories, protein, carbohydrates, and fats
- Set personalized daily nutrition goals
- Browse and filter high-protein recipes
- Create, edit, and delete custom meals
- Adjust serving sizes and automatically recalculate nutrition
- Add, edit, and remove food log entries
- Plan meals for different days of the week
- Visualize weekly calorie and protein intake
- View personalized meal suggestions
- Save meals, goals, and food logs using browser localStorage
- Responsive interface for desktop and mobile devices

## Technologies

- React
- TypeScript
- Vite
- CSS
- Recharts
- Browser localStorage
- Git and GitHub
- Vercel

## Getting Started

### Prerequisites

Install Node.js and npm.

### Installation

Clone the repository:

```bash
git clone https://github.com/ayaanf14/protein-planner.git
```

Navigate into the project:

```bash
cd protein-planner
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

## Production Build

```bash
npm run build
```

## How It Works

Protein Planner uses React state to manage nutrition goals, recipes, food logs, and planned meals.

TypeScript defines the application's data structures, while JavaScript array operations calculate nutrition totals, filter recipes, and generate meal suggestions.

Recharts visualizes historical nutrition data. Browser localStorage saves user information across page refreshes without requiring an account or backend.

## Limitations

- Nutrition values are estimates and may vary by ingredient and portion size.
- Data is stored locally in each browser and does not synchronize across devices.
- No user authentication or cloud database is currently implemented.

## Future Improvements

- Cloud synchronization and user accounts
- Expanded recipe database
- Grocery list generation
- Improved meal recommendation algorithms
- More advanced nutrition analytics

## Deployment

The application is deployed using Vercel.

https://protein-planner-alpha.vercel.app
