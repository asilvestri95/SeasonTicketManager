import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const where = req.user!.role === 'ADMIN' ? {} : { ownerId: req.user!.userId }
  const plans = await prisma.ticketPlan.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { games: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(plans)
})

router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { sport, team, season, section, row, seats, totalGames, purchasePrice } = req.body
  if (!sport || !team || !season || !section || !seats || !totalGames) {
    res.status(400).json({ error: 'sport, team, season, section, seats, and totalGames are required' })
    return
  }

  const plan = await prisma.ticketPlan.create({
    data: {
      ownerId: req.user!.userId,
      sport,
      team,
      season,
      section,
      row,
      seats,
      totalGames: Number(totalGames),
      purchasePrice: purchasePrice ? Number(purchasePrice) : null,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  })
  res.status(201).json(plan)
})

router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const plan = await prisma.ticketPlan.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      games: {
        include: {
          assignments: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              transfer: {
                include: {
                  fromUser: { select: { id: true, name: true } },
                  toUser: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { gameDate: 'asc' },
      },
    },
  })

  if (!plan) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }

  if (req.user!.role !== 'ADMIN' && plan.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  res.json(plan)
})

router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const plan = await prisma.ticketPlan.findUnique({ where: { id: req.params.id } })
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }
  if (req.user!.role !== 'ADMIN' && plan.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const { sport, team, season, section, row, seats, totalGames, purchasePrice } = req.body
  const updated = await prisma.ticketPlan.update({
    where: { id: req.params.id },
    data: {
      ...(sport && { sport }),
      ...(team && { team }),
      ...(season && { season }),
      ...(section && { section }),
      ...(row !== undefined && { row }),
      ...(seats && { seats }),
      ...(totalGames && { totalGames: Number(totalGames) }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? Number(purchasePrice) : null }),
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  })
  res.json(updated)
})

router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const plan = await prisma.ticketPlan.findUnique({ where: { id: req.params.id } })
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }
  if (req.user!.role !== 'ADMIN' && plan.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  await prisma.ticketPlan.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
