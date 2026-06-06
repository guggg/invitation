import Image from "next/image";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { AsciiPortal } from "@/components/friends/AsciiPortal";
import { DressCodeSection } from "@/components/friends/DressCodeSection";
import { FriendRsvpExperience } from "@/components/friends/FriendRsvpExperience";
import { FriendsHeader } from "@/components/friends/FriendsHeader";
import { FriendsMotionController } from "@/components/friends/FriendsMotionController";
import { LineOfficialCta } from "@/components/LineOfficialCta";
import { MusicPulseBar } from "@/components/friends/MusicPulseBar";
import { LivingBackground } from "@/components/friends/LivingBackground";
import { PhotoUploadExperience } from "@/components/PhotoUploadExperience";
import { ProjectGallery } from "@/components/friends/ProjectGallery";
import { SectionRail } from "@/components/friends/SectionRail";
import { ShuttleBoard } from "@/components/friends/ShuttleBoard";
import { ShuttlePicker } from "@/components/friends/ShuttlePicker";
import { ShuttleTips } from "@/components/friends/ShuttleTips";
import { heroPhotos } from "@/lib/photos";
import { wedding } from "@/lib/wedding";

type FriendsExperienceProps = {
  endpoint: string;
  photoUploadEndpoint: string;
  lineAddFriendUrl: string;
  lineQrCodeSrc: string;
};

export function FriendsExperience({
  endpoint,
  photoUploadEndpoint,
  lineAddFriendUrl,
  lineQrCodeSrc
}: FriendsExperienceProps) {
  return (
    <main className="friends-v2-shell">
      <LivingBackground />
      <FriendsMotionController />
      <MusicPulseBar />
      <AsciiPortal />
      <FriendsHeader />
      <SectionRail />

      <section
        id="opening"
        className="friends-v2-section friends-v2-hero"
        data-friend-section="0"
        data-section-label="開場"
      >
        <div className="friends-v2-hero-copy">
          <p data-fx="blur-reveal">我們的婚禮邀請</p>
          <h1>
            <span>Yuan &amp; 4J</span>
            <span>4J &amp; Yuan</span>
          </h1>
          <div className="friends-v2-hero-facts">
            <span>{wedding.dateDisplay}</span>
            <span>{wedding.venue.name}</span>
          </div>
        </div>
        <div className="hero-constellation" aria-label="婚紗照精選">
          {heroPhotos.map((photo, index) => (
            <figure className={`constellation-card card-${index + 1}`} data-fx="drift" key={photo.id}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                priority={index === 0}
                loading={index < 2 ? "eager" : undefined}
                sizes="(max-width: 768px) 42vw, 18vw"
              />
            </figure>
          ))}
        </div>
      </section>

      <section
        id="signal"
        className="friends-v2-section signal-section"
        data-friend-section="1"
        data-section-label="邀請"
      >
        <div className="signal-copy" data-fx="blur-reveal">
          <p>給你的一句話</p>
          <h2>邀請你走進我們的婚禮那一天。</h2>
          <span>那天有花、有晚餐，也希望有你。</span>
        </div>
      </section>

      <section
        id="schedule"
        className="friends-v2-section schedule-theatre"
        data-friend-section="2"
        data-section-label="流程"
      >
        <div className="section-kicker" data-fx="blur-reveal">
          <p>婚禮流程</p>
          <h2>10 月 3 日，我們在這裡相遇。</h2>
        </div>
        <div className="schedule-scenes">
          {wedding.schedule.map((item, index) => (
            <article
              className={`schedule-scene scene-${index + 1}`}
              data-fx="schedule-card"
              data-schedule-index={index}
              key={item.time}
            >
              <time>{item.time}</time>
              <h3>{item.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <DressCodeSection dressCode={wedding.dressCode} sectionIndex={3} />

      <section
        id="venue"
        className="friends-v2-section venue-theatre"
        data-friend-section="4"
        data-section-label="地點"
      >
        <div className="venue-map-stage">
          <iframe
            title={`${wedding.venue.name} Google Map`}
            src={wedding.venue.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <div className="venue-copy" data-fx="blur-reveal">
          <p>婚禮地點</p>
          <h2>{wedding.venue.name}</h2>
          <span>我們會在這裡等你，一起開始那天的晚餐與祝福。</span>
          <a href={wedding.venue.mapsUrl} target="_blank" rel="noreferrer">
            <MapPin size={20} aria-hidden="true" />
            Google Maps
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>

      <ProjectGallery />

      <section
        id="secret-archive"
        className="friends-v2-section secret-archive-section"
        data-friend-section="6"
        data-section-label="密件"
      >
        <PhotoUploadExperience endpoint={photoUploadEndpoint} sourceRoute="/" variant="friend" />
      </section>

      <section
        id="shuttle"
        className="friends-v2-section shuttle-theatre"
        data-friend-section="7"
        data-section-label="接駁車"
      >
        <div className="section-kicker" data-fx="blur-reveal">
          <p>接駁車・強烈推薦</p>
          <h2>如果可以，請優先搭接駁車上山。</h2>
          <span>場地位於山區，沿途山路較蜿蜒，現場停車位也非常有限。搭接駁車會比自行找車位輕鬆很多。</span>
        </div>
        <div className="shuttle-layout">
          <div className="shuttle-board-wrap">
            <ShuttleBoard />
          </div>
          <div className="shuttle-aside">
            <ShuttleTips />
            <ShuttlePicker />
          </div>
        </div>
      </section>

      <section
        id="rsvp"
        className="friends-v2-section rsvp-theatre"
        data-friend-section="8"
        data-section-label="回覆"
      >
        <div className="rsvp-theatre-copy" data-fx="blur-reveal">
          <p>出席回覆</p>
          <h2>告訴我們你會不會來。</h2>
          <span>填完後，我們會把你的回覆收進婚禮名單，也會依照你的交通安排幫你保留接駁座位。</span>
        </div>
        <FriendRsvpExperience
          endpoint={endpoint}
          lineAddFriendUrl={lineAddFriendUrl}
          lineQrCodeSrc={lineQrCodeSrc}
        />
      </section>

      <section
        id="line"
        className="friends-v2-section line-section"
        data-friend-section="9"
        data-section-label="LINE"
      >
        <div data-fx="blur-reveal">
          <LineOfficialCta
            variant="footer"
            lineAddFriendUrl={lineAddFriendUrl}
            qrCodeSrc={lineQrCodeSrc}
          />
        </div>
      </section>

      <section
        id="finale"
        className="friends-v2-section finale-section"
        data-friend-section="10"
        data-section-label="那天見"
      >
        <div data-fx="blur-reveal">
          <p>那天見</p>
          <h2>2026.10.3</h2>
          <span>
            <CalendarDays size={18} aria-hidden="true" />
            Yuan & 4J / 4J & Yuan
          </span>
        </div>
      </section>
    </main>
  );
}
