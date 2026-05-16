import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateJWT } from '../middleware/auth'

const router = Router({ mergeParams: true })

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { planId } = req.params
  const plan = await prisma.ticketPlan.findUnique({ where: { id: planId } })
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }
  if (req.user!.role !== 'ADMIN' && plan.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const games = await prisma.game.findMany({
    where: { planId },
    include: {
      assignments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          transfer: true,
        },
      },
    },
    orderBy: { gameDate: 'asc' },
  })
  res.json(games)
})

router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { planId } = req.params
  const plan = await prisma.ticketPlan.findUnique({ where: { id: planId } })
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }
  if (req.user!.role !== 'ADMIN' && plan.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const { gameDate, opponent, homeAway, gameNumber, notes } = req.body
  if (!gameDate || !opponent || gameNumber === undefined) {
    res.status(400).json({ error: 'gameDate, opponent, and gameNumber are required' })
    return
  }

  const game = await prisma.game.create({
    data: {
      planId,
      gameDate: new Date(gameDate),
      opponent,
      homeAway: homeAway ?? 'HOME',
      gameNumber: Number(gameNumber),
      notes,
    },
  })
  res.status(201).json(game)
})

export default router
