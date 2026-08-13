import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { getVisibleNavigation } from "./navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const items = getVisibleNavigation(user);

  return (
    <>
      <div
        className={`sidebar-overlay${open ? " sidebar-overlay--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className={`sidebar${open ? " sidebar--open" : ""}`}
        aria-label="Primary"
      >
        <button
          type="button"
          className="sidebar__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
        <ul className="sidebar__list">
          {items.map((item) => (
            <li className="sidebar__item" key={item.path}>
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "sidebar__link sidebar__link--active"
                    : "sidebar__link"
                }
                to={item.path}
                onClick={onClose}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
