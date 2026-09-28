import { Link } from "react-router-dom";
import { Card, CardBody } from "@/components/ui";
import { useLowStockQuery } from "@/features/inventory/inventory.queries";

export function LowStockBanner() {
  const { data, isLoading, isError } = useLowStockQuery();

  if (isLoading || isError || !data || data.length === 0) {
    return null;
  }

  const names = data.map((item) => item.name).join(", ");

  return (
    <Card>
      <CardBody>
        <div role="alert" className="low-stock-banner">
          <div>
            <strong>
              Low stock ({data.length} ingredient{data.length === 1 ? "" : "s"})
            </strong>
            <p>{names}</p>
          </div>
          <Link to="/inventory" className="low-stock-banner__link">
            Review inventory
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
