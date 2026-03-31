import { useQuery } from "@tanstack/react-query";

import type {
  Category,
  DiscoverFilter,
  HighlightChip,
  PromoCard,
} from "@/lib/customer-data";
import { apiGet } from "@/lib/api-client";

type ContentCategoryDto = {
  _id: string;
  key: string;
  label: string;
  icon: string;
  accent: string;
};

type QuickPickDto = {
  _id: string;
  key: string;
  icon: string;
  label: string;
  color: string;
};

type PromoDto = {
  _id: string;
  key: string;
  title: string;
  note: string;
  bg: string;
  glow: string;
  eyebrow?: string;
  description: string;
  code?: string;
  minOrderTk?: number;
  validFor: string;
  perks: string[];
  terms: string[];
};

type DiscoverFilterDto = {
  _id: string;
  key: DiscoverFilter["id"];
  label: string;
  color: string;
  icon: string;
};

type HomeContentDto = {
  categories: ContentCategoryDto[];
  quickPicks: QuickPickDto[];
  promos: PromoDto[];
};

type DiscoverContentDto = {
  categories: ContentCategoryDto[];
  filters: DiscoverFilterDto[];
};

function mapCategory(category: ContentCategoryDto): Category {
  return {
    id: category.key || category._id,
    label: category.label,
    icon: category.icon,
    accent: category.accent,
  };
}

function mapQuickPick(item: QuickPickDto): HighlightChip {
  return {
    id: item.key || item._id,
    icon: item.icon,
    label: item.label,
    color: item.color,
  };
}

function mapPromo(promo: PromoDto): PromoCard {
  return {
    id: promo.key || promo._id,
    title: promo.title,
    note: promo.note,
    bg: promo.bg,
    glow: promo.glow,
    eyebrow: promo.eyebrow,
    description: promo.description,
    code: promo.code,
    minOrderTk: promo.minOrderTk,
    validFor: promo.validFor,
    perks: promo.perks,
    terms: promo.terms,
  };
}

function mapFilter(filter: DiscoverFilterDto): DiscoverFilter {
  return {
    id: filter.key,
    label: filter.label,
    color: filter.color,
    icon: filter.icon,
  };
}

export function useHomeContentQuery() {
  return useQuery({
    queryKey: ["content", "home"],
    queryFn: async () => {
      const response = await apiGet<HomeContentDto>("/api/v1/content/home");

      return {
        categories: response.data.categories.map(mapCategory),
        quickPicks: response.data.quickPicks.map(mapQuickPick),
        promos: response.data.promos.map(mapPromo),
      };
    },
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["content", "categories"],
    queryFn: async () => {
      const response = await apiGet<ContentCategoryDto[]>("/api/v1/content/categories");
      return response.data.map(mapCategory);
    },
  });
}

export function usePromosQuery() {
  return useQuery({
    queryKey: ["content", "promos"],
    queryFn: async () => {
      const response = await apiGet<PromoDto[]>("/api/v1/content/promos");
      return response.data.map(mapPromo);
    },
  });
}

export function useDiscoverContentQuery() {
  return useQuery({
    queryKey: ["content", "discover"],
    queryFn: async () => {
      const response = await apiGet<DiscoverContentDto>("/api/v1/content/discover");

      return {
        categories: response.data.categories.map(mapCategory),
        filters: response.data.filters.map(mapFilter),
      };
    },
  });
}
