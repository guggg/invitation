import { FamilyExperience } from "@/components/FamilyExperience";

const LINE_ADD_FRIEND_URL = "https://lin.ee/76OVDl7U";
const LINE_QR_CODE_SRC = "/2dbarcodes_BW/M_gainfriends_2dbarcodes_BW.png";

export default function FamilyPage() {
  return (
    <FamilyExperience
      endpoint={process.env.NEXT_PUBLIC_FAMILY_RSVP_ENDPOINT ?? process.env.NEXT_PUBLIC_RSVP_ENDPOINT ?? ""}
      photoUploadEndpoint={process.env.NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT ?? ""}
      lineAddFriendUrl={LINE_ADD_FRIEND_URL}
      lineQrCodeSrc={LINE_QR_CODE_SRC}
    />
  );
}
