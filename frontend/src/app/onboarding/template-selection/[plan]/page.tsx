import { redirect } from "next/navigation";

// This plan-specific variant offered templates (Aero, Obsidian, Chronos, "Monolith Flagship")
// that were never built and had no working href. The real, working picker lives one level up
// at /onboarding/template-selection and lists only templates that actually exist.
export default function PlanTemplatesPage() {
  redirect("/onboarding/template-selection");
}
