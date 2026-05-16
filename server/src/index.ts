import express from 'express'
import cors from 'cors'
import path from 'path'
import dashboardRouter from './routes/dashboard'
import authRouter from './routes/auth'
import usersRouter from './routes/users'
import plansRouter from './routes/plans'
import gamesRouter from './routes/games'
import gameActionsRouter from './routes/gameActions'
import assignmentsRouter from './routes/assignments'
import assignmentActionsRouter from './routes/assignmentActions'
import transfersRouter from './routes/transfers'

const app = express()
const PORT = process.env.PORT ?? 3001
const isProd = process.env.NODE_ENV === 'production'

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
}

app.use(express.json())

app.use('/api/dashboard', dashboardRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/plans', plansRouter)
app.use('/api/plans/:planId/games', gamesRouter)
app.use('/api/games', gameActionsRouter)
app.use('/api/games/:gameId/assignments', assignmentsRouter)
app.use('/api/assignments', assignmentActionsRouter)
app.use('/api/transfers', transfersRouter)

if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
