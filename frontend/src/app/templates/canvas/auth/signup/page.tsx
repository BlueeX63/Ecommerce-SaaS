"use client";

import { FirebasePhoneSignup } from "@/components/auth/FirebasePhoneSignup";

export default function canvasSignupPage() {
  return (
    <FirebasePhoneSignup
      title="Create Canvas Account"
      subtitle="Create an account to track orders and save your details."
      backLink="/templates/canvas"
      loginLink="/templates/canvas/auth/login"
      slug="canvas"
      visualUrl="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2564&auto=format&fit=crop"
    />
  );
}
