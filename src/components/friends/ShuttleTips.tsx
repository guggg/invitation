const tips = [
  { icon: "🚐", text: "場地停車位非常有限，如果可以的話，真心推薦優先搭乘接駁車。" },
  { icon: "🛣️", text: "山路比市區更考驗駕駛，搭接駁車上山會更輕鬆，也不用分神找停車位。" },
  { icon: "🥂", text: "回程也更安心，不用擔心晚宴後還要自己開車下山。" },
  { icon: "🕙", text: "請於發車前 10 分鐘抵達上車點" },
  { icon: "📍", text: "上車點：新店捷運總站" },
  { icon: "👥", text: "實際班次與時間會依回覆人數確認，到時候會再通知你。" }
];

export function ShuttleTips() {
  return (
    <div className="shuttle-tips-card" aria-label="接駁車注意事項">
      <p className="shuttle-tips-heading">優先搭乘接駁車</p>
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
