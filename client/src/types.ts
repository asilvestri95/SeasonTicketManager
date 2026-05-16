export type Role = 'ADMIN' | 'MEMBER'
export type HomeAway = 'HOME' | 'AWAY'
export type AssignmentStatus = 'ASSIGNED' | 'TRANSFERRED' | 'AVAILABLE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'WAIVED'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
}

export interface TicketPlan {
  id: string
  ownerId: string
  owner: Pick<User, 'id' | 'name' | 'email'>
  sport: string
  team: string
  season: string
  section: string
  row?: string
  seats: string
  totalGames: number
  purchasePrice?: number
  createdAt: string
  _count?: { games: number }
  games?: Game[]
}

export interface Game {
  id: string
  planId: string
  gameDate: string
  opponent: string
  homeAway: HomeAway
  gameNumber: number
  notes?: string
  assignments?: GameAssignment[]
}

export interface GameAssignment {
  id: string
  gameId: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'email'>
  status: AssignmentStatus
  seatLabel?: string
  createdAt: string
  transfer?: Transfer
}

export interface Transfer {
  id: string
  assignmentId: string
  fromUserId: string
  fromUser: Pick<User, 'id' | 'name' | 'email'>
  toUserId: string
  toUser: Pick<User, 'id' | 'name' | 'email'>
  price: number
  paymentStatus: PaymentStatus
  paymentMethod?: string
  note?: string
  createdAt: string
  assignment?: GameAssignment & {
    game: Game & {
      plan: Pick<TicketPlan, 'id' | 'sport' | 'team' | 'season'>
    }
  }
}
