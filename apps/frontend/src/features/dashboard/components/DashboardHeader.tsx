export interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <h1 className="dashboard-header__title h1">{title}</h1>
      <p className="dashboard-header__subtitle">{subtitle}</p>
    </div>
  );
}
