import { useMemo, useState } from "react";

import { CardSkeleton } from "../components/skeletons";
import {
  useCreateMenuCategoryMutation,
  useCreateMenuItemMutation,
  useDeleteMenuItemMutation,
  useMyMenuQuery,
  useUpdateMenuItemMutation,
  useToggleMenuItemStatusMutation,
} from "../lib/owner-queries";

type ItemFormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  popular: boolean;
  isActive: boolean;
};

const initialItemForm: ItemFormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  popular: false,
  isActive: true,
};

export function MenuPage() {
  const { data: menu, isLoading, error } = useMyMenuQuery();
  const createCategory = useCreateMenuCategoryMutation();
  const createMenuItem = useCreateMenuItemMutation();
  const updateMenuItem = useUpdateMenuItemMutation();
  const toggleMenuItem = useToggleMenuItemStatusMutation();
  const deleteMenuItem = useDeleteMenuItemMutation();

  const [categoryLabel, setCategoryLabel] = useState("");
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(initialItemForm);

  const sortedCategories = useMemo(
    () =>
      (menu?.menuCategories ?? [])
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [menu?.menuCategories],
  );

  const sortedItems = useMemo(
    () =>
      (menu?.menuItems ?? [])
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name)),
    [menu?.menuItems],
  );

  const isMutating =
    createCategory.isPending ||
    createMenuItem.isPending ||
    updateMenuItem.isPending ||
    toggleMenuItem.isPending ||
    deleteMenuItem.isPending;

  const resetItemForm = () => {
    setEditingItemKey(null);
    setItemForm(initialItemForm);
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

    const payload = {
      name: itemForm.name,
      description: itemForm.description,
      price: Number(itemForm.price),
      category: itemForm.category,
      popular: itemForm.popular,
      isActive: itemForm.isActive,
    };

    if (editingItemKey) {
      await updateMenuItem.mutateAsync({
        itemKey: editingItemKey,
        ...payload,
      });
    } else {
      await createMenuItem.mutateAsync(payload);
    }

    resetItemForm();
  };

  const startEdit = (itemKey: string) => {
    const nextItem = sortedItems.find((item) => item.key === itemKey);
    if (!nextItem) return;

    setEditingItemKey(itemKey);
    setItemForm({
      name: nextItem.name,
      description: nextItem.description || "",
      price: String(nextItem.price),
      category: nextItem.category || "",
      popular: Boolean(nextItem.popular),
      isActive: nextItem.isActive !== false,
    });
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Menu management</p>
          <h3>Keep the owner workflow simple and fast</h3>
          <p className="muted">
            Categories and items are now backend-connected. This is the clean
            foundation before option groups, add-ons, and Cloudinary item images.
          </p>
        </div>
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
              <h3>{editingItemKey ? "Update menu item" : "Add a new menu item"}</h3>
            </div>
            {editingItemKey ? (
              <button className="ghost-button" onClick={resetItemForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <CardSkeleton lines={6} />
          ) : (
            <form className="stack-form" onSubmit={handleSubmitItem}>
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
                  <span>Price (TK)</span>
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
                      setItemForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
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

              {createMenuItem.error || updateMenuItem.error ? (
                <p className="form-error">
                  {createMenuItem.error instanceof Error
                    ? createMenuItem.error.message
                    : updateMenuItem.error instanceof Error
                      ? updateMenuItem.error.message
                      : "Unable to save the item."}
                </p>
              ) : null}

              <button className="primary-button" type="submit" disabled={isMutating}>
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
              Create your first item from the form above. Option groups and add-ons
              will fit into this same module next.
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {sortedItems.map((item) => (
              <article key={item.key} className="menu-card menu-card-rich">
                <div className="menu-card-top">
                  <div>
                    <strong>{item.name}</strong>
                    <div className="menu-chip-row">
                      <span className="tag-chip">
                        {sortedCategories.find((category) => category.key === item.category)?.label ||
                          "General"}
                      </span>
                      {item.popular ? <span className="tag-chip tag-chip-warm">Popular</span> : null}
                      <span className={item.isActive !== false ? "status-dot-label" : "status-dot-label status-dot-label-off"}>
                        {item.isActive !== false ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </div>
                  <span className="menu-price">TK {item.price}</span>
                </div>

                <p className="muted-small">{item.description || "No description yet."}</p>

                <div className="action-cluster">
                  <button className="ghost-button" onClick={() => startEdit(item.key)}>
                    Edit
                  </button>
                  <button
                    className="ghost-button"
                    disabled={isMutating}
                    onClick={() =>
                      void toggleMenuItem.mutateAsync({
                        itemKey: item.key,
                        isActive: item.isActive === false,
                      })
                    }
                  >
                    {item.isActive === false ? "Show item" : "Hide item"}
                  </button>
                  <button
                    className="danger-button"
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
