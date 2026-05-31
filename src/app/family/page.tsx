import { FamilyExperience } from "@/components/FamilyExperience";

export default function FamilyPage() {
  return <FamilyExperience endpoint={process.env.NEXT_PUBLIC_RSVP_ENDPOINT ?? ""} />;
}
