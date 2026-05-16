import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN'
  const planWhere = isAdmin ? {} : { ownerId: req.user!.userId }

  const [plans, upcomingGames, transfers] = await Promise.all([
    prisma.ticketPlan.findMany({
      where: planWhere,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { games: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.game.findMany({
      where: {
        plan: planWhere,
        gameDate: { gte: new Date() },
      },
      include: {
        plan: { select: { id: true, sport: true, team: true } },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { gameDate: 'asc' },
      take: 10,
    }),
    prisma.transfer.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { fromUserId: req.user!.userId },
              { toUserId: req.user!.userId },
            ],
          },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        assignment: {
          include: {
            game: {
              include: {
                plan: { select: { id: true, sport: true, team: true, season: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  res.json({ plans, upcomingGames, transfers })
})

export default router
