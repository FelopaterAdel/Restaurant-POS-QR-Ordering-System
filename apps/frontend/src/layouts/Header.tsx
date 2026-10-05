import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useRestaurant } from "@/features/settings";
import { NotificationBell } from "@/features/notifications/components";

interface HeaderProps {
  onMenuClick: () => void;
}

function roleTone(role: string): string {
  switch (role) {
    case "OWNER":
      return "badge--primary";
    case "MANAGER":
      return "badge--info";
    case "CASHIER":
      return "badge--success";
    case "WAITER":
      return "badge--warning";
    case "KITCHEN":
      return "badge--danger";
    default:
      return "badge--neutral";
  }
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { restaurant } = useRestaurant();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initial = (restaurant?.name ?? "R").charAt(0).toUpperCase();

  return (
    <header className="header">
      <div className="header__start">
        <button
          type="button"
          className="header__menu"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" />
          </svg>
        </button>
        <div className="header__brand">
          {restaurant?.logoUrl ? (
            <img
              src={restaurant.logoUrl}
              alt=""
              className="header__logo"
            />
          ) : (
            <span className="header__mark" aria-hidden="true">
              {initial}
            </span>
          )}
          <span className="header__name">
            <span className="header__name-text">
              {restaurant?.name ?? "Restaurant POS"}
            </span>
            <span className="header__sub">Service console</span>
          </span>
        </div>
      </div>
      {user && (
        <div className="header__end">
          <NotificationBell />
          <div className="header__identity">
            <span className="header__user-name">{user.name}</span>
            <span className={`badge ${roleTone(user.role)} header__role-badge`}>
              {user.role}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}
