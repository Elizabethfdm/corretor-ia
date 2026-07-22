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

const INPUT_CLASS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

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
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Buscar por título, descrição, bairro ou cidade"
          defaultValue={filters.q ?? ""}
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="purpose" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
            Finalidade
          </label>
          <select
            id="purpose"
            name="purpose"
            defaultValue={filters.purpose ?? ""}
            className={INPUT_CLASS}
          >
            <option value="">Todas</option>
            {Object.values(PropertyPurpose).map((value) => (
              <option key={value} value={value}>
                {PURPOSE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
            Tipo
          </label>
          <select id="type" name="type" defaultValue={filters.type ?? ""} className={INPUT_CLASS}>
            <option value="">Todos</option>
            {Object.values(PropertyType).map((value) => (
              <option key={value} value={value}>
                {PROPERTY_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="city" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={filters.city ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="neighborhood"
            className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400"
          >
            Bairro
          </label>
          <input
            id="neighborhood"
            name="neighborhood"
            type="text"
            defaultValue={filters.neighborhood ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="priceMin" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
            Valor mínimo
          </label>
          <input
            id="priceMin"
            name="priceMin"
            type="number"
            min="0"
            step="0.01"
            defaultValue={filters.priceMin ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="priceMax" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
            Valor máximo
          </label>
          <input
            id="priceMax"
            name="priceMax"
            type="number"
            min="0"
            step="0.01"
            defaultValue={filters.priceMax ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="bedroomsMin"
            className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400"
          >
            Quartos (mín.)
          </label>
          <input
            id="bedroomsMin"
            name="bedroomsMin"
            type="number"
            min="0"
            defaultValue={filters.bedroomsMin ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="parkingMin"
            className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400"
          >
            Vagas (mín.)
          </label>
          <input
            id="parkingMin"
            name="parkingMin"
            type="number"
            min="0"
            defaultValue={filters.parkingMin ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="sort" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
            Ordenar por
          </label>
          <select id="sort" name="sort" defaultValue={filters.sort} className={INPUT_CLASS}>
            {CATALOG_SORT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs text-zinc-600 dark:text-zinc-400">Características</legend>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {Object.values(FeatureType).map((feature) => (
            <label
              key={feature}
              className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300"
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

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="financingAccepted"
          value="true"
          defaultChecked={filters.financingAccepted === true}
          className="h-4 w-4"
        />
        Aceita financiamento
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 sm:w-auto dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Filtrar
      </button>
    </form>
  );
}
