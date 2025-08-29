# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file React application for Media Flight Planning - a tool for creating and managing budget flight plans across multiple media tactics. The application is entirely contained within `index.html`.

## Architecture

- **Single-file application**: All code (HTML, CSS via Tailwind, and JavaScript/React) is contained in `index.html`
- **React via CDN**: Uses React 18 production build from unpkg CDN
- **Babel for JSX**: Uses Babel Standalone for in-browser JSX compilation
- **Tailwind CSS**: Styling handled via Tailwind CDN
- **No build process**: Direct browser execution, no compilation step required

## Key Components

### Data Layer
- **tacticData**: Array of media tactics with categories (Email Marketing, Programmatic, Social, Google, Local Display)
- Each tactic has: category, product, subProduct, rate, and KPI type (CPM/CPV)

### State Management  
- **campaigns**: Array storing all created flight plans
- **formData**: Current form input state with auto-calculation between budget/impressions/views based on rates
- **activeTab**: Controls which campaign is currently displayed

### Template Types
Three distinct flight plan templates based on selected tactic:
1. **programmatic**: Standard display with impressions, traffic budget (budget * 1.01), traffic impressions
2. **youtube**: Video-focused with views, daily metrics, platform budget calculations  
3. **sem-social**: Simplified template for SEM and Social tactics

### Core Features
- **Auto-calculation**: Budget, impressions, and views automatically calculate based on CPM/CPV rates
- **Monthly flight splitting**: Date ranges automatically split into monthly flights
- **Real-time editing**: Edit flight budgets with automatic recalculation
- **Budget redistribution**: Zero out flights and redistribute budget to remaining flights
- **CSV export**: Export flight plans with template-specific columns
- **Validation**: Form validation with option to proceed anyway

## Running the Application

Simply open `index.html` in any modern web browser. No server or build process required.

## Making Changes

Since this is a single-file application:
- All React components are defined using `React.createElement()` syntax
- State management uses React hooks (`useState`, `useMemo`)
- Styling classes are Tailwind utility classes
- No separate CSS or JS files to manage