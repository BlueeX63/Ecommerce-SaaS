"use client";

import { FirebasePhoneSignup } from "@/components/auth/FirebasePhoneSignup";

export default function essenceSignupPage() {
  return (
    <FirebasePhoneSignup
      title="Sign Up"
      subtitle="Create an account to track orders and save your details."
      backLink="/templates/essence"
      loginLink="/templates/essence/auth/login"
      slug="essence"
      visualUrl="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2564&auto=format&fit=crop"
    />
  );
}
