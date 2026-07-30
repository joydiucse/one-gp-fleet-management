import { vehicleCategoryRepository, fuelTypeRepository } from "./namedList";
import { vehicleRepository } from "./vehicles";
import { driverRepository } from "./drivers";
import { rateCardRepository } from "./rateCards";
import { roleRepository } from "./roles";
import type { Repository } from "./types";

/**
 * Collection name -> repository, so the generic CRUD route factory stays
 * parameterised by name and the collection route files need no changes.
 */
const REPOSITORIES = {
  vehicles: vehicleRepository,
  drivers: driverRepository,
  vehicleCategories: vehicleCategoryRepository,
  fuelTypes: fuelTypeRepository,
  rateCards: rateCardRepository,
  roles: roleRepository,
} as const;

export type CollectionName = keyof typeof REPOSITORIES;

export function getRepository<T>(collection: CollectionName): Repository<T> {
  const repository = REPOSITORIES[collection];
  if (!repository) throw new Error(`No repository registered for collection '${collection}'.`);
  return repository as unknown as Repository<T>;
}

export {
  vehicleRepository,
  driverRepository,
  rateCardRepository,
  roleRepository,
  vehicleCategoryRepository,
  fuelTypeRepository,
};
export type { Repository };
