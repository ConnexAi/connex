import DashboardChat from "./components/DashboardChat";
import DashboardWidgets from "./components/DashboardWidgets";

export default function Dashboard() {
  return (
    <div className="w-full">
      {/* Chat grande + widgets angostos */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <DashboardChat />
        </div>

        <div className="xl:sticky xl:top-6 h-fit">
          <DashboardWidgets />
        </div>
      </div>
    </div>
  );
}
