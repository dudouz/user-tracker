import type { UseFormReturn } from "react-hook-form";

import type { SignUpFieldValues, SignUpInput } from "@/lib/validations/auth";

/** Shared RHF instance handed down to each wizard step. */
export type SignUpFormApi = UseFormReturn<SignUpFieldValues, unknown, SignUpInput>;
