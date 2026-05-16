import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { TicketPlan } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader'
import { formatCurrency, SPORT_COLORS } from '@/lib/utils'
import { Plus, Ticket } from 'lucide-react'

export default function PlansPage() {
  const [plans, setPlans] = useState<TicketPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TicketPlan[]>('/plans')
      .then(setPlans)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Plans"
        description="All season ticket plans"
        action={
          <Button asChild size="sm">
            <Link to="/plans/new">
              <Plus className="w-4 h-4" /> New Plan
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        {plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16">
              <Ticket className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No plans yet. Add your first season ticket plan.</p>
              <Button asChild size="sm">
                <Link to="/plans/new">
                  <Plus className="w-4 h-4" /> New Plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Link key={plan.id} to={`/plans/${plan.id}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${SPORT_COLORS[plan.sport] ?? SPORT_COLORS.Other}`}
                      >
                        {plan.sport}
                      </span>
                      <span className="text-xs text-muted-foreground">{plan.season}</span>
                    </div>
                    <p className="text-base font-semibold">{plan.team}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.owner.name}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-2">
                      Sec {plan.section}{plan.row ? ` · Row ${plan.row}` : ''} · Seats {plan.seats}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span>{plan.totalGames} games total</span>
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
  )
}
