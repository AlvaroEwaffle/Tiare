import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sessionRoutes from './routes/session.routes'
import promoCodeRoutes from './routes/promoCode.routes'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/sessions', sessionRoutes)
app.use('/api/promo-codes', promoCodeRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
