import {
  AddressVisibility,
  FeatureType,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
} from "@/generated/prisma/enums";

export const PURPOSE_LABELS: Record<PropertyPurpose, string> = {
  [PropertyPurpose.SALE]: "Venda",
  [PropertyPurpose.RENT]: "Aluguel",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.HOUSE]: "Casa",
  [PropertyType.APARTMENT]: "Apartamento",
  [PropertyType.LAND]: "Terreno",
  [PropertyType.FARM_SMALL]: "Chácara",
  [PropertyType.FARM]: "Sítio",
  [PropertyType.RANCH]: "Fazenda",
  [PropertyType.COMMERCIAL_ROOM]: "Sala comercial",
  [PropertyType.COMMERCIAL_PROPERTY]: "Imóvel comercial",
  [PropertyType.WAREHOUSE]: "Galpão",
  [PropertyType.PENTHOUSE]: "Cobertura",
  [PropertyType.TOWNHOUSE]: "Sobrado",
  [PropertyType.STUDIO]: "Kitnet",
  [PropertyType.OTHER]: "Outro",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  [PropertyStatus.DRAFT]: "Rascunho",
  [PropertyStatus.AVAILABLE]: "Disponível",
  [PropertyStatus.RESERVED]: "Reservado",
  [PropertyStatus.SOLD]: "Vendido",
  [PropertyStatus.RENTED]: "Alugado",
  [PropertyStatus.INACTIVE]: "Inativo",
};

export const ADDRESS_VISIBILITY_LABELS: Record<AddressVisibility, string> = {
  [AddressVisibility.HIDDEN_EXACT]: "Mostrar apenas bairro e cidade",
  [AddressVisibility.FULL_ADDRESS]: "Mostrar endereço completo",
};

export const FEATURE_LABELS: Record<FeatureType, string> = {
  [FeatureType.POOL]: "Piscina",
  [FeatureType.BARBECUE]: "Churrasqueira",
  [FeatureType.GOURMET_AREA]: "Área gourmet",
  [FeatureType.BALCONY]: "Varanda",
  [FeatureType.GARDEN]: "Jardim",
  [FeatureType.BACKYARD]: "Quintal",
  [FeatureType.ELEVATOR]: "Elevador",
  [FeatureType.GYM]: "Academia",
  [FeatureType.PARTY_ROOM]: "Salão de festas",
  [FeatureType.CONCIERGE]: "Portaria",
  [FeatureType.GATED_COMMUNITY]: "Condomínio fechado",
  [FeatureType.AIR_CONDITIONING]: "Ar-condicionado",
  [FeatureType.SOLAR_ENERGY]: "Energia solar",
  [FeatureType.ACCESSIBILITY]: "Acessibilidade",
  [FeatureType.SEA_VIEW]: "Vista para o mar",
  [FeatureType.STREET_FRONT]: "Frente para a rua",
  [FeatureType.SERVICE_AREA]: "Área de serviço",
};
