import { isAuthConfigured } from "@/lib/auth/server";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const authEnabled = isAuthConfigured();

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your NuxWell account
          </p>
        </div>
        <SignInForm authEnabled={authEnabled} />
      </div>
    </main>
  );
}
