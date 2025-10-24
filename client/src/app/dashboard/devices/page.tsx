import { DashboardLayout } from "@/components/DashboardLayout";
import { DevicesClient } from "./DevicesClient";

export default function DevicesPage() {
  return (
    <DashboardLayout>
      <DevicesClient />
    </DashboardLayout>
  );
}