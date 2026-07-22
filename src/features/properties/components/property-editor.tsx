"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
      <TabsList aria-label="Etapas do cadastro" className="flex-wrap">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {activeTab === "basico" ? (
        <TabsContent value="basico">
          <BasicInfoForm property={property} />
        </TabsContent>
      ) : null}
      {activeTab === "caracteristicas" ? (
        <TabsContent value="caracteristicas">
          <CharacteristicsForm property={property} />
        </TabsContent>
      ) : null}
      {activeTab === "localizacao" ? (
        <TabsContent value="localizacao">
          <LocationForm property={property} />
        </TabsContent>
      ) : null}
      {activeTab === "fotos" ? (
        <TabsContent value="fotos">
          <PhotoManager property={property} />
        </TabsContent>
      ) : null}
      {activeTab === "descricao" ? (
        <TabsContent value="descricao">
          <DescriptionForm property={property} />
        </TabsContent>
      ) : null}
      {activeTab === "anuncios" ? (
        <TabsContent value="anuncios">
          <div className="flex flex-col gap-6">
            <AdvertisementGeneratorForm property={property} />
            <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Histórico
              </h2>
              <AdvertisementHistory advertisements={advertisements} propertyId={property.id} />
            </div>
          </div>
        </TabsContent>
      ) : null}
      {activeTab === "artes" ? (
        <TabsContent value="artes">
          <div className="flex flex-col gap-6">
            <ArtworkGeneratorForm property={property} />
            <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Histórico
              </h2>
              <ArtworkHistory artworks={artworks} />
            </div>
          </div>
        </TabsContent>
      ) : null}
      {activeTab === "revisao" ? (
        <TabsContent value="revisao">
          <ReviewPanel property={property} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
