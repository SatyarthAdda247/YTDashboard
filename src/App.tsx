import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Calendar,
  ArrowUpRight,
  PlayCircle
} from 'lucide-react'
import Papa from 'papaparse'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

interface PlaylistData {
  channelName: string
  viewCount: number
  playlistLink: string
}

interface SheetData {
  name: string
  gid: string
  index: number
  data: PlaylistData[]
}

const SHEET_ID = '1abdf5Fc6lxGV7fAHENdo2GIf3rPwUlZ93bTs4buWSis'

const SHEETS = [
  { gid: '439811275', name: 'Combined Playlist', index: 1 },
  { gid: '0', name: 'Test Prep Playlist', index: 2 },
  { gid: '330049017', name: 'K-12 Playlist', index: 3 },
  { gid: '523001156', name: 'SIQ Playlist', index: 4 },
  { gid: '1431804044', name: 'Adda Paid Playlist', index: 5 },
  { gid: '454705131', name: 'Fanpage Playlist', index: 6 }
]

const verticals = [
  { 
    name: 'Combined Overview', 
    logo: '/assets/logos/combined-overview.png', 
    color: 'bg-indigo-500', 
    index: 0 
  },
  { 
    name: 'Test Prep', 
    logo: '/assets/logos/test-prep.png', 
    color: 'bg-blue-500', 
    index: 1 
  },
  { 
    name: 'K-12', 
    logo: '/assets/logos/k12.png', 
    color: 'bg-green-500', 
    index: 2 
  },
  { 
    name: 'SIQ', 
    logo: '/assets/logos/siq.png', 
    color: 'bg-purple-500', 
    index: 3 
  },
  { 
    name: 'Adda Paid', 
    logo: '/assets/logos/adda-paid.png', 
    color: 'bg-yellow-500', 
    index: 4 
  },
  { 
    name: 'Fanpage', 
    logo: '/assets/logos/fanpage.png', 
    color: 'bg-pink-500', 
    index: 5 
  }
]

