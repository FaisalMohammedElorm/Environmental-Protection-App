import { cloudinary } from "../config/cloudinary";
import { ApiError } from "../utils/ApiError";

export async function uploadImageBuffer(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(ApiError.internal("Image upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function uploadReportImages(files: Express.Multer.File[]): Promise<string[]> {
  return Promise.all(files.map((file) => uploadImageBuffer(file.buffer, "ecoalert/reports")));
}
