# RooMio Frontend

Modern hostel management portal built with **React 19** and **Vite**.

## Tech Stack

- **React 19** - Latest React with modern features
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_TURNSTILE_SITE_KEY=your_key_here
   VITE_DISABLE_TURNSTILE=false
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

4. **Build for production:**
   ```bash
   npm run build
   ```

   Output will be in the `dist` directory.

5. **Preview production build:**
   ```bash
   npm run preview
   ```

## Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── config/          # Configuration files
│   ├── lib/             # Utility functions
│   ├── App.tsx          # Main app component with routes
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── vite.config.ts        # Vite configuration
└── package.json         # Dependencies
```

## Features

- 🚀 Fast development with Vite HMR
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS
- 🔐 Authentication with JWT
- 🧭 Client-side routing
- 📊 Analytics and reporting
- 💳 Subscription management
- 🏠 Hostel management
- 👥 Student and custodian management

## Environment Variables

See [API_CONFIGURATION.md](./API_CONFIGURATION.md) for detailed environment setup.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Important: Backend URL Configuration

**Before building for production**, you must set the `VITE_API_URL` environment variable to point to your backend server.

1. **Create a `.env` file** in the frontend directory:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   # OR if backend is on same domain: https://yourdomain.com/api
   # OR if using IP: http://your-server-ip:5000
   ```

2. **Build the frontend:**
   ```bash
   npm run build
   ```

3. **Deploy the `dist` folder** to your hosting service

**Note:** The `VITE_API_URL` is embedded at build time. If you change your backend URL later, you'll need to rebuild the frontend.

### Deployment Options

The built application in the `dist` folder can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist` folder
- **AWS S3 + CloudFront**: Upload to S3 bucket
- **GitHub Pages**: Use GitHub Actions
- **Same Ubuntu Server**: Use Nginx to serve the `dist` folder

### Complete Deployment Guide

See the root `DEPLOYMENT_GUIDE.md` file for complete instructions on:
- How frontend and backend communicate
- Setting up CORS on the backend
- Deployment scenarios (same server, different servers, CDN)
- Troubleshooting common issues
