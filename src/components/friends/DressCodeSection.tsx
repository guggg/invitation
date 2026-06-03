import type { wedding } from "@/lib/wedding";

type DressCode = typeof wedding.dressCode;

type DressCodeSectionProps = {
  dressCode: DressCode;
  sectionIndex: number;
};

export function DressCodeSection({ dressCode, sectionIndex }: DressCodeSectionProps) {
  return (
    <section
      id="dress-code"
      className="friends-v2-section dress-code-section"
      data-friend-section={sectionIndex}
      data-section-label="穿著"
      aria-labelledby="dress-code-title"
    >
      <div className="dress-code-copy" data-fx="blur-reveal">
        <p>Dress Code</p>
        <h2 id="dress-code-title">{dressCode.title}</h2>
        <span>{dressCode.subtitle}</span>
      </div>

      <div className="dress-code-palette" aria-label="推薦色票">
        {dressCode.palette.map((color) => (
          <article className="dress-code-swatch" data-fx="blur-reveal" key={color.hex}>
            <div
              className="dress-code-swatch-color"
              style={{ backgroundColor: color.hex }}
              aria-label={`${color.name} ${color.hex}`}
            />
            <div>
              <h3>{color.name}</h3>
              <code>{color.hex}</code>
              <p>{color.note}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="dress-code-notes" data-fx="blur-reveal">
        <article>
          <p>建議穿搭</p>
          <span>{dressCode.guidance}</span>
        </article>
        <article>
          <p>小小提醒，拜託不要～</p>
          <ul>
            {dressCode.avoid.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
