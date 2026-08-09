"use client";

import { FirebasePhoneSignup } from "@/components/auth/FirebasePhoneSignup";

export default function nexusproSignupPage() {
  return (
    <FirebasePhoneSignup
      title="Join Us"
      subtitle="Create an account to track orders and save your details."
      backLink="/templates/nexus-pro"
      loginLink="/templates/nexus-pro/auth/login"
      slug="nexus-pro"
      visualUrl="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2564&auto=format&fit=crop"
    />
  );
}
