import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
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
        <h1 className="header__brand">{import.meta.env.VITE_APP_NAME}</h1>
      </div>
      {user && (
        <div className="header__end">
          <div className="header__identity">
            <span className="header__name">{user.name}</span>
            <span className="header__role">{user.role}</span>
          </div>
          <button
            type="button"
            className="header__logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
