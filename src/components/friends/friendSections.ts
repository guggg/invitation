import type { WeddingPhoto } from "@/lib/photos";

export type FriendSection = {
  id: string;
  label: string;
  title: string;
};

export const friendSections: FriendSection[] = [
  { id: "opening", label: "開場", title: "Yuan & 4J" },
  { id: "signal", label: "邀請", title: "給你的一句話" },
  { id: "schedule", label: "流程", title: "10 月 3 日" },
  { id: "venue", label: "地點", title: "優聖美地" },
  { id: "gallery", label: "照片", title: "婚禮之前" },
  { id: "rsvp", label: "回覆", title: "告訴我們你會不會來" },
  { id: "finale", label: "那天見", title: "2026.10.3" }
];

export type GalleryProject = {
  id: string;
  title: string;
  titleAlt: string;
  tags: string[];
  mood: string;
  photo: WeddingPhoto;
};

export function createGalleryProjects(photos: WeddingPhoto[]): GalleryProject[] {
  return [
    {
      id: "before-vows",
      title: "婚禮之前",
      titleAlt: "在那天以前",
      tags: ["婚紗照", "安靜的一刻", "邀請你來"],
      mood: "把時間先停在婚禮前一刻。",
      photo: photos[1] ?? photos[0]
    },
    {
      id: "river-walk",
      title: "河岸邊的一天",
      titleAlt: "一起散步",
      tags: ["一起散步", "笑場", "我們"],
      mood: "不是擺拍，是一起往前走。",
      photo: photos[8] ?? photos[0]
    },
    {
      id: "garden-air",
      title: "花園裡的我們",
      titleAlt: "那天的花",
      tags: ["花園", "十月", "優聖美地"],
      mood: "希望那天的花園，也有你在。",
      photo: photos[4] ?? photos[0]
    },
    {
      id: "soft-noise",
      title: "溫柔的一刻",
      titleAlt: "有光的地方",
      tags: ["自然光", "靠近一點", "慢慢看"],
      mood: "把那天的溫柔，先放在這裡。",
      photo: photos[6] ?? photos[0]
    },
    {
      id: "reply-card",
      title: "等你一起來",
      titleAlt: "最後一張，留給你",
      tags: ["出席回覆", "婚禮名單", "等你來"],
      mood: "最後，告訴我們你會不會來。",
      photo: photos[7] ?? photos[0]
    }
  ];
}
