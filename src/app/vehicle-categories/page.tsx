"use client";

import NamedListPage from "@/components/masterdata/NamedListPage";

export default function VehicleCategoriesPage() {
  return (
    <NamedListPage
      endpoint="/api/vehicle-categories"
      title="Vehicle Categories"
      subtitle="Manage the list of vehicle categories used across Vehicle Master and Rate Cards."
      itemLabel="Vehicle Category"
      breadcrumbLabel="Vehicle Category"
    />
  );
}
