# Tink Property Management Frontend

A Next.js-based frontend for Tink, a property management platform designed specifically for co-living spaces.

## 🏠 About Tink

Tink simplifies leasing, communication, and operations for co-living homes—whether it's an individual room or a whole shared house. This frontend provides role-based dashboards for landlords and managers with focus on:

- Room-level tenant management
- Application intake and approval workflow
- WhatsApp-based communication
- Revenue optimization and occupancy tracking
- Maintenance and inventory management

## 🚀 Features

- **Role-Based Dashboards**: Different views for landlords and managers
- **Application Management**: Quick approve workflow with room assignment
- **Property Management**: Revenue tracking and occupancy optimization
- **Communication Hub**: WhatsApp reminder system
- **Mobile-Friendly**: Responsive design for property management on the go

## 🛠️ Tech Stack

- **Next.js 15.3.3** with TypeScript
- **React 19** with functional components
- **Pages Router** for file-based routing
- **Tailwind CSS** (configured but not used in MVP)
- **Mock Data** for development and prototyping

## 🏃‍♂️ Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 🌐 Deploy to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your `tink-frontend` repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

### Option 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: tink-frontend
# - Directory: ./
# - Override settings? N
```

### Environment Variables (if needed later)

When you add backend integration, set these in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-django-backend.com/api
NEXT_PUBLIC_APP_ENV=production
```

## 📱 User Flow

### Login
- Choose between Landlord or Manager role
- Role determines dashboard content

### Landlord Dashboard
- Portfolio performance metrics
- Revenue optimization focus
- Property-level insights

### Manager Dashboard
- Daily operations focus
- Urgent tasks highlighting
- Quick action workflows

### Key Pages
- **Properties**: Revenue and occupancy tracking
- **Applications**: Quick approval with room assignment
- **Rooms**: Vacancy management and tenant assignment
- **Reminders**: WhatsApp communication hub
- **Leases**: Expiry tracking and renewal workflow

## 🎯 Design Philosophy

This frontend is built with property management workflows in mind:

- **Action-oriented**: Every page answers "what do I need to do now?"
- **Revenue-focused**: Lost revenue calculations visible throughout
- **Workflow-optimized**: Reduce clicks for common tasks
- **Problem identification**: Visual highlighting of issues
- **Mobile-first**: Manage properties from anywhere

## 🔧 Project Structure

```
tink-frontend/
├── components/          # Reusable components
│   └── Navigation.tsx   # Main navigation
├── lib/                 # Utilities and mock data
│   └── mockData.ts      # Development data
├── pages/               # Next.js pages (file-based routing)
│   ├── dashboard.tsx    # Role-based dashboard
│   ├── properties.tsx   # Property management
│   ├── applications.tsx # Application review
│   └── ...              # Other feature pages
├── public/              # Static assets
└── vercel.json          # Vercel deployment config
```

## 🚀 Production URL

After deployment, your Tink frontend will be available at:
`https://tink-frontend.vercel.app` (or your custom domain)

## 🔗 API Integration

Currently uses mock data. To integrate with Django backend:

1. Replace mock data imports with API calls
2. Add authentication token handling
3. Implement error handling and loading states
4. Set environment variables for API endpoints

## 📧 Support

For deployment issues or questions about Tink, contact the development team.

---

**Tink - Property Management, Rebuilt for Co-living** 🏠
