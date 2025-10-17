# 🚀 Adda Education Analytics Dashboard

A modern, responsive YouTube Analytics Dashboard built with React, TypeScript, and Tailwind CSS. This dashboard provides real-time insights into YouTube channel performance across multiple verticals.

## ✨ Features

- **📊 Real-time Analytics**: Live data from Google Sheets
- **🎯 Combined Overview**: Aggregated insights across all verticals
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🎨 Modern UI**: Smooth animations and professional styling
- **🔄 Auto-refresh**: Updates every 5 minutes automatically
- **🏢 Multi-vertical Support**: Test Prep, K12, SIQ, Adda Paid, Fanpage
- **📈 Interactive Charts**: Beautiful data visualizations
- **🔒 No Authentication**: Direct access for easy deployment

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Charts**: Chart.js, React-ChartJS-2
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data**: PapaParse for CSV processing
- **Build Tool**: Vite
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SatyarthAdda247/YTDashboard.git
   cd YTDashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
YTDashboard/
├── src/
│   ├── App.tsx          # Main dashboard component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── public/
│   └── assets/
│       └── logos/       # Channel logo assets
├── backend/             # Backend API (optional)
├── vercel.json         # Vercel deployment config
└── package.json        # Dependencies
```

## 🎨 Customization

### Adding New Verticals

1. **Add logo**: Place SVG/PNG in `public/assets/logos/`
2. **Update verticals array** in `src/App.tsx`:
   ```typescript
   const verticals = [
     // ... existing verticals
     {
       name: 'New Vertical',
       logo: '/assets/logos/new-vertical.png',
       color: 'bg-purple-500',
       index: 6
     }
   ]
   ```

### Styling

- **Colors**: Modify `tailwind.config.js`
- **Components**: Update `src/index.css` for custom styles
- **Layout**: Adjust responsive breakpoints in components

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub**: Import repository in Vercel
2. **Deploy**: Automatic deployment on push
3. **Environment**: No environment variables needed

### Other Platforms

- **Netlify**: Works with static build
- **GitHub Pages**: Deploy from `dist/` folder
- **Custom Server**: Serve built files from `dist/`

## 📊 Data Source

The dashboard fetches data from Google Sheets CSV exports. Update the `sheetsData` array in `src/App.tsx` with your Google Sheets URLs:

```typescript
const sheetsData = [
  { name: 'Combined Overview', url: 'your-sheets-url-1' },
  { name: 'Test Prep', url: 'your-sheets-url-2' },
  // ... more sheets
]
```

## 🔧 Configuration

### Port Settings
- **Frontend**: Port 8000 (configurable in `vite.config.ts`)
- **Backend**: Port 3000 (if using backend)

### Auto-refresh
- **Interval**: 5 minutes (configurable in `src/App.tsx`)
- **Manual**: Refresh button in header

## 📱 Responsive Design

- **Desktop**: Full dashboard with all features
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Compact view with essential metrics

## 🎯 Performance

- **Lazy Loading**: Components load as needed
- **Optimized Assets**: Compressed images and SVGs
- **Efficient Rendering**: React optimizations
- **Fast Build**: Vite for rapid development

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/SatyarthAdda247/YTDashboard/issues)
- **Documentation**: Check this README
- **Examples**: See the demo at [AddaYTDashboard.vercel.app](https://AddaYTDashboard.vercel.app)

---

**Built with ❤️ for Adda247 Education**
