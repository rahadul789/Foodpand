import type {
  OwnerMenuItem,
  OwnerMenuItemAddonGroup,
  OwnerMenuItemAddonItem,
  OwnerMenuItemBundleSuggestion,
  OwnerMenuItemDetail,
  OwnerMenuItemOptionChoice,
  OwnerMenuItemOptionGroup,
  UpsertOwnerMenuItemPayload,
} from "./owner-api";

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export type MenuItemChoiceFormState = Omit<OwnerMenuItemOptionChoice, "priceModifier"> & {
  priceModifier: string;
};

export type MenuItemOptionGroupFormState = Omit<OwnerMenuItemOptionGroup, "choices" | "minSelect" | "maxSelect"> & {
  minSelect: string;
  maxSelect: string;
  choices: MenuItemChoiceFormState[];
};

export type MenuItemAddonFormState = Omit<OwnerMenuItemAddonItem, "priceModifier"> & {
  priceModifier: string;
};

export type MenuItemAddonGroupFormState = Omit<OwnerMenuItemAddonGroup, "maxSelect" | "items"> & {
  maxSelect: string;
  items: MenuItemAddonFormState[];
};

export type MenuItemBundleSuggestionFormState = Omit<
  OwnerMenuItemBundleSuggestion,
  "priceModifier"
> & {
  priceModifier: string;
};

export type MenuItemFormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  popular: boolean;
  isActive: boolean;
  subtitle: string;
  image: string;
  instructionsPlaceholder: string;
  maxInstructionsLength: string;
  optionGroups: MenuItemOptionGroupFormState[];
  addonGroups: MenuItemAddonGroupFormState[];
  bundleSuggestions: MenuItemBundleSuggestionFormState[];
};

export function createEmptyChoice(): MenuItemChoiceFormState {
  return {
    id: createDraftId("choice"),
    label: "",
    priceModifier: "0",
  };
}

export function createEmptyOptionGroup(): MenuItemOptionGroupFormState {
  return {
    id: createDraftId("option-group"),
    title: "",
    required: false,
    minSelect: "0",
    maxSelect: "1",
    choices: [createEmptyChoice()],
  };
}

export function createEmptyAddonItem(): MenuItemAddonFormState {
  return {
    id: createDraftId("addon-item"),
    label: "",
    priceModifier: "0",
    popular: false,
  };
}

export function createEmptyAddonGroup(): MenuItemAddonGroupFormState {
  return {
    id: createDraftId("addon-group"),
    title: "",
    maxSelect: "1",
    optionalLabel: "",
    description: "",
    items: [createEmptyAddonItem()],
  };
}

export function createEmptyBundleSuggestion(): MenuItemBundleSuggestionFormState {
  return {
    id: createDraftId("bundle"),
    label: "",
    priceModifier: "0",
    accent: "#FFC857",
    icon: "sparkles-outline",
  };
}

export function createEmptyMenuItemForm(): MenuItemFormState {
  return {
    name: "",
    description: "",
    price: "",
    category: "",
    popular: false,
    isActive: true,
    subtitle: "",
    image: "",
    instructionsPlaceholder: "",
    maxInstructionsLength: "500",
    optionGroups: [],
    addonGroups: [],
    bundleSuggestions: [],
  };
}

function numberToString(value: number | undefined, fallback = "0") {
  return Number.isFinite(value) ? String(value) : fallback;
}

function toChoiceFormState(choice: OwnerMenuItemOptionChoice): MenuItemChoiceFormState {
  return {
    id: choice.id,
    label: choice.label,
    priceModifier: numberToString(choice.priceModifier),
  };
}

function toOptionGroupFormState(group: OwnerMenuItemOptionGroup): MenuItemOptionGroupFormState {
  return {
    id: group.id,
    title: group.title,
    required: Boolean(group.required),
    minSelect: numberToString(group.minSelect),
    maxSelect: numberToString(group.maxSelect, "1"),
    choices: (group.choices ?? []).map(toChoiceFormState),
  };
}

function toAddonItemFormState(item: OwnerMenuItemAddonItem): MenuItemAddonFormState {
  return {
    id: item.id,
    label: item.label,
    priceModifier: numberToString(item.priceModifier),
    popular: Boolean(item.popular),
  };
}

function toAddonGroupFormState(group: OwnerMenuItemAddonGroup): MenuItemAddonGroupFormState {
  return {
    id: group.id,
    title: group.title,
    maxSelect: numberToString(group.maxSelect, "1"),
    optionalLabel: group.optionalLabel ?? "",
    description: group.description ?? "",
    items: (group.items ?? []).map(toAddonItemFormState),
  };
}

