import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { TicketPlan, Transfer, Game } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/PageHeader'
import { formatCurrency, formatShortDate, SPORT_COLORS } from '@/lib/utils'
import { Ticket, ArrowLeftRight, CalendarDays, DollarSign, ChevronRight } from 'lucide-react'

interface DashboardData {
  plans: TicketPlan[]
  upcomingGames: (Game & { plan: Pick<TicketPlan, 'id' | 'sport' | 'team'> })[]
  transfers: Transfer[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<DashboardData>('/dashboard')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { plans, upcomingGames, transfers } = data
  const pendingTransfers = transfers.filter((t) => t.paymentStatus === 'PENDING')
  const totalOwed = pendingTransfers.reduce((sum, t) => sum + t.price, 0)

  return (
    <div>
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${user?.name.split(' ')[0]}`}
        description="Here's what's happening with your tickets"
      />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Ticket className="w-4 h-4" />} label="Active Plans" value={plans.length} />
          <StatCard
            icon={<CalendarDays className="w-4 h-4" />}
            label="Upcoming Games"
            value={upcomingGames.length}
          />
          <StatCard
            icon={<ArrowLeftRight className="w-4 h-4" />}
            label="Pending Transfers"
            value={pendingTransfers.length}
            accent="warning"
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Amount Pending"
            value={formatCurrency(totalOwed)}
            accent="warning"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming games */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Upcoming Games
                <Link to="/plans" className="text-xs text-primary hover:underline font-normal">
                  All plans
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingGames.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 pb-5">No upcoming games scheduled.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {upcomingGames.map((game) => (
                    <li key={game.id}>
                      <Link
                        to={`/plans/${game.plan.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors"
                      >
                        <span
                          className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${SPORT_COLORS[game.plan.sport] ?? SPORT_COLORS.Other}`}
                        >
                          {game.plan.sport}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {game.homeAway === 'HOME' ? 'vs' : '@'} {game.opponent}
                          </p>
                          <p className="text-xs text-muted-foreground">{game.plan.team}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatShortDate(game.gameDate)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent transfers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Recent Transfers
                <Link to="/transfers" className="text-xs text-primary hover:underline font-normal">
                  All transfers
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transfers.length === 0 ? (
                <p className="text-sm text-muted-foreground px-5 pb-5">No transfers yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {transfers.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {t.fromUser.name} → {t.toUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t.assignment?.game.plan.team} · {t.assignment?.game.opponent}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-medium">{formatCurrency(t.price)}</span>
                        <PaymentBadge status={t.paymentStatus} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Plans overview */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Your Plans</h2>
          {plans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10">
                <Ticket className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No plans yet.</p>
                <Link to="/plans/new" className="text-sm text-primary hover:underline">
                  Add your first plan →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Link key={plan.id} to={`/plans/${plan.id}`}>
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SPORT_COLORS[plan.sport] ?? SPORT_COLORS.Other}`}
                        >
                          {plan.sport}
                        </span>
                        <span className="text-xs text-muted-foreground">{plan.season}</span>
                      </div>
                      <p className="font-semibold">{plan.team}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Sec {plan.section}{plan.row ? ` · Row ${plan.row}` : ''} · {plan.seats}
                      </p>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>{plan._count?.games ?? 0} games</span>
                        {plan.purchasePrice && <span>{formatCurrency(plan.purchasePrice)}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent?: 'warning'
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={`flex items-center gap-2 text-sm mb-2 ${accent === 'warning' ? 'text-amber-400' : 'text-muted-foreground'}`}
        >
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function PaymentBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge variant="success">Paid</Badge>
  if (status === 'WAIVED') return <Badge variant="secondary">Waived</Badge>
  return <Badge variant="warning">Pending</Badge>
}

function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
