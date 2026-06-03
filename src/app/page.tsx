import { FriendsExperience } from "@/components/FriendsExperience";

export default function HomePage() {
  return (
    <FriendsExperience
      endpoint={process.env.NEXT_PUBLIC_RSVP_ENDPOINT ?? ""}
      photoUploadEndpoint={process.env.NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT ?? ""}
    />
  );
}
