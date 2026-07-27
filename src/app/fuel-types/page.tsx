"use client";

import NamedListPage from "@/components/masterdata/NamedListPage";

export default function FuelTypesPage() {
  return (
    <NamedListPage
      endpoint="/api/fuel-types"
      title="Fuel Types"
      subtitle="Manage the list of fuel types used across Vehicle Master and Rate Cards."
      itemLabel="Fuel Type"
      breadcrumbLabel="Fuel Type"
    />
  );
}
