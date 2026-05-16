import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { authenticateJWT, signToken } from '../middleware/auth'

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const { email, name, password } = req.body
  if (!email || !name || !password) {
    res.status(400).json({ error: 'email, name, and password are required' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const userCount = await prisma.user.count()
  const role = userCount === 0 ? 'ADMIN' : 'MEMBER'

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: role as 'ADMIN' | 'MEMBER' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  const token = signToken({ userId: user.id, role: user.role })
  res.status(201).json({ user, token })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = signToken({ userId: user.id, role: user.role })
  const { passwordHash: _, ...safeUser } = user
  res.json({ user: safeUser, token })
})

router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json(user)
})

export default router
