import { useEffect, useRef, useState } from "react";

import { CardSkeleton } from "../components/skeletons";
import { uploadImageToCloudinary } from "../lib/cloudinary-upload";
import {
  useCreateRestaurantMutation,
  useCreateUploadSignatureMutation,
  useMyRestaurantQuery,
  useUpdateMyRestaurantMutation,
} from "../lib/owner-queries";

type RestaurantFormState = {
  name: string;
  cuisine: string;
  address: string;
  heroTitle: string;
  heroSubtitle: string;
  priceLevel: string;
  tags: string;
  coverImage: string;
  logoImage: string;
  defaultPrepMinMinutes: string;
  defaultPrepMaxMinutes: string;
};

const initialCreateForm = {
  name: "",
  cuisine: "",
  address: "",
  latitude: "24.8766388",
  longitude: "90.7250937",
};

const initialRestaurantForm: RestaurantFormState = {
  name: "",
  cuisine: "",
  address: "",
  heroTitle: "",
  heroSubtitle: "",
  priceLevel: "$$",
  tags: "",
  coverImage: "",
  logoImage: "",
  defaultPrepMinMinutes: "15",
  defaultPrepMaxMinutes: "20",
};

export function RestaurantPage() {
  const { data: restaurant, isLoading, error } = useMyRestaurantQuery();
  const createRestaurant = useCreateRestaurantMutation();
  const updateRestaurant = useUpdateMyRestaurantMutation();
  const createUploadSignature = useCreateUploadSignatureMutation();

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState<RestaurantFormState>(initialRestaurantForm);
  const [uploadError, setUploadError] = useState("");
  const [uploadingField, setUploadingField] = useState<"coverImage" | "logoImage" | null>(null);

  useEffect(() => {
    if (!restaurant) {
      return;
    }

    setEditForm({
      name: restaurant.name || "",
      cuisine: restaurant.cuisine || "",
      address: restaurant.address || "",
      heroTitle: restaurant.heroTitle || "",
      heroSubtitle: restaurant.heroSubtitle || "",
      priceLevel: restaurant.priceLevel || "$$",
      tags: (restaurant.tags ?? []).join(", "),
      coverImage: restaurant.coverImage || "",
      logoImage: restaurant.logoImage || "",
      defaultPrepMinMinutes: String(restaurant.defaultPrepMinMinutes || 15),
      defaultPrepMaxMinutes: String(restaurant.defaultPrepMaxMinutes || 20),
    });
  }, [restaurant]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createRestaurant.mutateAsync({
      name: createForm.name,
      cuisine: createForm.cuisine,
      address: createForm.address,
      latitude: Number(createForm.latitude),
      longitude: Number(createForm.longitude),
    });
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError("");

    await updateRestaurant.mutateAsync({
      name: editForm.name,
      cuisine: editForm.cuisine,
      address: editForm.address,
      heroTitle: editForm.heroTitle,
      heroSubtitle: editForm.heroSubtitle,
      priceLevel: editForm.priceLevel,
      coverImage: editForm.coverImage,
      logoImage: editForm.logoImage,
      defaultPrepMinMinutes: Number(editForm.defaultPrepMinMinutes),
      defaultPrepMaxMinutes: Number(editForm.defaultPrepMaxMinutes),
      tags: editForm.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    });
  };

  const handleUpload = async (
    field: "coverImage" | "logoImage",
    scope: "restaurant-cover" | "restaurant-logo",
    file?: File,
  ) => {
    if (!file) {
      return;
    }

    setUploadError("");
    setUploadingField(field);

    try {
      const signature = await createUploadSignature.mutateAsync({
        scope,
        entityId: restaurant?._id,
      });
      const upload = await uploadImageToCloudinary(file, signature);

      setEditForm((current) => ({
        ...current,
        [field]: upload.secureUrl,
      }));

      await updateRestaurant.mutateAsync({
        [field]: upload.secureUrl,
      });
    } catch (uploadIssue) {
      setUploadError(
        uploadIssue instanceof Error
          ? uploadIssue.message
          : "Unable to upload the image right now.",
      );
    } finally {
      setUploadingField(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Restaurant setup</p>
          <h3>One owner, one restaurant</h3>
          <p className="muted">
            Profile media now supports Cloudinary signed uploads, so logo and cover images stay backend-safe.
          </p>
        </div>
      </section>

      <section className="grid-two">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Current restaurant</p>
              <h3>{restaurant?.name || "No restaurant yet"}</h3>
            </div>
          </div>

          {isLoading ? (
            <CardSkeleton lines={6} />
          ) : restaurant ? (
            <div className="detail-list">
              <div className="restaurant-media-grid">
                <div className="media-block">
                  <span className="muted-small">Cover image</span>
                  {editForm.coverImage ? (
                    <img
                      className="media-preview media-preview-cover"
                      src={editForm.coverImage}
                      alt="Restaurant cover"
                    />
                  ) : (
                    <div className="media-placeholder media-preview-cover">No cover image</div>
                  )}
                </div>

                <div className="media-block">
                  <span className="muted-small">Logo image</span>
                  {editForm.logoImage ? (
                    <img
                      className="media-preview media-preview-logo"
                      src={editForm.logoImage}
                      alt="Restaurant logo"
                    />
                  ) : (
                    <div className="media-placeholder media-preview-logo">No logo image</div>
                  )}
                </div>
              </div>

              <div className="detail-row">
                <span>Key</span>
                <strong>{restaurant.key}</strong>
              </div>
              <div className="detail-row">
                <span>Cuisine</span>
                <strong>{restaurant.cuisine}</strong>
              </div>
              <div className="detail-row">
                <span>Address</span>
                <strong>{restaurant.address}</strong>
              </div>
              <div className="detail-row">
                <span>Menu items</span>
                <strong>{restaurant.menuItems.length}</strong>
              </div>
              <div className="detail-row">
                <span>Offers</span>
                <strong>{restaurant.offers.length}</strong>
              </div>
              <div className="detail-row">
                <span>Default prep time</span>
                <strong>
                  {restaurant.defaultPrepMinMinutes}-{restaurant.defaultPrepMaxMinutes} min
                </strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>Create your restaurant profile</strong>
              <p className="muted">
                This is the first step before menu, offers, and real live orders.
              </p>
            </div>
          )}

          {error ? (
            <p className="form-error">
              {error instanceof Error ? error.message : "Unable to load restaurant."}
            </p>
          ) : null}
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{restaurant ? "Profile settings" : "Create restaurant"}</p>
              <h3>{restaurant ? "Update restaurant profile" : "Owner bootstrap form"}</h3>
            </div>
          </div>

          {restaurant ? (
            <form className="stack-form" onSubmit={handleSaveProfile}>
              <div className="restaurant-media-grid">
                <div className="media-card">
                  <div className="media-card-copy">
                    <strong>Cover image</strong>
                    <span className="muted-small">This appears on restaurant cards and the details hero.</span>
                  </div>
                  <input
                    ref={coverInputRef}
                    className="hidden-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void handleUpload("coverImage", "restaurant-cover", event.target.files?.[0])
                    }
                  />
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={uploadingField === "coverImage"}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingField === "coverImage" ? "Uploading..." : "Upload cover"}
                  </button>
                </div>

                <div className="media-card">
                  <div className="media-card-copy">
                    <strong>Logo image</strong>
                    <span className="muted-small">Smaller visual for cards and future receipts.</span>
                  </div>
                  <input
                    ref={logoInputRef}
                    className="hidden-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void handleUpload("logoImage", "restaurant-logo", event.target.files?.[0])
                    }
                  />
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={uploadingField === "logoImage"}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploadingField === "logoImage" ? "Uploading..." : "Upload logo"}
                  </button>
                </div>
              </div>

              <label className="field">
                <span>Restaurant name</span>
                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </label>

              <div className="field-grid">
                <label className="field">
                  <span>Cuisine</span>
                  <input
                    value={editForm.cuisine}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, cuisine: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="field">
                  <span>Price level</span>
                  <input
                    value={editForm.priceLevel}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, priceLevel: event.target.value }))
                    }
                    placeholder="$$"
                  />
                </label>
              </div>

              <label className="field">
                <span>Address</span>
                <textarea
                  value={editForm.address}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, address: event.target.value }))
                  }
                  rows={3}
                  required
                />
              </label>

              <label className="field">
                <span>Hero title</span>
                <input
                  value={editForm.heroTitle}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, heroTitle: event.target.value }))
                  }
                  placeholder="Fresh pizza near you"
                />
              </label>

              <label className="field">
                <span>Hero subtitle</span>
                <textarea
                  value={editForm.heroSubtitle}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, heroSubtitle: event.target.value }))
                  }
                  rows={3}
                  placeholder="Tell customers why this restaurant is special."
                />
              </label>

              <label className="field">
                <span>Tags</span>
                <input
                  value={editForm.tags}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder="Popular, Fast delivery, Family meal"
                />
              </label>

              <div className="field-grid">
                <label className="field">
                  <span>Default prep min (minutes)</span>
                  <input
                    type="number"
                    min="1"
                    value={editForm.defaultPrepMinMinutes}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        defaultPrepMinMinutes: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Default prep max (minutes)</span>
                  <input
                    type="number"
                    min="1"
                    value={editForm.defaultPrepMaxMinutes}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        defaultPrepMaxMinutes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {uploadError ? <p className="form-error">{uploadError}</p> : null}
              {updateRestaurant.error ? (
                <p className="form-error">
                  {updateRestaurant.error instanceof Error
                    ? updateRestaurant.error.message
                    : "Unable to update restaurant."}
                </p>
              ) : null}

              <button
                className="primary-button"
                type="submit"
                disabled={updateRestaurant.isPending || uploadingField !== null}
              >
                {updateRestaurant.isPending ? "Saving..." : "Save restaurant profile"}
              </button>
            </form>
          ) : (
            <form className="stack-form" onSubmit={handleCreate}>
              <label className="field">
                <span>Restaurant name</span>
                <input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Tasty Oven"
                  required
                />
              </label>
              <label className="field">
                <span>Cuisine</span>
                <input
                  value={createForm.cuisine}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, cuisine: event.target.value }))
                  }
                  placeholder="Pizza"
                  required
                />
              </label>
              <label className="field">
                <span>Address</span>
                <textarea
                  value={createForm.address}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, address: event.target.value }))
                  }
                  placeholder="Mymensingh Road, Near Town Hall"
                  rows={3}
                  required
                />
              </label>
              <div className="field-grid">
                <label className="field">
                  <span>Latitude</span>
                  <input
                    value={createForm.latitude}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, latitude: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Longitude</span>
                  <input
                    value={createForm.longitude}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, longitude: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              {createRestaurant.error ? (
                <p className="form-error">
                  {createRestaurant.error instanceof Error
                    ? createRestaurant.error.message
                    : "Unable to create restaurant."}
                </p>
              ) : null}

              <button
                className="primary-button"
                type="submit"
                disabled={createRestaurant.isPending}
              >
                {createRestaurant.isPending ? "Creating..." : "Create restaurant"}
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}
