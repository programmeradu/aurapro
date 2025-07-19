# 📱 AURA Commuter - Mobile Web App

A Progressive Web App (PWA) designed specifically for Ghana's commuters to track real-time transport, plan journeys, and engage with the transport community.

## 🚀 Features

### 🏠 **Home Dashboard**
- Real-time location detection
- Weather information
- Quick action buttons
- Nearby transport updates
- Live transport news
- Emergency contacts

### 🗺️ **Real-time Tracking**
- Live vehicle locations (tro-tros, buses, taxis)
- Route visualization with Mapbox
- Arrival time predictions
- Vehicle capacity indicators
- Driver information

### 🧭 **Journey Planning**
- Multi-modal route suggestions
- Fare calculations
- Time estimates
- Alternative routes
- Accessibility options

### 👥 **Community Features**
- Report transport issues
- Share real-time updates
- Rate services
- Community feedback
- Social sharing

### 📱 **PWA Capabilities**
- Offline functionality
- Home screen installation
- Push notifications
- Background sync
- App-like experience

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS with Ghana-inspired design
- **Maps:** Mapbox GL JS
- **Animations:** Framer Motion
- **State Management:** React Query (TanStack Query)
- **PWA:** next-pwa with Workbox
- **Icons:** Heroicons & Lucide React

## 🎨 Design System

### **Colors**
- **Primary:** Ghana Green (#006B3F)
- **Secondary:** Ghana Gold (#FCD116)
- **Accent:** Ghana Red (#CE1126)
- **Transport Types:**
  - Bus: Blue (#3B82F6)
  - Tro-tro: Amber (#F59E0B)
  - Taxi: Red (#EF4444)
  - Walking: Green (#10B981)

### **Typography**
- **Primary:** Inter (system font)
- **Display:** Poppins (headings)
- **Mono:** JetBrains Mono (code)

### **Mobile-First Design**
- Touch-friendly 44px tap targets
- Safe area support for notched devices
- Responsive breakpoints
- Optimized for one-handed use

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Mapbox API token

### **Installation**
```bash
# Clone the repository
git clone <repo-url>
cd mobile-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Mapbox token and API URLs

# Start development server
npm run dev
```

### **Environment Variables**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_APP_NAME=AURA Commuter
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📱 PWA Setup

### **Installation**
The app can be installed on mobile devices:

1. **Android (Chrome):**
   - Tap the "Add to Home Screen" prompt
   - Or use Chrome menu → "Install App"

2. **iOS (Safari):**
   - Tap Share button
   - Select "Add to Home Screen"

3. **Desktop:**
   - Click install icon in address bar
   - Or use browser menu

### **Offline Support**
- Route data caching
- Map tiles caching
- Essential app functionality
- Background sync when online

## 🗂️ Project Structure

```
mobile-app/
├── app/                    # Next.js 13+ app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── providers.tsx      # App providers
├── components/            # Reusable components
│   ├── navigation/        # Navigation components
│   ├── home/             # Home page components
│   ├── pwa/              # PWA-specific components
│   └── ui/               # UI components
├── public/               # Static assets
│   ├── icons/           # App icons
│   ├── splash/          # Splash screens
│   └── manifest.json    # PWA manifest
├── styles/              # Additional styles
└── utils/               # Utility functions
```

## 🌍 Ghana-Specific Features

### **Localization**
- English (Ghana) locale
- Ghana Cedi (GHS) currency
- Local time zones
- Ghana phone number formats

### **Transport Types**
- **Tro-tro:** Shared minibus transport
- **Metro Mass:** Government buses
- **STC:** State Transport Corporation
- **Private buses:** Various operators
- **Taxis:** Shared and private

### **Route Coverage**
- Greater Accra Region
- Ashanti Region (Kumasi)
- Major intercity routes
- Local community routes

## 📊 Performance

### **Lighthouse Scores**
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- PWA: 100

### **Optimizations**
- Image optimization with Next.js
- Code splitting and lazy loading
- Service worker caching
- Compressed assets
- Critical CSS inlining

## 🔧 Development

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run analyze      # Analyze bundle size
```

### **Code Quality**
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Static Export**
```bash
# Build static version
npm run build
npm run export

# Deploy to any static hosting
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Ghana Ministry of Transport
- Transport operators across Ghana
- Open source community
- Mapbox for mapping services

---

**Made with ❤️ for Ghana's commuters** 🇬🇭
