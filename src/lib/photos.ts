export type PhotoRole = "hero" | "gallery" | "family" | "transition";

export type WeddingPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  role: PhotoRole;
};

export const photos: WeddingPhoto[] = [
  {
    id: "hero-01",
    src: "/photos/hero-01.jpg",
    width: 4134,
    height: 2756,
    alt: "4J 與 Yuan 的婚紗照",
    role: "hero"
  },
  {
    id: "hero-02",
    src: "/photos/hero-02.jpg",
    width: 4134,
    height: 2756,
    alt: "4J 與 Yuan 的婚紗照",
    role: "hero"
  },
  {
    id: "hero-03",
    src: "/photos/hero-03.jpg",
    width: 4134,
    height: 2756,
    alt: "4J 與 Yuan 的婚紗照",
    role: "hero"
  },
  {
    id: "gallery-01",
    src: "/photos/gallery-01.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "gallery-02",
    src: "/photos/gallery-02.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "gallery-03",
    src: "/photos/gallery-03.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "gallery-04",
    src: "/photos/gallery-04.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "gallery-05",
    src: "/photos/gallery-05.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "gallery-06",
    src: "/photos/gallery-06.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "gallery-07",
    src: "/photos/gallery-07.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "gallery-08",
    src: "/photos/gallery-08.jpg",
    width: 4134,
    height: 2756,
    alt: "婚紗照橫幅",
    role: "gallery"
  },
  {
    id: "gallery-09",
    src: "/photos/gallery-09.jpg",
    width: 2756,
    height: 4134,
    alt: "婚紗照直幅",
    role: "gallery"
  },
  {
    id: "family-01",
    src: "/photos/family-01.jpg",
    width: 2756,
    height: 4134,
    alt: "4J 與 Yuan 精選婚紗照",
    role: "family"
  },
  {
    id: "family-02",
    src: "/photos/family-02.jpg",
    width: 2756,
    height: 4134,
    alt: "4J 與 Yuan 精選婚紗照",
    role: "family"
  },
  {
    id: "family-03",
    src: "/photos/family-03.jpg",
    width: 2756,
    height: 4134,
    alt: "4J 與 Yuan 精選婚紗照",
    role: "family"
  },
  {
    id: "family-04",
    src: "/photos/family-04.jpg",
    width: 4134,
    height: 2756,
    alt: "4J 與 Yuan 精選婚紗照",
    role: "family"
  },
  {
    id: "family-05",
    src: "/photos/family-05.jpg",
    width: 4134,
    height: 2756,
    alt: "4J 與 Yuan 精選婚紗照",
    role: "family"
  },
  {
    id: "family-06",
    src: "/photos/family-06.jpg",
    width: 2756,
    height: 4134,
    alt: "4J 與 Yuan 精選婚紗照",
    role: "family"
  },
  {
    id: "family-07",
    src: "/photos/family-07.jpg",
    width: 2756,
    height: 4134,
    alt: "4J 與 Yuan 精選婚紗照",
    role: "family"
  }
];

export const heroPhotos = photos.filter((photo) => photo.role === "hero");
export const galleryPhotos = photos.filter((photo) => photo.role === "gallery");
export const familyPhotos = photos.filter((photo) => photo.role === "family");
