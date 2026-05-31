export const wedding = {
  couple: "4J & Yuan",
  coupleChinese: "士杰與慧媛",
  dateDisplay: "2026.10.3",
  dateIso: "2026-10-03",
  rsvpDeadlineDisplay: "2026/7/7",
  rsvpDeadlineIso: "2026-07-07",
  venue: {
    name: "優聖美地",
    mapsUrl: "https://maps.app.goo.gl/kh9wq747YUEJQPMP8",
    mapEmbedUrl: "https://www.google.com/maps?q=%E5%84%AA%E8%81%96%E7%BE%8E%E5%9C%B0%E9%84%89%E6%9D%91%E6%B8%A1%E5%81%87%E5%88%A5%E5%A2%85&z=16&output=embed"
  },
  schedule: [
    {
      time: "16:30",
      title: "證婚",
      titleEn: "Ceremony"
    },
    {
      time: "18:00",
      title: "晚宴入席",
      titleEn: "Dinner"
    },
    {
      time: "20:30",
      title: "結束",
      titleEn: "圓滿結束"
    }
  ],
  copy: {
    opening: "把婚禮做成一個可以走進去的畫面。",
    openingEn: "邀請你走進我們那一天。",
    familyGreeting: "誠摯邀請您，一同見證我們人生中重要的一天。",
    rsvpTitle: "出席回覆",
    rsvpTitleEn: "出席回覆"
  }
} as const;

export type Wedding = typeof wedding;
