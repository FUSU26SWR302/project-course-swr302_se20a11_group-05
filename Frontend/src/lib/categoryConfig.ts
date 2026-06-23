import { Car, Leaf, Cone, Shield, Store, Flame } from "lucide-react";
import React from "react";

export interface CategoryInfo {
  code: string;
  nameKey: string;
  descKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const OFFICIAL_CATEGORIES: CategoryInfo[] = [
  {
    code: "TRAFFIC",
    nameKey: "category.official.TRAFFIC.name",
    descKey: "category.official.TRAFFIC.desc",
    icon: Car,
  },
  {
    code: "URBAN_INFRASTRUCTURE",
    nameKey: "category.official.URBAN_INFRASTRUCTURE.name",
    descKey: "category.official.URBAN_INFRASTRUCTURE.desc",
    icon: Cone,
  },
  {
    code: "ENVIRONMENT",
    nameKey: "category.official.ENVIRONMENT.name",
    descKey: "category.official.ENVIRONMENT.desc",
    icon: Leaf,
  },
  {
    code: "PUBLIC_SECURITY",
    nameKey: "category.official.PUBLIC_SECURITY.name",
    descKey: "category.official.PUBLIC_SECURITY.desc",
    icon: Shield,
  },
  {
    code: "CONSTRUCTION",
    nameKey: "category.official.CONSTRUCTION.name",
    descKey: "category.official.CONSTRUCTION.desc",
    icon: Store,
  },
  {
    code: "FIRE_SAFETY",
    nameKey: "category.official.FIRE_SAFETY.name",
    descKey: "category.official.FIRE_SAFETY.desc",
    icon: Flame,
  },
];
