import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useRestaurant } from "@/features/settings";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { restaurant } = useRestaurant();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <div className="header__start">
        <button
          type="button"
          className="header__menu"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="header__brand">
          {restaurant?.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt=""
              className="header__logo"
            />
          )}
          <span className="header__name-text">
            {restaurant?.name ?? "Restaurant POS"}
          </span>
        </div>
      </div>
      {user && (
        <div className="header__end">
          <div className="header__identity">
            <span className="header__user-name">{user.name}</span>
            <span className="header__role">{user.role}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}