function App() {
  const [sheetsData, setSheetsData] = useState<SheetData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVertical, setSelectedVertical] = useState(0) // 0 = Combined Overview
  const [timeRange, setTimeRange] = useState('Last 30 Days')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Authentication states - DISABLED FOR NOW
  // const [isAuthenticated, setIsAuthenticated] = useState(true) // Always authenticated
  // const [user, setUser] = useState<any>({ 
  //   name: 'Demo User', 
  //   email: 'demo@adda247.com',
  //   picture: null 
  // })
  // const [showLogin, setShowLogin] = useState(false) // Never show login
  // const [isLoggingIn, setIsLoggingIn] = useState(false)
  // const [authError, setAuthError] = useState('')

  // API Base URL - automatically detects environment
  // const API_BASE_URL = window.location.hostname === 'localhost' 
  //   ? 'http://localhost:3000' 
  //   : 'https://AddaYTDashboard.vercel.app'

  // Authentication functions - DISABLED FOR NOW
  /*
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setShowLogin(true)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setUser(data.user)
        setShowLogin(false)
      } else {
        localStorage.removeItem('authToken')
        setShowLogin(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('authToken')
      setShowLogin(true)
    }
  }
  */

  /*
  const initiateGoogleLogin = async () => {
    setIsLoggingIn(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`)
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        setAuthError('Failed to initiate login')
      }
    } catch (error) {
      setAuthError('Login service unavailable')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      setIsAuthenticated(false)
      setUser(null)
      setShowLogin(true)
    }
  }

  const handleAuthSuccess = (token: string) => {
    localStorage.setItem('authToken', token)
    setIsAuthenticated(true)
    setShowLogin(false)
    // Decode token to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser(payload)
    } catch (error) {
      console.error('Failed to decode token:', error)
    }
  }
  */

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const getSheetURL = (gid: string): string => {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`
  }

  const fetchSheetData = async (sheet: typeof SHEETS[0]): Promise<PlaylistData[]> => {
    const sheetURL = getSheetURL(sheet.gid)
    
    const response = await fetch(sheetURL)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sheet.name}: ${response.status}`)
    }

    const csvText = await response.text()
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validData = results.data
            .filter((item: any) => {
              const channelName = item['Channel Name'] || item.channelName || item['channel_name']
              const viewCount = item['View Counts'] || item['View Count'] || item.viewCount || item['view_count']
              const playlistLink = item['Playlist Link'] || item.playlistLink || item['playlist_link']
              
              return channelName && 
                     channelName.trim() !== '' && 
                     viewCount && 
                     String(viewCount).trim() !== '' && 
                     !isNaN(parseInt(String(viewCount).replace(/,/g, ''))) &&
                     playlistLink &&
                     playlistLink.trim() !== '' &&
                     playlistLink.toLowerCase() !== 'total'
            })
            .map((item: any) => ({
              channelName: item['Channel Name'] || item.channelName || item['channel_name'],
              viewCount: parseInt(String(item['View Counts'] || item['View Count'] || item.viewCount || item['view_count'] || 0).replace(/,/g, '')),
              playlistLink: item['Playlist Link'] || item.playlistLink || item['playlist_link']
            }))
            .sort((a, b) => b.viewCount - a.viewCount)

          resolve(validData)
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing error for ${sheet.name}: ${error.message}`))
        }
      })
    })
  }

  const fetchAllData = async () => {
    setLoading(true)
    setIsRefreshing(true)
    setError(null)

    try {
      const allDataPromises = SHEETS.map(sheet => fetchSheetData(sheet))
      const allData = await Promise.all(allDataPromises)

      const processedData = SHEETS.map((sheet, idx) => ({
        name: sheet.name,
        gid: sheet.gid,
        index: sheet.index,
        data: allData[idx]
      }))

      setSheetsData(processedData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Always fetch data - no authentication required
    fetchAllData()
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAllData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // For combined overview (selectedVertical = 0), combine all data
  const currentData = selectedVertical === 0 
    ? sheetsData.slice(1).flatMap(sheet => sheet.data).sort((a, b) => b.viewCount - a.viewCount)
    : sheetsData[selectedVertical]?.data || []
  
  const totalViews = currentData.reduce((sum, item) => sum + item.viewCount, 0)
  const avgViews = currentData.length > 0 ? Math.round(totalViews / currentData.length) : 0
  const topPlaylist = currentData[0]?.channelName || '-'

  const chartData = {
    labels: currentData.slice(0, 10).map(item => item.channelName),
    datasets: [
      {
        label: 'View Count',
        data: currentData.slice(0, 10).map(item => item.viewCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return 'Views: ' + formatNumber(context.parsed.y)
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatNumber(value)
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        }
      }
    }
  }

  // Calculate totals for each vertical (including combined)
  const verticalTotals = [
    // Combined total (index 0)
    sheetsData.slice(1).reduce((sum, sheet) => 
      sum + sheet.data.reduce((sheetSum, item) => sheetSum + item.viewCount, 0), 0
    ),
    // Individual verticals (indices 1-5)
    ...sheetsData.slice(1).map(sheet => 
      sheet.data.reduce((sum, item) => sum + item.viewCount, 0)
    )
  ]

  /*
  const verticalChartData = {
    labels: verticals.map(v => v.name),
    datasets: [
      {
        data: verticalTotals,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(236, 72, 153, 1)'
        ],
        borderWidth: 2
      }
    ]
  }
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading analytics data...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchAllData}
            className="btn-primary"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Adda Education Analytics</h1>
                <p className="text-xs text-gray-500">Comprehensive playlist insights</p>
              </div>
            </div>
            
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-transparent text-sm text-gray-600 border-none outline-none"
                  >
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Last 90 Days</option>
                  </select>
                </div>
                
                <button 
                  onClick={fetchAllData}
                  disabled={isRefreshing}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

              </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Vertical Overview */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Verticals Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>Total views across all categories</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {verticals.map((vertical, index) => (
              <motion.div
                key={vertical.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`card card-hover p-4 cursor-pointer ${
                  selectedVertical === vertical.index ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => setSelectedVertical(vertical.index)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm">
                    <img 
                      src={vertical.logo} 
                      alt={vertical.name}
                      className="w-10 h-10 object-cover"
                      onError={(e) => {
                        // Fallback to colored background with first letter if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.className = `w-10 h-10 ${vertical.color} rounded-xl flex items-center justify-center text-white text-lg font-bold`;
                          parent.textContent = vertical.name.charAt(0);
                        }
                      }}
                    />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{vertical.name}</h3>
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(verticalTotals[index] || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">total views</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Main Analytics */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedVertical}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedVertical(Math.max(0, selectedVertical - 1))}
                  disabled={selectedVertical === 0}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {verticals[selectedVertical]?.name || 'Select a Vertical'}
                  </h2>
                  <p className="text-gray-500">
                    {selectedVertical === 0 ? 'All playlists combined analytics' : 'Performance metrics and insights'}
                  </p>
                </div>
                
                <button
                  onClick={() => setSelectedVertical(Math.min(verticals.length - 1, selectedVertical + 1))}
                  disabled={selectedVertical === verticals.length - 1}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {lastUpdated && (
                <div className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Combined Overview Card */}
            {selectedVertical === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6 mb-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">All Playlists Combined</h3>
                  <p className="text-sm text-gray-600">Comprehensive analytics across all content verticals</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      {sheetsData.slice(1).reduce((sum, sheet) => sum + sheet.data.length, 0)}
                    </div>
                    <p className="text-sm text-gray-600">Total Playlists</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatNumber(sheetsData.slice(1).reduce((sum, sheet) => 
                        sum + sheet.data.reduce((sheetSum, item) => sheetSum + item.viewCount, 0), 0
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">Total Views</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {formatNumber(Math.round(sheetsData.slice(1).reduce((sum, sheet) => 
                        sum + sheet.data.reduce((sheetSum, item) => sheetSum + item.viewCount, 0), 0
                      ) / sheetsData.slice(1).reduce((sum, sheet) => sum + sheet.data.length, 0)))}
                    </div>
                    <p className="text-sm text-gray-600">Average Views</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600 mb-2">
                      {currentData[0]?.channelName || '-'}
                    </div>
                    <p className="text-sm text-gray-600">Top Performer</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats Grid - Only show for individual verticals */}
            {selectedVertical > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-500">Total</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {currentData.length}
                  </h3>
                  <p className="text-sm text-gray-500">Playlists</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-500">Total</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {formatNumber(totalViews)}
                  </h3>
                  <p className="text-sm text-gray-500">Views</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-500">Average</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {formatNumber(avgViews)}
                  </h3>
                  <p className="text-sm text-gray-500">Views per playlist</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="card p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <PlayCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <span className="text-sm text-gray-500">Top</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {topPlaylist}
                  </h3>
                  <p className="text-sm text-gray-500">Performing playlist</p>
                </motion.div>
              </div>
            )}

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">View Count Distribution</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <span>Top 10 channels</span>
                </div>
              </div>
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </motion.div>

            {/* Data Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Playlist Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channel Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        View Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Playlist Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((item, index) => (
                      <motion.tr
                        key={item.channelName}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.channelName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatNumber(item.viewCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={item.playlistLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                          >
                            <span>View Playlist</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
