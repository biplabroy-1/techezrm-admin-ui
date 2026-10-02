import { api } from '../config';

/**
 * Object-storage uploads.
 *
 * WHY A STANDALONE UPLOAD INSTEAD OF POSTING FILES WITH THE PRODUCT
 * ----------------------------------------------------------------
 * `PUT /private/products/:id` does accept multipart, and multer is configured for
 * `bannerImage` and `images`. But the server applies the uploaded files like this:
 *
 *   if (uploaded.bannerImage?.[0]) product.bannerImage = uploaded.bannerImage[0]
 *   if (uploaded.images?.length)   product.images      = uploaded.images
 *
 * so an uploaded `images` file set REPLACES the whole array rather than adding to
 * it. A product that already has four images, where the admin uploads one more,
 * would come back with just that one. And the retained images are URLs on the
 * object store - there is no file to re-send for them.
 *
 * So: upload each file first, take the URL back, and keep sending the complete
 * final list of URLs with the product write. The product write's semantics are
 * then unchanged, and "add an image" and "replace an image" both work.
 *
 * Endpoints, both authenticated, both under /private/upload:
 *   POST /single-cloud    field `file`   -> { data: { file: { url, key, ... } } }
 *   POST /multiple-cloud  field `files`  -> { data: { files: [{ url, key, ... }] } }
 */

export interface UploadedFile {
  key: string;
  filename: string;
  mimetype?: string;
  size?: number;
  url: string;
}

/** Raise an error that actually says what went wrong. */
function messageFrom(error: any): string {
  // The response interceptor rejects with the response BODY ({success, message}),
  // not an axios error, so error.response is usually absent here.
  return (
    error?.message ||
    error?.response?.data?.message ||
    error?.error ||
    'Upload failed'
  );
}

export const uploadService = {
  /** One file. Resolves to its public URL. */
  async uploadSingle(file: File): Promise<UploadedFile> {
    const body = new FormData();
    body.append('file', file);

    try {
      const response = await api.post('/private/upload/single-cloud', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = response.data?.data?.file;
      if (!uploaded?.url) {
        throw new Error('The upload succeeded but returned no URL.');
      }
      return uploaded as UploadedFile;
    } catch (error: any) {
      throw new Error(messageFrom(error));
    }
  },

  /** Several files at once. Resolves to their public URLs, in upload order. */
  async uploadMultiple(files: File[]): Promise<UploadedFile[]> {
    if (files.length === 0) return [];
    // The route caps this at 10 (multer `upload.array("files", 10)`); asking for
    // more gets the whole request rejected, so send in batches rather than
    // failing after the admin has already picked twelve files.
    const BATCH = 10;
    const out: UploadedFile[] = [];

    for (let i = 0; i < files.length; i += BATCH) {
      const batch = files.slice(i, i + BATCH);
      const body = new FormData();
      batch.forEach((f) => body.append('files', f));

      try {
        const response = await api.post('/private/upload/multiple-cloud', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploaded = response.data?.data?.files ?? [];
        if (uploaded.length !== batch.length) {
          throw new Error(
            `Uploaded ${uploaded.length} of ${batch.length} files.`
          );
        }
        out.push(...(uploaded as UploadedFile[]));
      } catch (error: any) {
        throw new Error(messageFrom(error));
      }
    }

    return out;
  },
};

export default uploadService;