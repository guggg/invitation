import { FriendsExperience } from "@/components/FriendsExperience";

const LINE_ADD_FRIEND_URL = "https://lin.ee/76OVDl7U";
const LINE_QR_CODE_SRC = "/2dbarcodes_BW/M_gainfriends_2dbarcodes_BW.png";

export default function HomePage() {
  return (
    <FriendsExperience
      endpoint={process.env.NEXT_PUBLIC_RSVP_ENDPOINT ?? ""}
      lineAddFriendUrl={LINE_ADD_FRIEND_URL}
      lineQrCodeSrc={LINE_QR_CODE_SRC}
      photoUploadEndpoint={process.env.NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT ?? ""}
    />
  );
}
