import { Link } from "react-router-dom";
import { formatNumber } from "@/lib/format";

export interface QuickLinksProps {
  activeOrders: number;
  kitchenOrders: number;
  readyOrders: number;
}

interface QuickLinkItem {
  label: string;
  description: string;
  path: string;
  count?: number;
}

function getQuickLinks({
  activeOrders,
  kitchenOrders,
  readyOrders,
}: QuickLinksProps): QuickLinkItem[] {
  return [
    {
      label: "Active Orders",
      description: "Follow every open order",
      path: "/orders",
      count: activeOrders,
    },
    {
      label: "Kitchen Orders",
      description: "What the kitchen is cooking",
      path: "/kds",
      count: kitchenOrders,
    },
    {
      label: "Ready Orders",
      description: "Deliver to tables",
      path: "/waiter",
      count: readyOrders,
    },
    {
      label: "Pending Payments",
      description: "Collect unpaid bills",
      path: "/payments",
    },
  ];
}

export function QuickLinks(props: QuickLinksProps) {
  const links = getQuickLinks(props);

  return (
    <nav className="quick-links" aria-label="Quick navigation">
      {links.map((link) => (
        <Link key={link.path} to={link.path} className="quick-links__item">
          <span className="quick-links__text">
            <span className="quick-links__label">{link.label}</span>
            <span className="quick-links__description">{link.description}</span>
          </span>
          {link.count !== undefined && (
            <span className="quick-links__count">{formatNumber(link.count)}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
