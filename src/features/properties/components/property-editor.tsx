"use client";

import { useState } from "react";
import { BasicInfoForm } from "@/features/properties/components/basic-info-form";
import { CharacteristicsForm } from "@/features/properties/components/characteristics-form";
import { LocationForm } from "@/features/properties/components/location-form";
import { DescriptionForm } from "@/features/properties/components/description-form";
import { PhotoManager } from "@/features/properties/components/photo-manager";
import { ReviewPanel } from "@/features/properties/components/review-panel";
import { AdvertisementGeneratorForm } from "@/features/advertisements/components/advertisement-generator-form";
import { AdvertisementHistory } from "@/features/advertisements/components/advertisement-history";
import { ArtworkGeneratorForm } from "@/features/artwork/components/artwork-generator-form";
import { ArtworkHistory } from "@/features/artwork/components/artwork-history";
import type { SerializedProperty } from "@/features/properties/serialize-property";
import type { GeneratedAdvertisement, GeneratedArtwork } from "@/generated/prisma/client";

interface PropertyEditorProps {
  property: SerializedProperty;
  advertisements: GeneratedAdvertisement[];
  artworks: GeneratedArtwork[];
}

const TABS = [
  { id: "basico", label: "Informações básicas" },
  { id: "caracteristicas", label: "Características" },
  { id: "localizacao", label: "Localização" },
  { id: "fotos", label: "Fotos" },
  { id: "descricao", label: "Descrição" },
  { id: "anuncios", label: "Anúncios com IA" },
  { id: "artes", label: "Artes" },
  { id: "revisao", label: "Revisão e publicação" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PropertyEditor({ property, advertisements, artworks }: PropertyEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>("basico");

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Etapas do cadastro" className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "step" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === tab.id
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div>
        {activeTab === "basico" ? <BasicInfoForm property={property} /> : null}
        {activeTab === "caracteristicas" ? <CharacteristicsForm property={property} /> : null}
        {activeTab === "localizacao" ? <LocationForm property={property} /> : null}
        {activeTab === "fotos" ? <PhotoManager property={property} /> : null}
        {activeTab === "descricao" ? <DescriptionForm property={property} /> : null}
        {activeTab === "anuncios" ? (
          <div className="flex flex-col gap-6">
            <AdvertisementGeneratorForm property={property} />
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Histórico</h2>
              <AdvertisementHistory advertisements={advertisements} propertyId={property.id} />
            </div>
          </div>
        ) : null}
        {activeTab === "artes" ? (
          <div className="flex flex-col gap-6">
            <ArtworkGeneratorForm property={property} />
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Histórico</h2>
              <ArtworkHistory artworks={artworks} />
            </div>
          </div>
        ) : null}
        {activeTab === "revisao" ? <ReviewPanel property={property} /> : null}
      </div>
    </div>
  );
}
