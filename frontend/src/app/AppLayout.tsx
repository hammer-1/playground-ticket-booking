import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { closeSocket } from '../lib/socket';

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-lime/25 blur-[6px]" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-lime shadow-[0_0_12px_2px_rgba(185,247,62,0.8)]" />
      </span>
      <span className="font-display text-[1.35rem] font-bold tracking-tight text-chalk">
        Floodlit
      </span>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    closeSocket();
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-sm font-medium transition-colors ${
      isActive ? 'text-chalk' : 'text-haze hover:text-chalk-dim'
    }`;

  return (
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-30 border-b border-chalk/8 bg-turf-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-10">
            <Wordmark />
            <nav className="hidden items-center gap-7 sm:flex">
              <NavLink to="/" end className={linkClass}>
                Book a pitch
              </NavLink>
              <NavLink to="/bookings" className={linkClass}>
                My bookings
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-chalk-dim sm:inline">
              {user?.name}
            </span>
            <button
              onClick={onLogout}
              className="rounded-full border border-chalk/15 px-4 py-1.5 text-sm font-medium text-chalk-dim transition-colors hover:border-clay/50 hover:text-clay"
            >
              Log out
            </button>
          </div>
        </div>
        {/* nav for small screens */}
        <nav className="flex items-center gap-6 border-t border-chalk/8 px-5 pb-2.5 pt-2 sm:hidden">
          <NavLink to="/" end className={linkClass}>
            Book
          </NavLink>
          <NavLink to="/bookings" className={linkClass}>
            My bookings
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
