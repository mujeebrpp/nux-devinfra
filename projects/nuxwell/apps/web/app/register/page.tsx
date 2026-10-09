import { isAuthConfigured } from "@/lib/auth/server";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  const authEnabled = isAuthConfigured();

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join NuxWell — it takes a minute
          </p>
        </div>
        <SignUpForm authEnabled={authEnabled} />
      </div>
    </main>
  );
}
