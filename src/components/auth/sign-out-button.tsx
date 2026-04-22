"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { useSignOutMutation } from "@/hooks/auth-mutations";
import { signOutFormSchema, type SignOutFormInput } from "@/lib/validations/auth";

export function SignOutButton() {
  const signOut = useSignOutMutation();
  const { handleSubmit, formState: { isSubmitting } } = useForm<SignOutFormInput>({
    resolver: zodResolver(signOutFormSchema),
    defaultValues: {},
  });
  const pending = isSubmitting;

  return (
    <form
      className="m-0 inline p-0"
      onSubmit={handleSubmit(async () => {
        await signOut.mutateAsync();
      })}
    >
      <Button
        type="submit"
        variant="ghost"
        className="h-auto p-0 text-xs/relaxed"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <span aria-hidden>…</span>
            <span className="sr-only">Signing out, please wait</span>
          </>
        ) : (
          "Log out"
        )}
      </Button>
    </form>
  );
}
