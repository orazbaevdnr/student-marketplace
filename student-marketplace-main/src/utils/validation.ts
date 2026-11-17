export function isValidEmail(email: string): boolean {
  if (!email) return false;
  // Standard permissive email regex (no domain restriction as required)
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validateLength(
  value: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  const len = value.trim().length;
  if (len < min) {
    return { valid: false, error: `Must be at least ${min} characters` };
  }
  if (len > max) {
    return { valid: false, error: `Must be no more than ${max} characters` };
  }
  return { valid: true };
}

export interface ListingDraft {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  contact: string;
}

export interface ListingDraftErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  condition?: string;
  contact?: string;
}

/**
 * Pure listing validation shared by the form and the unit tests. Messages are
 * the same ones the form has always shown.
 */
export function validateListingDraft(draft: ListingDraft): ListingDraftErrors {
  const errors: ListingDraftErrors = {};

  const titleCheck = validateLength(draft.title, 3, 120);
  if (!titleCheck.valid) {
    errors.title = titleCheck.error || 'Title must be 3-80 characters';
  }

  if (draft.description.trim()) {
    const descCheck = validateLength(draft.description, 1, 2000);
    if (!descCheck.valid) {
      errors.description = descCheck.error || 'Description must be at most 2000 characters';
    }
  }

  const numPrice = Number(draft.price);
  if (draft.price === '' || isNaN(numPrice) || numPrice < 1) {
    errors.price = 'Please enter a price of 1 or higher';
  }

  if (!draft.category) {
    errors.category = 'Please select a category';
  }

  if (!draft.condition) {
    errors.condition = 'Please select an item condition';
  }

  if (!draft.contact.trim()) {
    errors.contact = 'Please provide a contact method (Telegram handle or email)';
  }

  return errors;
}

/**
 * Resizes an image file if it exceeds maxDimension and converts it to a JPEG data URL.
 * Protects localStorage quota in mock mode.
 */
export async function resizeImageToDataUrl(
  file: File,
  maxDimension = 1024,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Please upload JPG, PNG, or WebP images only.'));
      return;
    }

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image file must be under 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to process image canvas.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
