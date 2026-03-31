const { AppError } = require("../../common/utils/app-error");
const { User } = require("../users/user.model");
const { Address } = require("./address.model");

const MAX_SAVED_ADDRESSES = 3;

function normalizeLocationPayload(payload) {
  const label = payload.label?.trim();
  const subtitle = payload.subtitle?.trim();
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!label || !subtitle) {
    throw new AppError("Label and subtitle are required", 400);
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError("Valid latitude and longitude are required", 400);
  }

  return {
    label,
    subtitle,
    latitude,
    longitude,
  };
}

function toClientLocation(location) {
  const coordinates = location?.location?.coordinates ?? [0, 0];

  return {
    latitude: coordinates[1] ?? 0,
    longitude: coordinates[0] ?? 0,
    label: location?.label ?? "",
    subtitle: location?.subtitle ?? "",
    savedAddressId: location?.savedAddressId ? String(location.savedAddressId) : null,
    updatedAt: location?.updatedAt ?? null,
  };
}

function toClientAddress(address, selectedAddressId) {
  const coordinates = address.location?.coordinates ?? [0, 0];

  return {
    id: String(address._id),
    name: address.name,
    label: address.label,
    subtitle: address.subtitle,
    latitude: coordinates[1] ?? 0,
    longitude: coordinates[0] ?? 0,
    isSelected: String(address._id) === selectedAddressId,
  };
}

async function listAddresses(userId) {
  const [user, addresses] = await Promise.all([
    User.findById(userId).lean(),
    Address.find({
      userId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const selectedAddressId = user.selectedDeliveryLocation?.savedAddressId
    ? String(user.selectedDeliveryLocation.savedAddressId)
    : null;

  return {
    selectedDeliveryLocation: user.selectedDeliveryLocation
      ? toClientLocation(user.selectedDeliveryLocation)
      : null,
    currentDeviceLocation: user.currentDeviceLocation
      ? toClientLocation(user.currentDeviceLocation)
      : null,
    addresses: addresses.map((address) =>
      toClientAddress(address, selectedAddressId),
    ),
    maxSavedAddresses: MAX_SAVED_ADDRESSES,
  };
}

async function createAddress(userId, payload) {
  const name = payload.name?.trim();

  if (!name) {
    throw new AppError("Place name is required", 400);
  }

  const totalAddresses = await Address.countDocuments({
    userId,
    isDeleted: false,
  });

  if (totalAddresses >= MAX_SAVED_ADDRESSES) {
    throw new AppError(
      `You can save up to ${MAX_SAVED_ADDRESSES} addresses only`,
      400,
    );
  }

  const normalized = normalizeLocationPayload(payload);
  const address = await Address.create({
    userId,
    name,
    label: normalized.label,
    subtitle: normalized.subtitle,
    location: {
      type: "Point",
      coordinates: [normalized.longitude, normalized.latitude],
    },
  });

  return toClientAddress(address, null);
}

async function updateAddress(userId, addressId, payload) {
  const address = await Address.findOne({
    _id: addressId,
    userId,
    isDeleted: false,
  });

  if (!address) {
    throw new AppError("Saved address not found", 404);
  }

  const normalized = normalizeLocationPayload(payload);
  address.name = payload.name?.trim() || address.name;
  address.label = normalized.label;
  address.subtitle = normalized.subtitle;
  address.location = {
    type: "Point",
    coordinates: [normalized.longitude, normalized.latitude],
  };
  await address.save();

  return toClientAddress(address, null);
}

async function removeAddress(userId, addressId) {
  const address = await Address.findOne({
    _id: addressId,
    userId,
    isDeleted: false,
  });

  if (!address) {
    throw new AppError("Saved address not found", 404);
  }

  await Address.updateOne(
    { _id: addressId },
    {
      $set: {
        isDeleted: true,
      },
    },
  );

  await User.updateOne(
    {
      _id: userId,
      "selectedDeliveryLocation.savedAddressId": addressId,
    },
    {
      $set: {
        "selectedDeliveryLocation.savedAddressId": null,
      },
    },
  );
}

async function updateSelectedDeliveryLocation(userId, payload) {
  const normalized = normalizeLocationPayload(payload);
  let savedAddressId = null;

  if (payload.addressId) {
    const address = await Address.findOne({
      _id: payload.addressId,
      userId,
      isDeleted: false,
    }).lean();

    if (!address) {
      throw new AppError("Saved address not found", 404);
    }

    savedAddressId = address._id;
  }

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        selectedDeliveryLocation: {
          label: normalized.label,
          subtitle: normalized.subtitle,
          location: {
            type: "Point",
            coordinates: [normalized.longitude, normalized.latitude],
          },
          savedAddressId,
          updatedAt: new Date(),
        },
      },
    },
  );

  const user = await User.findById(userId).lean();
  return user?.selectedDeliveryLocation
    ? toClientLocation(user.selectedDeliveryLocation)
    : null;
}

async function updateCurrentDeviceLocation(userId, payload) {
  const normalized = normalizeLocationPayload(payload);

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        currentDeviceLocation: {
          label: normalized.label,
          subtitle: normalized.subtitle,
          location: {
            type: "Point",
            coordinates: [normalized.longitude, normalized.latitude],
          },
          updatedAt: new Date(),
        },
      },
    },
  );

  const user = await User.findById(userId).lean();
  return user?.currentDeviceLocation
    ? toClientLocation(user.currentDeviceLocation)
    : null;
}

module.exports = {
  createAddress,
  listAddresses,
  MAX_SAVED_ADDRESSES,
  removeAddress,
  updateAddress,
  updateCurrentDeviceLocation,
  updateSelectedDeliveryLocation,
};
