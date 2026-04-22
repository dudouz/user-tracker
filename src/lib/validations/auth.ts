import { z } from "zod";

export const signInSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1).max(200),
  location: z.string().max(500).optional().or(z.literal("")),
  interestedInCommenting: z.boolean().optional(),
  referrerCode: z
    .string()
    .default("")
    .refine(
      (s) => s === "" || /^[a-f0-9A-F]{16}$/i.test(s),
      { message: "Invite code must be 16 characters (0–9, a–f) or left empty" },
    )
    .transform((s) => (s === "" ? undefined : s.toLowerCase())),
});

export const signOutFormSchema = z.object({});

export const inviteSendSchema = z.object({
  to: z.email().max(255),
});

export type SignInInput = z.infer<typeof signInSchema>;
/** Output of signUpSchema (API / session). */
export type SignUpInput = z.infer<typeof signUpSchema>;
/** Raw form values before Zod transform (referrerCode is always a string). */
export type SignUpFieldValues = z.input<typeof signUpSchema>;
export type SignOutFormInput = z.infer<typeof signOutFormSchema>;
export type InviteSendInput = z.infer<typeof inviteSendSchema>;
