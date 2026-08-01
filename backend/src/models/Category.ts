import { Schema, model, type Document, type Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 60 },
    slug: { type: String, unique: true },
    description: { type: String, maxlength: 300 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.pre("validate", function generateSlug(next) {
  if (this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

export const Category: Model<ICategory> = model<ICategory>("Category", categorySchema);
