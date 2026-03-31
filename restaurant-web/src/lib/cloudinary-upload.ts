import type { UploadSignatureResponse } from "./owner-api";

export async function uploadImageToCloudinary(
  file: File,
  signature: UploadSignatureResponse,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);
  formData.append("public_id", signature.publicId);

  const response = await fetch(signature.uploadUrl, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Image upload failed.");
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}
