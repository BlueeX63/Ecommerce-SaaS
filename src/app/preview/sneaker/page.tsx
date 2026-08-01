import SneakerExperience from "@/components/3d/SneakerExperience";

export const metadata = {
  title: "Air Max Infinity - Future of Comfort",
  description: "Experience the next generation of luxury sneakers.",
};

export default function SneakerLandingPage() {
  return (
    <main className="w-full min-h-screen bg-[#fafafa]">
      <SneakerExperience />
    </main>
  );
}
