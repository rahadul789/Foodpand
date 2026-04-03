import { useMemo, useRef, useState } from "react";

import { CardSkeleton } from "../components/skeletons";
import { uploadImageToCloudinary } from "../lib/cloudinary-upload";
import {
  buildMenuItemPayload,
  createEmptyAddonGroup,
  createEmptyAddonItem,
  createEmptyBundleSuggestion,
  createEmptyChoice,
  createEmptyMenuItemForm,
  createEmptyOptionGroup,
  toMenuItemFormState,
  type MenuItemAddonFormState,
  type MenuItemAddonGroupFormState,
  type MenuItemBundleSuggestionFormState,
  type MenuItemChoiceFormState,
  type MenuItemFormState,
  type MenuItemOptionGroupFormState,
} from "../lib/menu-editor";
import {
  useCreateMenuCategoryMutation,
  useCreateMenuItemMutation,
  useCreateUploadSignatureMutation,
  useDeleteMenuItemMutation,
  useMyMenuQuery,
  useToggleMenuItemStatusMutation,
  useUpdateMenuItemMutation,
} from "../lib/owner-queries";

const initialItemForm = createEmptyMenuItemForm();

function MenuItemImage({ image, name }: { image?: string; name?: string }) {
  return image ? (
    <img className="menu-item-thumb" src={image} alt={name || "Menu item"} />
  ) : (
    <div className="menu-item-thumb menu-item-thumb-empty">No image</div>
  );
}

