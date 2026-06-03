import { FamilyExperience } from "@/components/FamilyExperience";

export default function FamilyPage() {
  return (
    <FamilyExperience
      endpoint={process.env.NEXT_PUBLIC_FAMILY_RSVP_ENDPOINT ?? process.env.NEXT_PUBLIC_RSVP_ENDPOINT ?? ""}
      photoUploadEndpoint={process.env.NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT ?? ""}
    />
  );
}
