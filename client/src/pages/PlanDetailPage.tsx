import { useEffect, useState, FormEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { TicketPlan, Game, User } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import PageHeader from '@/components/PageHeader'
import { formatDate, formatCurrency, SPORT_COLORS } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import { ArrowLeft, Plus, Trash2, UserPlus, X } from 'lucide-react'

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<TicketPlan | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [addGameOpen, setAddGameOpen] = useState(false)
  const [assignGameId, setAssignGameId] = useState<string | null>(null)
  const [assignUserId, setAssignUserId] = useState('')
  const [assignSeat, setAssignSeat] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  const [newGame, setNewGame] = useState({ gameDate: '', opponent: '', homeAway: 'HOME', gameNumber: '' })
  const [addGameLoading, setAddGameLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<TicketPlan>(`/plans/${id}`),
      api.get<User[]>('/users'),
    ])
      .then(([p, u]) => { setPlan(p); setUsers(u) })
      .catch(() => navigate('/plans'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleAddGame(e: FormEvent) {
    e.preventDefault()
    if (!plan) return
    setAddGameLoading(true)
    try {
      const game = await api.post<Game>(`/plans/${plan.id}/games`, {
        gameDate: newGame.gameDate,
        opponent: newGame.opponent,
        homeAway: newGame.homeAway,
        gameNumber: Number(newGame.gameNumber),
      })
      setPlan((p) => p ? { ...p, games: [...(p.games ?? []), { ...game, assignments: [] }].sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()) } : p)
      setNewGame({ gameDate: '', opponent: '', homeAway: 'HOME', gameNumber: '' })
      setAddGameOpen(false)
      toast({ title: 'Game added', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setAddGameLoading(false)
    }
  }

  async function handleDeleteGame(gameId: string) {
    await api.delete(`/games/${gameId}`)
    setPlan((p) => p ? { ...p, games: (p.games ?? []).filter((g) => g.id !== gameId) } : p)
    toast({ title: 'Game removed' })
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault()
    if (!assignGameId || !assignUserId) return
    setAssignLoading(true)
    try {
      const assignment = await api.post(`/games/${assignGameId}/assignments`, {
        userId: assignUserId,
        seatLabel: assignSeat || undefined,
      })
      setPlan((p) => {
        if (!p) return p
        return {
          ...p,
          games: (p.games ?? []).map((g) =>
            g.id === assignGameId
              ? { ...g, assignments: [...(g.assignments ?? []), assignment] }
              : g
          ),
        }
      })
      setAssignGameId(null)
      setAssignUserId('')
      setAssignSeat('')
      toast({ title: 'Person assigned', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setAssignLoading(false)
    }
  }

  async function handleUnassign(gameId: string, assignmentId: string) {
    await api.delete(`/assignments/${assignmentId}`)
    setPlan((p) => {
      if (!p) return p
      return {
        ...p,
        games: (p.games ?? []).map((g) =>
          g.id === gameId
            ? { ...g, assignments: (g.assignments ?? []).filter((a) => a.id !== assignmentId) }
            : g
        ),
      }
    })
  }

  const isOwnerOrAdmin = user?.role === 'ADMIN' || plan?.ownerId === user?.id

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!plan) return null

  const games = plan.games ?? []

  return (
    <div>
      <PageHeader
        title={plan.team}
        description={`${plan.sport} · ${plan.season} · Sec ${plan.section}${plan.row ? ` Row ${plan.row}` : ''} · ${plan.seats}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/plans"><ArrowLeft className="w-4 h-4" /> Back</Link>
            </Button>
            {isOwnerOrAdmin && (
              <Button size="sm" onClick={() => setAddGameOpen(true)}>
                <Plus className="w-4 h-4" /> Add Game
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Plan meta */}
        <div className="flex flex-wrap gap-3">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${SPORT_COLORS[plan.sport] ?? SPORT_COLORS.Other}`}>
            {plan.sport}
          </span>
          <span className="text-xs text-muted-foreground self-center">{games.length} of {plan.totalGames} games added</span>
          {plan.purchasePrice && (
            <span className="text-xs text-muted-foreground self-center">{formatCurrency(plan.purchasePrice)} purchase price</span>
          )}
        </div>

        {/* Games table */}
        {games.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <p className="text-sm text-muted-foreground">No games yet.</p>
              {isOwnerOrAdmin && (
                <Button size="sm" onClick={() => setAddGameOpen(true)}>
                  <Plus className="w-4 h-4" /> Add First Game
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Opponent</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Attending</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, idx) => {
                  const isPast = new Date(game.gameDate) < new Date()
                  return (
                    <tr key={game.id} className={`border-b border-border last:border-0 ${isPast ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{game.gameNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(game.gameDate)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{game.homeAway === 'HOME' ? 'vs' : '@'} {game.opponent}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(game.assignments ?? []).map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                            >
                              {a.user.name}
                              {a.seatLabel && <span className="font-mono opacity-60">({a.seatLabel})</span>}
                              {a.transfer && <Badge variant="warning" className="ml-1 text-[10px] py-0 px-1">Transferred</Badge>}
                              {isOwnerOrAdmin && !a.transfer && (
                                <button
                                  onClick={() => handleUnassign(game.id, a.id)}
                                  className="text-muted-foreground hover:text-destructive ml-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          ))}
                          {isOwnerOrAdmin && (
                            <button
                              onClick={() => setAssignGameId(game.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              <UserPlus className="w-3 h-3" /> Assign
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isOwnerOrAdmin && (
                          <button
                            onClick={() => handleDeleteGame(game.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Game Dialog */}
      <Dialog open={addGameOpen} onOpenChange={setAddGameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Game</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGame} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gameNumber">Game #</Label>
              <Input
                id="gameNumber"
                type="number"
                min={1}
                value={newGame.gameNumber}
                onChange={(e) => setNewGame((g) => ({ ...g, gameNumber: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gameDate">Date</Label>
              <Input
                id="gameDate"
                type="datetime-local"
                value={newGame.gameDate}
                onChange={(e) => setNewGame((g) => ({ ...g, gameDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opponent">Opponent</Label>
              <Input
                id="opponent"
                value={newGame.opponent}
                onChange={(e) => setNewGame((g) => ({ ...g, opponent: e.target.value }))}
                placeholder="e.g. Lakers"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Home / Away</Label>
              <Select value={newGame.homeAway} onValueChange={(v) => setNewGame((g) => ({ ...g, homeAway: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOME">Home</SelectItem>
                  <SelectItem value="AWAY">Away</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddGameOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addGameLoading}>{addGameLoading ? 'Adding…' : 'Add Game'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignGameId} onOpenChange={(o) => { if (!o) { setAssignGameId(null); setAssignUserId(''); setAssignSeat('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Person</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Person</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId} required>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seatLabel">Seat (optional)</Label>
              <Input
                id="seatLabel"
                value={assignSeat}
                onChange={(e) => setAssignSeat(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignGameId(null)}>Cancel</Button>
              <Button type="submit" disabled={assignLoading || !assignUserId}>
                {assignLoading ? 'Assigning…' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