export function MenuPage() {
  const { data: menu, isLoading, error } = useMyMenuQuery();
  const createCategory = useCreateMenuCategoryMutation();
  const createMenuItem = useCreateMenuItemMutation();
  const updateMenuItem = useUpdateMenuItemMutation();
  const toggleMenuItem = useToggleMenuItemStatusMutation();
  const deleteMenuItem = useDeleteMenuItemMutation();
  const createUploadSignature = useCreateUploadSignatureMutation();

  const itemImageInputRef = useRef<HTMLInputElement | null>(null);

  const [categoryLabel, setCategoryLabel] = useState("");
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<MenuItemFormState>(initialItemForm);
  const [itemUploadError, setItemUploadError] = useState("");
  const [isUploadingItemImage, setIsUploadingItemImage] = useState(false);

  const sortedCategories = useMemo(
    () => (menu?.menuCategories ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [menu?.menuCategories],
  );
  const sortedItems = useMemo(
    () => (menu?.menuItems ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [menu?.menuItems],
  );
  const activeItemCount = useMemo(
    () => sortedItems.filter((item) => item.isActive !== false).length,
    [sortedItems],
  );
  const totalVariantCount = useMemo(
    () =>
      sortedItems.reduce(
        (sum, item) =>
          sum +
          (item.optionGroups?.length ?? 0) +
          (item.detail?.addonGroups?.length ?? 0) +
          (item.detail?.bundleSuggestions?.length ?? 0),
        0,
      ),
    [sortedItems],
  );

  const isMutating =
    createCategory.isPending ||
    createMenuItem.isPending ||
    updateMenuItem.isPending ||
    toggleMenuItem.isPending ||
    deleteMenuItem.isPending;

  const updateItemForm = (updater: (current: MenuItemFormState) => MenuItemFormState) =>
    setItemForm((current) => updater(current));

  const resetItemForm = () => {
    setEditingItemKey(null);
    setItemForm(createEmptyMenuItemForm());
    setItemUploadError("");
    if (itemImageInputRef.current) itemImageInputRef.current.value = "";
  };

  const handleCreateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createCategory.mutateAsync({
      label: categoryLabel,
      sortOrder: sortedCategories.length,
    });
    setCategoryLabel("");
  };

  const handleSubmitItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildMenuItemPayload(itemForm);

    if (editingItemKey) {
      await updateMenuItem.mutateAsync({ itemKey: editingItemKey, ...payload });
    } else {
      await createMenuItem.mutateAsync(payload);
    }

    resetItemForm();
  };

  const startEdit = (itemKey: string) => {
    const item = sortedItems.find((entry) => entry.key === itemKey);
    if (!item) return;
    setEditingItemKey(itemKey);
    setItemUploadError("");
    setItemForm(toMenuItemFormState(item));
  };

  const handleItemImageUpload = async (file?: File) => {
    if (!file) return;
    setIsUploadingItemImage(true);
    setItemUploadError("");

    try {
      const signature = await createUploadSignature.mutateAsync({
        scope: "menu-item-image",
        entityId: editingItemKey || itemForm.name || "menu-item",
      });
      const upload = await uploadImageToCloudinary(file, signature);
      setItemForm((current) => ({ ...current, image: upload.secureUrl }));
    } catch (issue) {
      setItemUploadError(
        issue instanceof Error ? issue.message : "Unable to upload the item image.",
      );
    } finally {
      setIsUploadingItemImage(false);
      if (itemImageInputRef.current) itemImageInputRef.current.value = "";
    }
  };

  const updateOptionGroup = (groupId: string, updater: (group: MenuItemOptionGroupFormState) => MenuItemOptionGroupFormState) =>
    updateItemForm((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => (group.id === groupId ? updater(group) : group)),
    }));

  const updateChoice = (groupId: string, choiceId: string, updater: (choice: MenuItemChoiceFormState) => MenuItemChoiceFormState) =>
    updateOptionGroup(groupId, (group) => ({
      ...group,
      choices: group.choices.map((choice) => (choice.id === choiceId ? updater(choice) : choice)),
    }));

  const updateAddonGroup = (groupId: string, updater: (group: MenuItemAddonGroupFormState) => MenuItemAddonGroupFormState) =>
    updateItemForm((current) => ({
      ...current,
      addonGroups: current.addonGroups.map((group) => (group.id === groupId ? updater(group) : group)),
    }));

  const updateAddonItem = (groupId: string, itemId: string, updater: (item: MenuItemAddonFormState) => MenuItemAddonFormState) =>
    updateAddonGroup(groupId, (group) => ({
      ...group,
      items: group.items.map((item) => (item.id === itemId ? updater(item) : item)),
    }));

  const updateBundleSuggestion = (suggestionId: string, updater: (item: MenuItemBundleSuggestionFormState) => MenuItemBundleSuggestionFormState) =>
    updateItemForm((current) => ({
      ...current,
      bundleSuggestions: current.bundleSuggestions.map((item) => (item.id === suggestionId ? updater(item) : item)),
    }));

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Menu management</p>
          <h3>Build richer items without making the owner flow messy</h3>
          <p className="muted">
            Menu items can now carry option groups, add-ons, special instructions,
            item images, and simple pairings. This keeps the owner panel useful now
            and keeps later pricing hardening cleaner.
          </p>
        </div>
      </section>

      <section className="stats-grid stats-grid-compact">
        <article className="stat-card">
          <span className="stat-label">Live items</span>
          <strong className="stat-value stat-value-compact">{activeItemCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Categories</span>
          <strong className="stat-value stat-value-compact">{sortedCategories.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Variants & extras</span>
          <strong className="stat-value stat-value-compact">{totalVariantCount}</strong>
        </article>
      </section>

      {error ? (
        <article className="card">
          <p className="form-error">
            {error instanceof Error ? error.message : "Unable to load menu."}
          </p>
        </article>
      ) : null}

      <section className="grid-two">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Menu categories</p>
              <h3>{sortedCategories.length} categories configured</h3>
            </div>
          </div>

          {isLoading ? (
            <CardSkeleton lines={4} />
          ) : (
            <>
              <form className="stack-form" onSubmit={handleCreateCategory}>
                <label className="field">
                  <span>New category</span>
                  <input
                    value={categoryLabel}
                    onChange={(event) => setCategoryLabel(event.target.value)}
                    placeholder="Burger, Pizza, Drinks..."
                    required
                  />
                </label>
                {createCategory.error ? (
                  <p className="form-error">
                    {createCategory.error instanceof Error
                      ? createCategory.error.message
                      : "Unable to create category."}
                  </p>
                ) : null}
                <button className="primary-button" type="submit" disabled={isMutating}>
                  Add category
                </button>
              </form>

              <div className="tag-cloud">
                {sortedCategories.map((category) => (
                  <span key={category.key} className="tag-chip">
                    {category.label}
                  </span>
                ))}
                {sortedCategories.length === 0 ? (
                  <p className="muted">No categories yet. Create the first one here.</p>
                ) : null}
              </div>
            </>
          )}
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{editingItemKey ? "Edit item" : "Create item"}</p>
              <h3>{editingItemKey ? "Update rich menu item" : "Add a new rich menu item"}</h3>
            </div>
            {editingItemKey ? (
              <button className="ghost-button" type="button" onClick={resetItemForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <CardSkeleton lines={8} />
          ) : (
            <form className="stack-form" onSubmit={handleSubmitItem}>
              <div className="field-grid">
                <label className="field">
                  <span>Item name</span>
                  <input
                    value={itemForm.name}
                    onChange={(event) =>
                      setItemForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Smoky Beef Burger"
                    required
                  />
                </label>

                <label className="field">
                  <span>Subtitle</span>
                  <input
                    value={itemForm.subtitle}
                    onChange={(event) =>
                      setItemForm((current) => ({ ...current, subtitle: event.target.value }))
                    }
                    placeholder="Serves 1 person"
                  />
                </label>
              </div>

              <label className="field">
                <span>Description</span>
                <textarea
                  value={itemForm.description}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Juicy beef patty with cheese and signature sauce"
                  rows={3}
                />
              </label>

              <div className="field-grid">
                <label className="field">
                  <span>Base price (TK)</span>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.price}
                    onChange={(event) =>
                      setItemForm((current) => ({ ...current, price: event.target.value }))
                    }
                    placeholder="299"
                    required
                  />
                </label>

                <label className="field">
                  <span>Category</span>
                  <select
                    className="select-input"
                    value={itemForm.category}
                    onChange={(event) =>
                      setItemForm((current) => ({ ...current, category: event.target.value }))
                    }
                  >
                    <option value="">General</option>
                    {sortedCategories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <section className="builder-section">
                <div className="builder-top">
                  <div>
                    <p className="eyebrow">Item image</p>
                    <h4>Give the item a visual identity</h4>
                  </div>
                  <div className="action-cluster">
                    <input
                      ref={itemImageInputRef}
                      className="hidden-input"
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        void handleItemImageUpload(event.target.files?.[0] ?? undefined)
                      }
                    />
                    <button
                      className="ghost-button"
                      type="button"
                      disabled={isUploadingItemImage}
                      onClick={() => itemImageInputRef.current?.click()}
                    >
                      {isUploadingItemImage ? "Uploading..." : "Upload image"}
                    </button>
                    {itemForm.image ? (
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() =>
                          setItemForm((current) => ({ ...current, image: "" }))
                        }
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="menu-media-preview">
                  <MenuItemImage image={itemForm.image} name={itemForm.name} />
                  <p className="muted-small">
                    Upload stays signed and secure through Cloudinary. Save the item
                    to publish the image.
                  </p>
                </div>
                {itemUploadError ? <p className="form-error">{itemUploadError}</p> : null}
              </section>

              <div className="toggle-row">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={itemForm.popular}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        popular: event.target.checked,
                      }))
                    }
                  />
                  <span>Mark as popular</span>
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={itemForm.isActive}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  <span>Keep active</span>
                </label>
              </div>

              <section className="builder-section">
                <div className="builder-top">
                  <div>
                    <p className="eyebrow">Option groups</p>
                    <h4>Sizes, crusts, spice levels, flavours</h4>
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      updateItemForm((current) => ({
                        ...current,
                        optionGroups: [...current.optionGroups, createEmptyOptionGroup()],
                      }))
                    }
                  >
                    Add option group
                  </button>
                </div>
                <div className="builder-list">
                  {itemForm.optionGroups.map((group, groupIndex) => (
                    <article key={group.id} className="builder-card">
                      <div className="builder-card-top">
                        <strong>Option group {groupIndex + 1}</strong>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() =>
                            updateItemForm((current) => ({
                              ...current,
                              optionGroups: current.optionGroups.filter((item) => item.id !== group.id),
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>Title</span>
                          <input
                            value={group.title}
                            onChange={(event) =>
                              updateOptionGroup(group.id, (current) => ({ ...current, title: event.target.value }))
                            }
                            placeholder="Choose size"
                          />
                        </label>
                        <label className="field">
                          <span>Required</span>
                          <label className="check-row builder-inline-check">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(event) =>
                                updateOptionGroup(group.id, (current) => ({ ...current, required: event.target.checked }))
                              }
                            />
                            <span>Customer must choose</span>
                          </label>
                        </label>
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>Min select</span>
                          <input
                            type="number"
                            min="0"
                            value={group.minSelect}
                            onChange={(event) =>
                              updateOptionGroup(group.id, (current) => ({ ...current, minSelect: event.target.value }))
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Max select</span>
                          <input
                            type="number"
                            min="1"
                            value={group.maxSelect}
                            onChange={(event) =>
                              updateOptionGroup(group.id, (current) => ({ ...current, maxSelect: event.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <div className="builder-subsection">
                        <div className="builder-subsection-top">
                          <span>Choices</span>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() =>
                              updateOptionGroup(group.id, (current) => ({
                                ...current,
                                choices: [...current.choices, createEmptyChoice()],
                              }))
                            }
                          >
                            Add choice
                          </button>
                        </div>
                        <div className="builder-list">
                          {group.choices.map((choice, choiceIndex) => (
                            <div key={choice.id} className="builder-row-card">
                              <div className="builder-card-top">
                                <strong>Choice {choiceIndex + 1}</strong>
                                <button
                                  className="ghost-button"
                                  type="button"
                                  onClick={() =>
                                    updateOptionGroup(group.id, (current) => ({
                                      ...current,
                                      choices: current.choices.filter((item) => item.id !== choice.id),
                                    }))
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="field-grid">
                                <label className="field">
                                  <span>Label</span>
                                  <input
                                    value={choice.label}
                                    onChange={(event) =>
                                      updateChoice(group.id, choice.id, (current) => ({ ...current, label: event.target.value }))
                                    }
                                    placeholder="12 inch"
                                  />
                                </label>
                                <label className="field">
                                  <span>Price modifier (TK)</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={choice.priceModifier}
                                    onChange={(event) =>
                                      updateChoice(group.id, choice.id, (current) => ({ ...current, priceModifier: event.target.value }))
                                    }
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {itemForm.optionGroups.length === 0 ? (
                  <p className="muted-small">
                    Add option groups when customers need to choose size, crust, or any item variant.
                  </p>
                ) : null}
              </section>

              <section className="builder-section">
                <div className="builder-top">
                  <div>
                    <p className="eyebrow">Add-on groups</p>
                    <h4>Extras like cheese, dips, toppings, drinks</h4>
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      updateItemForm((current) => ({
                        ...current,
                        addonGroups: [...current.addonGroups, createEmptyAddonGroup()],
                      }))
                    }
                  >
                    Add add-on group
                  </button>
                </div>
                <div className="builder-list">
                  {itemForm.addonGroups.map((group, groupIndex) => (
                    <article key={group.id} className="builder-card">
                      <div className="builder-card-top">
                        <strong>Add-on group {groupIndex + 1}</strong>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() =>
                            updateItemForm((current) => ({
                              ...current,
                              addonGroups: current.addonGroups.filter((item) => item.id !== group.id),
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>Title</span>
                          <input
                            value={group.title}
                            onChange={(event) =>
                              updateAddonGroup(group.id, (current) => ({ ...current, title: event.target.value }))
                            }
                            placeholder="Choose extras"
                          />
                        </label>
                        <label className="field">
                          <span>Optional label</span>
                          <input
                            value={group.optionalLabel}
                            onChange={(event) =>
                              updateAddonGroup(group.id, (current) => ({ ...current, optionalLabel: event.target.value }))
                            }
                            placeholder="Optional"
                          />
                        </label>
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>Description</span>
                          <input
                            value={group.description}
                            onChange={(event) =>
                              updateAddonGroup(group.id, (current) => ({ ...current, description: event.target.value }))
                            }
                            placeholder="Pick up to 2 extras"
                          />
                        </label>
                        <label className="field">
                          <span>Max select</span>
                          <input
                            type="number"
                            min="1"
                            value={group.maxSelect}
                            onChange={(event) =>
                              updateAddonGroup(group.id, (current) => ({ ...current, maxSelect: event.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <div className="builder-subsection">
                        <div className="builder-subsection-top">
                          <span>Add-on items</span>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() =>
                              updateAddonGroup(group.id, (current) => ({
                                ...current,
                                items: [...current.items, createEmptyAddonItem()],
                              }))
                            }
                          >
                            Add item
                          </button>
                        </div>
                        <div className="builder-list">
                          {group.items.map((item, itemIndex) => (
                            <div key={item.id} className="builder-row-card">
                              <div className="builder-card-top">
                                <strong>Add-on {itemIndex + 1}</strong>
                                <button
                                  className="ghost-button"
                                  type="button"
                                  onClick={() =>
                                    updateAddonGroup(group.id, (current) => ({
                                      ...current,
                                      items: current.items.filter((addon) => addon.id !== item.id),
                                    }))
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="field-grid">
                                <label className="field">
                                  <span>Label</span>
                                  <input
                                    value={item.label}
                                    onChange={(event) =>
                                      updateAddonItem(group.id, item.id, (current) => ({ ...current, label: event.target.value }))
                                    }
                                    placeholder="Extra cheese"
                                  />
                                </label>
                                <label className="field">
                                  <span>Price modifier (TK)</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.priceModifier}
                                    onChange={(event) =>
                                      updateAddonItem(group.id, item.id, (current) => ({ ...current, priceModifier: event.target.value }))
                                    }
                                  />
                                </label>
                              </div>
                              <label className="check-row">
                                <input
                                  type="checkbox"
                                  checked={item.popular}
                                  onChange={(event) =>
                                    updateAddonItem(group.id, item.id, (current) => ({ ...current, popular: event.target.checked }))
                                  }
                                />
                                <span>Highlight as popular extra</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {itemForm.addonGroups.length === 0 ? (
                  <p className="muted-small">
                    Use add-ons for optional extras that sit under the item details sheet.
                  </p>
                ) : null}
              </section>

              <section className="builder-section">
                <div className="builder-top">
                  <div>
                    <p className="eyebrow">Suggested pairings</p>
                    <h4>Small upsells that feel natural</h4>
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      updateItemForm((current) => ({
                        ...current,
                        bundleSuggestions: [...current.bundleSuggestions, createEmptyBundleSuggestion()],
                      }))
                    }
                  >
                    Add pairing
                  </button>
                </div>
                <div className="builder-list">
                  {itemForm.bundleSuggestions.map((suggestion, suggestionIndex) => (
                    <div key={suggestion.id} className="builder-row-card">
                      <div className="builder-card-top">
                        <strong>Pairing {suggestionIndex + 1}</strong>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() =>
                            updateItemForm((current) => ({
                              ...current,
                              bundleSuggestions: current.bundleSuggestions.filter((item) => item.id !== suggestion.id),
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>Label</span>
                          <input
                            value={suggestion.label}
                            onChange={(event) =>
                              updateBundleSuggestion(suggestion.id, (current) => ({ ...current, label: event.target.value }))
                            }
                            placeholder="Cold drink combo"
                          />
                        </label>
                        <label className="field">
                          <span>Price modifier (TK)</span>
                          <input
                            type="number"
                            min="0"
                            value={suggestion.priceModifier}
                            onChange={(event) =>
                              updateBundleSuggestion(suggestion.id, (current) => ({ ...current, priceModifier: event.target.value }))
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="builder-section">
                <div className="builder-top">
                  <div>
                    <p className="eyebrow">Special instructions</p>
                    <h4>Help the customer say what matters</h4>
                  </div>
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>Instructions placeholder</span>
                    <input
                      value={itemForm.instructionsPlaceholder}
                      onChange={(event) =>
                        setItemForm((current) => ({ ...current, instructionsPlaceholder: event.target.value }))
                      }
                      placeholder="No onion, less spicy, extra hot..."
                    />
                  </label>
                  <label className="field">
                    <span>Max instruction length</span>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.maxInstructionsLength}
                      onChange={(event) =>
                        setItemForm((current) => ({ ...current, maxInstructionsLength: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </section>

              {createMenuItem.error || updateMenuItem.error ? (
                <p className="form-error">
                  {createMenuItem.error instanceof Error
                    ? createMenuItem.error.message
                    : updateMenuItem.error instanceof Error
                      ? updateMenuItem.error.message
                      : "Unable to save the item."}
                </p>
              ) : null}

              <button className="primary-button" type="submit" disabled={isMutating || isUploadingItemImage}>
                {editingItemKey ? "Update item" : "Add menu item"}
              </button>
            </form>
          )}
        </article>
      </section>

      <article className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Current menu items</p>
            <h3>{sortedItems.length} items in backend</h3>
          </div>
        </div>

        {isLoading ? (
          <CardSkeleton lines={6} />
        ) : sortedItems.length === 0 ? (
          <div className="empty-state">
            <strong>No menu items yet</strong>
            <p className="muted">
              Create your first item from the form above. Rich menu metadata now lives in the same item flow.
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {sortedItems.map((item) => (
              <article key={item.key} className="menu-card menu-card-rich">
                <div className="menu-card-top">
                  <div className="menu-card-heading">
                    <MenuItemImage image={item.detail?.image} name={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <p className="muted-small">
                        {item.detail?.subtitle || item.description || "No extra item context yet."}
                      </p>
                      <div className="menu-chip-row">
                        <span className="tag-chip">
                          {sortedCategories.find((category) => category.key === item.category)?.label || "General"}
                        </span>
                        {item.popular ? <span className="tag-chip tag-chip-warm">Popular</span> : null}
                        <span className={item.isActive !== false ? "status-dot-label" : "status-dot-label status-dot-label-off"}>
                          {item.isActive !== false ? "Active" : "Hidden"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="menu-price">TK {item.price}</span>
                </div>
                <div className="menu-chip-row">
                  <span className="tag-chip">{item.optionGroups?.length ?? 0} option groups</span>
                  <span className="tag-chip">{item.detail?.addonGroups?.length ?? 0} add-on groups</span>
                  <span className="tag-chip">{item.detail?.bundleSuggestions?.length ?? 0} pairings</span>
                </div>
                <p className="muted-small">
                  {item.detail?.instructionsPlaceholder
                    ? `Instructions: ${item.detail.instructionsPlaceholder}`
                    : "No special instructions placeholder added yet."}
                </p>
                <div className="action-cluster">
                  <button className="ghost-button" type="button" onClick={() => startEdit(item.key)}>
                    Edit
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={isMutating}
                    onClick={() => void toggleMenuItem.mutateAsync({ itemKey: item.key, isActive: item.isActive === false })}
                  >
                    {item.isActive === false ? "Show item" : "Hide item"}
                  </button>
                  <button
                    className="danger-button"
                    type="button"
                    disabled={isMutating}
                    onClick={() => void deleteMenuItem.mutateAsync(item.key)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
