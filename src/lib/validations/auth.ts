import { z } from "zod";

export const signInSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1).max(200),
  location: z.string().max(500).optional().or(z.literal("")),
  interestedInCommenting: z.boolean().optional(),
});

export const signOutFormSchema = z.object({});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignOutFormInput = z.infer<typeof signOutFormSchema>;
