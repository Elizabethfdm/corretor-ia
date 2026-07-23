import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PROPERTY_TYPE_LABELS, PURPOSE_LABELS, FEATURE_LABELS } from "@/lib/property/labels";
import { PropertyPurpose, PropertyType, FeatureType } from "@/generated/prisma/enums";
import { CATALOG_SORT_OPTIONS, type CatalogFilters } from "@/lib/validation/catalog-filters";

interface CatalogFiltersFormProps {
  slug: string;
  filters: CatalogFilters;
}

const SORT_LABELS: Record<(typeof CATALOG_SORT_OPTIONS)[number], string> = {
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  area_desc: "Maior área",
  featured: "Destaques",
};

/**
 * Formulário GET simples (sem JavaScript): cada busca gera uma
 * navegação com os filtros na própria URL, atendendo RN-047 (filtro
 * compartilhável) sem exigir estado no cliente.
 */
export function CatalogFiltersForm({ slug, filters }: CatalogFiltersFormProps) {
  const selectedFeatures = new Set(filters.features ?? []);

  return (
    <form action={`/catalogo/${slug}`} method="GET" className="flex flex-col gap-4">
      <div>
        <label htmlFor="q" className="sr-only">
          Buscar imóveis
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          placeholder="Buscar por título, descrição, bairro ou cidade"
          defaultValue={filters.q ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label
            htmlFor="purpose"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Finalidade
          </label>
          <Select id="purpose" name="purpose" defaultValue={filters.purpose ?? ""}>
            <option value="">Todas</option>
            {Object.values(PropertyPurpose).map((value) => (
              <option key={value} value={value}>
                {PURPOSE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label
            htmlFor="type"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Tipo
          </label>
          <Select id="type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">Todos</option>
            {Object.values(PropertyType).map((value) => (
              <option key={value} value={value}>
                {PROPERTY_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label
            htmlFor="city"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Cidade
          </label>
          <Input id="city" name="city" type="text" defaultValue={filters.city ?? ""} />
        </div>

        <div>
          <label
            htmlFor="neighborhood"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Bairro
          </label>
          <Input
            id="neighborhood"
            name="neighborhood"
            type="text"
            defaultValue={filters.neighborhood ?? ""}
          />
        </div>

        <div>
          <label
            htmlFor="priceMin"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Valor mínimo
          </label>
          <Input
            id="priceMin"
            name="priceMin"
            type="number"
            min="0"
            step="0.01"
            defaultValue={filters.priceMin ?? ""}
          />
        </div>

        <div>
          <label
            htmlFor="priceMax"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Valor máximo
          </label>
          <Input
            id="priceMax"
            name="priceMax"
            type="number"
            min="0"
            step="0.01"
            defaultValue={filters.priceMax ?? ""}
          />
        </div>

        <div>
          <label
            htmlFor="bedroomsMin"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Quartos (mín.)
          </label>
          <Input
            id="bedroomsMin"
            name="bedroomsMin"
            type="number"
            min="0"
            defaultValue={filters.bedroomsMin ?? ""}
          />
        </div>

        <div>
          <label
            htmlFor="parkingMin"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Vagas (mín.)
          </label>
          <Input
            id="parkingMin"
            name="parkingMin"
            type="number"
            min="0"
            defaultValue={filters.parkingMin ?? ""}
          />
        </div>

        <div>
          <label
            htmlFor="sort"
            className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
          >
            Ordenar por
          </label>
          <Select id="sort" name="sort" defaultValue={filters.sort}>
            {CATALOG_SORT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">
          Características
        </legend>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {Object.values(FeatureType).map((feature) => (
            <label
              key={feature}
              className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
            >
              <input
                type="checkbox"
                name="features"
                value={feature}
                defaultChecked={selectedFeatures.has(feature)}
                className="h-3.5 w-3.5"
              />
              {FEATURE_LABELS[feature]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          name="financingAccepted"
          value="true"
          defaultChecked={filters.financingAccepted === true}
          className="h-4 w-4"
        />
        Aceita financiamento
      </label>

      <Button type="submit" className="w-full sm:w-auto">
        Filtrar
      </Button>
    </form>
  );
}
