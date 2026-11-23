import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.disable('x-powered-by')

app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
