import Link from "next/link";

export function FriendsHeader() {
  return (
    <header className="friends-v2-header">
      <a className="friends-v2-brand" href="#opening" aria-label="Yuan and 4J wedding opening">
        4J&Yuan
      </a>
      <nav aria-label="朋友版導覽">
        <a href="#schedule">時間</a>
        <a href="#dress-code">穿著</a>
        <a href="#venue">地點</a>
        <a href="#gallery">照片</a>
        <a href="#rsvp">回覆</a>
        <Link href="/family">長輩版</Link>
      </nav>
    </header>
  );
}
