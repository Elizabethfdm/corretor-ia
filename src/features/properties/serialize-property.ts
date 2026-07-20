import type { PropertyWithRelations } from "@/server/repositories/property-repository";

/**
 * Componentes de cliente não conseguem receber instâncias de
 * `Prisma.Decimal` como prop (só dados serializáveis) — esta função
 * converte os campos decimais para string antes de repassar os dados
 * do servidor para os formulários ("use client").
 */
export function serializeProperty(property: PropertyWithRelations) {
  return {
    ...property,
    price: property.price?.toString() ?? null,
    condominiumFee: property.condominiumFee?.toString() ?? null,
    propertyTax: property.propertyTax?.toString() ?? null,
    totalArea: property.totalArea?.toString() ?? null,
    builtArea: property.builtArea?.toString() ?? null,
    address: property.address
      ? {
          ...property.address,
          latitude: property.address.latitude?.toString() ?? null,
          longitude: property.address.longitude?.toString() ?? null,
        }
      : null,
  };
}

export type SerializedProperty = ReturnType<typeof serializeProperty>;
