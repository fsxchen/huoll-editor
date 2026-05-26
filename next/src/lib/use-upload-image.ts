"use client";

import { useCallback } from "react";

/**
 * Return a base64 data URL for the given file.
 * This is a pure-client operation — no server upload.
 */
export function useUploadImage() {
  const upload = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  return { upload };
}
