import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { RsvpForm } from "@/components/RsvpForm";
import { familyPhotos } from "@/lib/photos";
import { wedding } from "@/lib/wedding";

type FamilyExperienceProps = {
  endpoint: string;
};

export function FamilyExperience({ endpoint }: FamilyExperienceProps) {
  return (
    <main className="family-shell">
      <header className="family-header">
        <Link href="/">士杰與慧媛</Link>
        <a href="#rsvp">填寫出席回覆</a>
      </header>

      <section className="family-hero">
        <div className="family-hero-copy">
          <p>婚禮邀請</p>
          <h1>{wedding.coupleChinese}</h1>
          <div className="family-facts">
            <span>
              <CalendarDays size={22} aria-hidden="true" />
              {wedding.dateDisplay}
            </span>
            <span>
              <MapPin size={22} aria-hidden="true" />
              {wedding.venue.name}
            </span>
          </div>
          <a className="family-primary" href="#rsvp">
            填寫出席回覆
          </a>
        </div>
        <div className="family-hero-photo">
          <Image
            src={familyPhotos[2].src}
            alt={familyPhotos[2].alt}
            width={familyPhotos[2].width}
            height={familyPhotos[2].height}
            priority
            sizes="(max-width: 768px) 92vw, 36vw"
          />
        </div>
      </section>

      <section className="family-section">
        <p className="family-kicker">誠摯邀請</p>
        <h2>{wedding.copy.familyGreeting}</h2>
      </section>

      <section className="family-section family-schedule">
        <div className="family-section-title">
          <Clock size={26} aria-hidden="true" />
          <h2>婚禮流程</h2>
        </div>
        <div className="family-timeline">
          {wedding.schedule.map((item) => (
            <article key={item.time}>
              <time>{item.time}</time>
              <div>
                <h3>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="family-section family-venue">
        <p className="family-kicker">地點</p>
        <h2>{wedding.venue.name}</h2>
        <p>證婚 16:30，晚宴 18:00 入席，預計 20:30 結束。</p>
        <a className="family-map" href={wedding.venue.mapsUrl} target="_blank" rel="noreferrer">
          開啟 Google Maps
          <ArrowUpRight size={20} aria-hidden="true" />
        </a>
      </section>

      <section className="family-gallery" aria-label="精選婚紗照">
        {familyPhotos.slice(1, 5).map((photo) => (
          <figure key={photo.id}>
            <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 768px) 45vw, 22vw" />
          </figure>
        ))}
      </section>

      <section id="rsvp" className="family-rsvp">
        <div>
          <p className="family-kicker">出席回覆</p>
          <h2>出席回覆</h2>
          <p>麻煩於 2026/7/7 前協助填寫。若超過日期仍可送出，我們會另外確認。</p>
        </div>
        <RsvpForm endpoint={endpoint} sourceRoute="/family" variant="classic" />
      </section>
    </main>
  );
}
