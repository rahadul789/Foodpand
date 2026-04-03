import { useMemo, useState } from "react";

import { CardSkeleton } from "../components/skeletons";
import {
  useCreateOfferMutation,
  useDeleteOfferMutation,
  useMyOffersQuery,
  useToggleOfferStatusMutation,
  useUpdateOfferMutation,
} from "../lib/owner-queries";
import type { OwnerOffer } from "../lib/owner-api";

type OfferFormState = {
  type: OwnerOffer["type"];
  title: string;
  shortLabel: string;
  description: string;
  code: string;
  minOrderTk: string;
  discountTk: string;
  discountPercent: string;
  maxDiscountTk: string;
  freeDelivery: boolean;
  isAutoApply: boolean;
  isActive: boolean;
};

const initialOfferForm: OfferFormState = {
  type: "voucher",
  title: "",
  shortLabel: "",
  description: "",
  code: "",
  minOrderTk: "0",
  discountTk: "0",
  discountPercent: "0",
  maxDiscountTk: "0",
  freeDelivery: false,
  isAutoApply: false,
  isActive: true,
};

const offerTypeOptions: Array<{ value: OwnerOffer["type"]; label: string }> = [
  { value: "voucher", label: "Voucher" },
  { value: "threshold_discount", label: "Threshold discount" },
  { value: "free_delivery", label: "Free delivery" },
  { value: "flat_discount", label: "Flat discount" },
  { value: "percentage_discount", label: "Percentage discount" },
];