function toBundleSuggestionFormState(
  item: OwnerMenuItemBundleSuggestion,
): MenuItemBundleSuggestionFormState {
  return {
    id: item.id,
    label: item.label,
    priceModifier: numberToString(item.priceModifier),
    accent: item.accent || "#FFC857",
    icon: item.icon || "sparkles-outline",
  };
}

export function toMenuItemFormState(item?: OwnerMenuItem): MenuItemFormState {
  if (!item) {
    return createEmptyMenuItemForm();
  }

  const detail: OwnerMenuItemDetail | undefined = item.detail ?? undefined;

  return {
    name: item.name ?? "",
    description: item.description ?? "",
    price: numberToString(item.price, ""),
    category: item.category ?? "",
    popular: Boolean(item.popular),
    isActive: item.isActive !== false,
    subtitle: detail?.subtitle ?? "",
    image: detail?.image ?? "",
    instructionsPlaceholder: detail?.instructionsPlaceholder ?? "",
    maxInstructionsLength: numberToString(detail?.maxInstructionsLength, "500"),
    optionGroups: (item.optionGroups ?? []).map(toOptionGroupFormState),
    addonGroups: (detail?.addonGroups ?? []).map(toAddonGroupFormState),
    bundleSuggestions: (detail?.bundleSuggestions ?? []).map(toBundleSuggestionFormState),
  };
}

function toPriceNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeChoice(choice: MenuItemChoiceFormState): OwnerMenuItemOptionChoice | null {
  const label = choice.label.trim();
  if (!label) {
    return null;
  }

  return {
    id: choice.id,
    label,
    priceModifier: toPriceNumber(choice.priceModifier, 0),
  };
}

function normalizeOptionGroup(
  group: MenuItemOptionGroupFormState,
): OwnerMenuItemOptionGroup | null {
  const title = group.title.trim();
  if (!title) {
    return null;
  }

  const choices = group.choices.map(normalizeChoice).filter(Boolean) as OwnerMenuItemOptionChoice[];
  if (!choices.length) {
    return null;
  }

  return {
    id: group.id,
    title,
    required: Boolean(group.required),
    minSelect: Math.max(0, Math.round(toPriceNumber(group.minSelect, 0))),
    maxSelect: Math.max(1, Math.round(toPriceNumber(group.maxSelect, 1))),
    choices,
  };
}

function normalizeAddonItem(item: MenuItemAddonFormState): OwnerMenuItemAddonItem | null {
  const label = item.label.trim();
  if (!label) {
    return null;
  }

  return {
    id: item.id,
    label,
    priceModifier: toPriceNumber(item.priceModifier, 0),
    popular: Boolean(item.popular),
  };
}

function normalizeAddonGroup(
  group: MenuItemAddonGroupFormState,
): OwnerMenuItemAddonGroup | null {
  const title = group.title.trim();
  if (!title) {
    return null;
  }

  const items = group.items.map(normalizeAddonItem).filter(Boolean) as OwnerMenuItemAddonItem[];
  if (!items.length) {
    return null;
  }

  return {
    id: group.id,
    title,
    maxSelect: Math.max(1, Math.round(toPriceNumber(group.maxSelect, 1))),
    optionalLabel: (group.optionalLabel ?? "").trim(),
    description: (group.description ?? "").trim(),
    items,
  };
}

function normalizeBundleSuggestion(
  item: MenuItemBundleSuggestionFormState,
): OwnerMenuItemBundleSuggestion | null {
  const label = item.label.trim();
  if (!label) {
    return null;
  }

  return {
    id: item.id,
    label,
    priceModifier: toPriceNumber(item.priceModifier, 0),
    accent: (item.accent ?? "").trim() || "#FFC857",
    icon: (item.icon ?? "").trim() || "sparkles-outline",
  };
}

export function buildMenuItemPayload(form: MenuItemFormState): UpsertOwnerMenuItemPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: toPriceNumber(form.price, 0),
    category: form.category.trim(),
    popular: Boolean(form.popular),
    isActive: Boolean(form.isActive),
    optionGroups: form.optionGroups
      .map(normalizeOptionGroup)
      .filter(Boolean) as OwnerMenuItemOptionGroup[],
    detail: {
      image: form.image.trim(),
      subtitle: form.subtitle.trim(),
      addonGroups: form.addonGroups
        .map(normalizeAddonGroup)
        .filter(Boolean) as OwnerMenuItemAddonGroup[],
      bundleSuggestions: form.bundleSuggestions
        .map(normalizeBundleSuggestion)
        .filter(Boolean) as OwnerMenuItemBundleSuggestion[],
      instructionsPlaceholder: form.instructionsPlaceholder.trim(),
      maxInstructionsLength: Math.max(
        0,
        Math.round(toPriceNumber(form.maxInstructionsLength, 500)),
      ),
    },
  };
}
