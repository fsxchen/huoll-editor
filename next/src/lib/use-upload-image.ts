"use client";

import { useCallback } from "react";
import { useStore } from "@/lib/store";
import { uploadImage } from "@/lib/api/upload";

/**
 * Upload images to the back-end when the user is authenticated.
 * Falls back to base64 data URLs when offline / not logged in.
 */
export function useUploadImage() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      if (!isAuthenticated) {
        // Offline fallback: return base64 data URL
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      const res = await uploadImage(file);
      return res.url;
    },
    [isAuthenticated],
  );

  return { upload };
}
