import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, ArrowLeftRight, Users, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/plans', icon: Ticket, label: 'Plans' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-52'
      )}
    >
      {/* Header */}
      <div className="flex items-center h-12 px-3 border-b border-sidebar-border">
        {!collapsed && (
          <span className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground flex-1 truncate">
            <Ticket className="w-4 h-4 text-primary shrink-0" />
            Ticket Manager
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent ml-auto shrink-0"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        {!collapsed && user && (
          <div className="px-2.5 py-1.5 text-xs text-muted-foreground truncate">
            <span className="block font-medium text-sidebar-foreground truncate">{user.name}</span>
            <span className="truncate">{user.email}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
