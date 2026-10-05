import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { getGroupedNavigation } from "./navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  switch (name) {
    case "dashboard":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="11" y="2.5" width="6.5" height="4" rx="1.5" />
          <rect x="11" y="8.5" width="6.5" height="9" rx="1.5" />
          <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 17h14" />
          <path d="M6 17v-6M10.5 17V7M15 17v-9" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 3h8l3 3v11H5z" />
          <path d="M8 10h5M8 13.5h5" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 6h12M4 10h12M4 14h7" />
          <path d="M15.5 14.5l2 2 3-3.5" />
        </svg>
      );
    case "kitchen":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 8h12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <path d="M7 8V5.5M10 8V4M13 8V5.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 3a5 5 0 0 1 5 5v3l1.5 2.5h-13L5 11V8a5 5 0 0 1 5-5z" />
          <path d="M8.5 16.5a1.5 1.5 0 0 0 3 0" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="2.5" y="5" width="15" height="10.5" rx="2" />
          <path d="M2.5 9h15M6 14.5h4" />
        </svg>
      );
    case "tables":
      return (
        <svg {...common} aria-hidden="true">
          <ellipse cx="10" cy="5.5" rx="6" ry="2.5" />
          <path d="M4 5.5V14c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5.5" />
          <path d="M4 9.8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
        </svg>
      );
    case "reservations":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="4.5" width="14" height="12" rx="2" />
          <path d="M3 8.5h14M7 3v3M13 3v3" />
        </svg>
      );
    case "products":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 2.5l7 3.5-7 3.5-7-3.5z" />
          <path d="M3.5 9.5L10 13l6.5-3.5M3.5 13L10 16.5 16.5 13" />
        </svg>
      );
    case "categories":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="11" y="3" width="6" height="6" rx="1.5" />
          <rect x="3" y="11" width="6" height="6" rx="1.5" />
          <rect x="11" y="11" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "inventory":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3.5 7.5L10 4l6.5 3.5v5L10 16l-6.5-3.5z" />
          <path d="M3.5 7.5L10 11l6.5-3.5M10 11v5" />
        </svg>
      );
    case "coupons":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 6h12v3.5a1.5 1.5 0 0 0 0 3V16H4v-3.5a1.5 1.5 0 0 0 0-3z" />
          <path d="M12.5 6v10" strokeDasharray="1.5 1.5" />
        </svg>
      );
    case "users":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10" cy="7" r="3" />
          <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" />
        </svg>
      );
    case "audit":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10" cy="10" r="6.5" />
          <path d="M10 6.5V10l2.5 2" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10" cy="10" r="2.5" />
          <path d="M10 3v2.5M10 14.5V17M3 10h2.5M14.5 10H17M5.2 5.2l1.8 1.8M13 13l1.8 1.8M14.8 5.2L13 7M7 13l-1.8 1.8" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10" cy="10" r="6" />
        </svg>
      );
  }
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const sections = getGroupedNavigation(user);

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
        <div className="sidebar__top">
          <span className="sidebar__eyebrow">Workspace</span>
          <button
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="sidebar__scroll">
          {sections.map((section) => (
            <div className="sidebar__group" key={section.group}>
              <p className="sidebar__group-label">{section.group}</p>
              <ul className="sidebar__list">
                {section.items.map((item) => (
                  <li className="sidebar__item" key={item.path}>
                    <NavLink
                      className={({ isActive }) =>
                        isActive
                          ? "sidebar__link sidebar__link--active"
                          : "sidebar__link"
                      }
                      to={item.path}
                      end={item.path === "/orders"}
                      onClick={onClose}
                      title={item.description}
                    >
                      <span className="sidebar__icon" aria-hidden="true">
                        <NavIcon name={item.icon} />
                      </span>
                      <span className="sidebar__text">
                        <span className="sidebar__label">{item.label}</span>
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {user && (
          <div className="sidebar__footer">
            <span className="sidebar__role-badge">{user.role}</span>
            <span className="sidebar__user">{user.name}</span>
          </div>
        )}
      </nav>
    </>
  );
}