export function OffersPage() {
  const { data: offersData, isLoading, error } = useMyOffersQuery();
  const createOffer = useCreateOfferMutation();
  const updateOffer = useUpdateOfferMutation();
  const toggleOffer = useToggleOfferStatusMutation();
  const deleteOffer = useDeleteOfferMutation();

  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferFormState>(initialOfferForm);

  const showCouponCode = form.type === "voucher";
  const showFlatDiscount =
    form.type === "voucher" ||
    form.type === "threshold_discount" ||
    form.type === "flat_discount";
  const showDiscountPercent = form.type === "percentage_discount";
  const showMaxDiscount = form.type === "percentage_discount";
  const showFreeDelivery = form.type === "free_delivery";
  const autoApplyLocked =
    form.type === "threshold_discount" || form.type === "free_delivery";

  const offers = useMemo(
    () => (offersData?.offers ?? []).slice().sort((left, right) => left.title.localeCompare(right.title)),
    [offersData?.offers],
  );
  const activeOfferCount = useMemo(
    () => offers.filter((offer) => offer.isActive !== false).length,
    [offers],
  );
  const autoApplyCount = useMemo(
    () => offers.filter((offer) => offer.isAutoApply).length,
    [offers],
  );
  const codeOfferCount = useMemo(
    () => offers.filter((offer) => Boolean(offer.code)).length,
    [offers],
  );

  const isMutating =
    createOffer.isPending ||
    updateOffer.isPending ||
    toggleOffer.isPending ||
    deleteOffer.isPending;

  const resetForm = () => {
    setEditingOfferId(null);
    setForm(initialOfferForm);
  };

  const buildPayload = (): Omit<OwnerOffer, "id"> => ({
    type: form.type,
    title: form.title,
    shortLabel: form.shortLabel,
    description: form.description,
    code: showCouponCode ? form.code : "",
    minOrderTk: Number(form.minOrderTk || 0),
    discountTk: showFlatDiscount ? Number(form.discountTk || 0) : 0,
    discountPercent: showDiscountPercent ? Number(form.discountPercent || 0) : 0,
    maxDiscountTk: showMaxDiscount ? Number(form.maxDiscountTk || 0) : 0,
    freeDelivery: showFreeDelivery ? form.freeDelivery : false,
    isAutoApply: autoApplyLocked ? true : form.isAutoApply,
    isActive: form.isActive,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingOfferId) {
      await updateOffer.mutateAsync({
        offerId: editingOfferId,
        ...buildPayload(),
      });
    } else {
      await createOffer.mutateAsync(buildPayload());
    }

    resetForm();
  };

  const startEdit = (offer: OwnerOffer) => {
    setEditingOfferId(offer.id);
    setForm({
      type: offer.type,
      title: offer.title,
      shortLabel: offer.shortLabel || "",
      description: offer.description || "",
      code: offer.code || "",
      minOrderTk: String(offer.minOrderTk ?? 0),
      discountTk: String(offer.discountTk ?? 0),
      discountPercent: String(offer.discountPercent ?? 0),
      maxDiscountTk: String(offer.maxDiscountTk ?? 0),
      freeDelivery: Boolean(offer.freeDelivery),
      isAutoApply: Boolean(offer.isAutoApply),
      isActive: offer.isActive !== false,
    });
  };

  const currentError =
    createOffer.error instanceof Error
      ? createOffer.error.message
      : updateOffer.error instanceof Error
        ? updateOffer.error.message
        : "";

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Offers management</p>
          <h3>Create real campaigns instead of keeping promo data static</h3>
          <p className="muted">
            Threshold, voucher, flat, percentage, and free delivery offers are
            now owner-managed. Advanced item/category targeting can come in the next pass.
          </p>
        </div>
      </section>

      <section className="stats-grid stats-grid-compact">
        <article className="stat-card">
          <span className="stat-label">Active campaigns</span>
          <strong className="stat-value stat-value-compact">{activeOfferCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Auto-apply offers</span>
          <strong className="stat-value stat-value-compact">{autoApplyCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Code-based promos</span>
          <strong className="stat-value stat-value-compact">{codeOfferCount}</strong>
        </article>
      </section>

      {error ? (
        <article className="card">
          <p className="form-error">
            {error instanceof Error ? error.message : "Unable to load offers."}
          </p>
        </article>
      ) : null}

      <section className="grid-two">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{editingOfferId ? "Edit offer" : "Create offer"}</p>
              <h3>{editingOfferId ? "Update campaign" : "Launch a new campaign"}</h3>
            </div>
            {editingOfferId ? (
              <button className="ghost-button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <CardSkeleton lines={7} />
          ) : (
            <form className="stack-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label className="field">
                  <span>Offer type</span>
                  <select
                    className="select-input"
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as OwnerOffer["type"],
                      }))
                    }
                  >
                    {offerTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Title</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="TK 50 off"
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Short label</span>
                <input
                  value={form.shortLabel}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, shortLabel: event.target.value }))
                  }
                  placeholder="Save on selected orders"
                />
              </label>

              <label className="field">
                  <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Tell the owner team what this campaign is for"
                />
              </label>

              <div className="field-grid">
                {showCouponCode ? (
                  <label className="field">
                    <span>Coupon code</span>
                    <input
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                      }
                      placeholder="YUMMELA"
                    />
                  </label>
                ) : (
                  <div className="field">
                    <span>Coupon code</span>
                    <input value="Not needed for this offer type" disabled />
                  </div>
                )}

                <label className="field">
                  <span>Min order (TK)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderTk}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, minOrderTk: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Flat discount (TK)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.discountTk}
                    disabled={!showFlatDiscount}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, discountTk: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Discount percent</span>
                  <input
                    type="number"
                    min="0"
                    value={form.discountPercent}
                    disabled={!showDiscountPercent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        discountPercent: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Max discount (TK)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscountTk}
                    disabled={!showMaxDiscount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maxDiscountTk: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="toggle-row">
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={form.freeDelivery}
                      disabled={!showFreeDelivery}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          freeDelivery: event.target.checked,
                        }))
                      }
                    />
                    <span>Free delivery</span>
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={autoApplyLocked ? true : form.isAutoApply}
                      disabled={autoApplyLocked}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isAutoApply: event.target.checked,
                        }))
                      }
                    />
                    <span>Auto apply</span>
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }))
                      }
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              {currentError ? <p className="form-error">{currentError}</p> : null}
              <p className="muted">
                {form.type === "threshold_discount"
                  ? "Threshold offers are auto-applied. Coupon code, max discount, and free delivery do not apply here."
                  : form.type === "percentage_discount"
                    ? "Percentage offers use a max discount cap to prevent overly large discounts."
                    : form.type === "free_delivery"
                      ? "Free delivery offers are auto-applied and do not use other discount fields."
                      : "Configure only the fields that match this campaign type."}
              </p>

              <button className="primary-button" type="submit" disabled={isMutating}>
                {editingOfferId ? "Update offer" : "Create offer"}
              </button>
            </form>
          )}
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Campaign notes</p>
              <h3>How to keep offers healthy</h3>
            </div>
          </div>
          <ul className="roadmap-list">
            <li>Use `auto apply` for restaurant-level default campaigns</li>
            <li>Use coupon code when you want customer-entered promos</li>
            <li>Free delivery should stay simple and clearly marked</li>
            <li>Item/category targeting can be added next without breaking this shape</li>
          </ul>
        </article>
      </section>

      <article className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Current campaigns</p>
            <h3>{offers.length} offers in backend</h3>
          </div>
        </div>

        {isLoading ? (
          <CardSkeleton lines={6} />
        ) : offers.length === 0 ? (
          <div className="empty-state">
            <strong>No offers configured yet</strong>
            <p className="muted">
              Create your first campaign from the form above. This already syncs with your backend.
            </p>
          </div>
        ) : (
          <div className="offer-grid">
            {offers.map((offer) => (
              <article key={offer.id} className="offer-card offer-card-rich">
                <div className="menu-card-top">
                  <div>
                    <strong>{offer.title}</strong>
                    <div className="menu-chip-row">
                      <span className="tag-chip">{offer.type}</span>
                      {offer.code ? <span className="tag-chip tag-chip-warm">{offer.code}</span> : null}
                      <span
                        className={
                          offer.isActive !== false
                            ? "status-dot-label"
                            : "status-dot-label status-dot-label-off"
                        }
                      >
                        {offer.isActive !== false ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="offer-copy">
                  {offer.shortLabel || offer.description || "Configured campaign"}
                </p>

                <div className="detail-list compact-list">
                  <div className="detail-row">
                    <span>Minimum order</span>
                    <strong>TK {offer.minOrderTk ?? 0}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Benefit</span>
                    <strong>
                      {offer.freeDelivery
                        ? "Free delivery"
                        : offer.discountPercent
                          ? `${offer.discountPercent}% off`
                          : `TK ${offer.discountTk ?? 0} off`}
                    </strong>
                  </div>
                </div>

                <div className="action-cluster">
                  <button className="ghost-button" onClick={() => startEdit(offer)}>
                    Edit
                  </button>
                  <button
                    className="ghost-button"
                    disabled={isMutating}
                    onClick={() =>
                      void toggleOffer.mutateAsync({
                        offerId: offer.id,
                        isActive: offer.isActive === false,
                      })
                    }
                  >
                    {offer.isActive === false ? "Activate" : "Pause"}
                  </button>
                  <button
                    className="danger-button"
                    disabled={isMutating}
                    onClick={() => void deleteOffer.mutateAsync(offer.id)}
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
