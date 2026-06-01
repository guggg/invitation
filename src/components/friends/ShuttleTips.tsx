const tips = [
  { icon: "🚐", text: "我們已規劃 2–3 台接駁車，實際班次與時間會依出席人數確認，到時候會再通知你。" },
  { icon: "🕙", text: "請於發車前 10 分鐘抵達上車點" },
  { icon: "📍", text: "上車點：新店捷運總站" },
  { icon: "👥", text: "每車 20 人，坐滿即發車" },
  { icon: "🙋", text: "找不到車？請洽現場招待人員" }
];

export function ShuttleTips() {
  return (
    <div className="shuttle-tips-card" aria-label="接駁車注意事項">
      <p className="shuttle-tips-heading">溫馨提醒</p>
      <ul className="shuttle-tips-list">
        {tips.map((tip) => (
          <li key={tip.text} className="shuttle-tips-item">
            <span className="shuttle-tips-icon" aria-hidden="true">{tip.icon}</span>
            <span>{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
