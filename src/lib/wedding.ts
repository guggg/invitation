export type ShuttleTrip = {
  id: string;
  vehicle: string;
  group: "outbound-1" | "outbound-2" | "return-1" | "return-2";
  departTime: string; // HH:MM
  arriveTime: string; // HH:MM
  from: string;
  to: string;
  note: string;
  capacity: number;
};

export const shuttleTrips: readonly ShuttleTrip[] = [
  // Outbound — Round 1
  {
    id: "out-a1",
    vehicle: "A1 車",
    group: "outbound-1",
    departTime: "15:45",
    arriveTime: "16:00",
    from: "新店捷運總站",
    to: "優聖美地",
    note: "莊園一開門即進場，首批證婚賓客",
    capacity: 20
  },
  {
    id: "out-b1",
    vehicle: "B1 車",
    group: "outbound-1",
    departTime: "15:55",
    arriveTime: "16:10",
    from: "新店捷運總站",
    to: "優聖美地",
    note: "證婚賓客，可參與完整迎賓活動、享用點心",
    capacity: 20
  },
  {
    id: "out-c1",
    vehicle: "C1 車",
    group: "outbound-1",
    departTime: "16:05",
    arriveTime: "16:20",
    from: "新店捷運總站",
    to: "優聖美地",
    note: "證婚賓客，16:30 證婚儀式前最後就座",
    capacity: 20
  },
  // Outbound — Round 2
  {
    id: "out-a2",
    vehicle: "A2 車",
    group: "outbound-2",
    departTime: "16:25",
    arriveTime: "16:40",
    from: "新店捷運總站",
    to: "優聖美地",
    note: "晚宴賓客（抵達時證婚進行中，可外圍觀禮或至迎賓活動區）",
    capacity: 20
  },
  {
    id: "out-b2",
    vehicle: "B2 車",
    group: "outbound-2",
    departTime: "16:35",
    arriveTime: "16:50",
    from: "新店捷運總站",
    to: "優聖美地",
    note: "晚宴賓客（證婚後半段抵達，參與證婚大合照）",
    capacity: 20
  },
  {
    id: "out-c2",
    vehicle: "C2 車",
    group: "outbound-2",
    departTime: "17:15",
    arriveTime: "17:30",
    from: "新店捷運總站",
    to: "優聖美地",
    note: "純晚宴賓客（距 18:00 開餐半小時抵達，時間最完美）",
    capacity: 20
  },
  // Return — Round 1
  {
    id: "ret-1",
    vehicle: "A1·B1·C1 車",
    group: "return-1",
    departTime: "20:25",
    arriveTime: "20:40",
    from: "優聖美地",
    to: "新店捷運總站",
    note: "【首波撤場】晚宴結束，首波散場賓客",
    capacity: 60
  },
  // Return — Round 2
  {
    id: "ret-2",
    vehicle: "A2·B2·C2 車",
    group: "return-2",
    departTime: "20:50",
    arriveTime: "21:05",
    from: "優聖美地",
    to: "新店捷運總站",
    note: "【幸福收尾班】陪伴新人走到婚禮最後一刻的至親好友",
    capacity: 60
  }
] as const;

export const wedding = {
  couple: "4J & Yuan",
  coupleChinese: "士杰與慧媛",
  dateDisplay: "2026.10.3",
  dateIso: "2026-10-03",
  dateTimeIso: "2026-10-03T16:30:00+08:00",
  rsvpDeadlineDisplay: "2026/7/7",
  rsvpDeadlineIso: "2026-07-07",
  dressCode: {
    title: "極簡大地",
    subtitle: "戶外半正式，中性率性、低調時髦",
    palette: [
      { name: "灰米色", hex: "#B5B0A1", note: "俐落襯衫或外套都很適合。" },
      { name: "裸米色", hex: "#E3D3C4", note: "柔和、乾淨，也很襯山林光線。" },
      { name: "沙色", hex: "#D8CFC4", note: "低調耐看，適合洋裝或成套穿搭。" },
      { name: "灰褐色", hex: "#A59C94", note: "中性穩重，讓剪裁感更明顯。" },
      { name: "燕麥灰", hex: "#CFCAC2", note: "溫柔但不甜，和戶外場地很合拍。" }
    ],
    guidance:
      "帶有俐落剪裁的襯衫、挺括洋裝或西裝套裝都很合適。由於場地被美麗的山林綠意環繞，建議搭配能自在漫步於莊園步道間的平底鞋或粗跟鞋喔！",
    avoid: [
      "全白裝扮（偷偷把這天唯一的白留給新娘吧）",
      "過度搶眼的螢光色系",
      "拖鞋",
      "太過休閒的破洞牛仔褲"
    ]
  },
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
      title: "圓滿結束",
      titleEn: "Let’s call it a night!"
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
