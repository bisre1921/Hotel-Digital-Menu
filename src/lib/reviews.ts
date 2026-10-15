import { z } from "zod";

export const reviewSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters for your name.").max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Write at least 5 characters about your experience.").max(1500),
});
export const reviewPageSchema = z.coerce.number().int().min(1).max(10000);
export const REVIEW_PAGE_SIZE = 5;

export type ReviewsResponse = {
  reviews: { id: string; name: string; rating: number; comment: string; createdAt: string; updatedAt: string }[];
  total: number; average: number | null; page: number; pages: number;
};
