import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Import routes
import doctorRoutes from './routes/doctor.routes'
import patientRoutes from './routes/patient.routes'
import searchRoutes from './routes/search.routes'

// Load environment variables
dotenv.config()

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tiare'
console.log('🔌 Connecting to MongoDB...')
console.log('📊 MongoDB URI:', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully')
    console.log('🗄️  Database:', mongoose.connection.db?.databaseName || 'Unknown')
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  })

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Tiare Healthcare Practice Management API',
    timestamp: new Date().toISOString()
  })
})

// API routes
app.use('/api/doctors', doctorRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/search', searchRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
  console.log(`🏥 Tiare Healthcare API running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`👨‍⚕️ Doctor routes: http://localhost:${PORT}/api/doctors`)
  console.log(`👶 Patient routes: http://localhost:${PORT}/api/patients`)
  console.log(`🔍 Search routes: http://localhost:${PORT}/api/search`)
  console.log(`📞 Doctor info endpoint: http://localhost:${PORT}/api/doctors/info/:id`)
})
