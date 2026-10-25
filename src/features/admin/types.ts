export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  featured: boolean;
  images: string[];
};

export type AdminPackage = {
  id: string;
  name: string;
  price: number;
  description: string;
  includes: string[];
};

export type AdminPost = {
  id: string;
  eyebrow: string;
  title: string;
  excerpt: string;
};

export type AdminReview = {
  id: string;
  name: string;
  text: string;
  stars: number;
};

export type SocialLink = {
  name: string;
  label: string;
  url: string;
};

export type AdminContent = {
  catalog: {
    schemaVersion: number;
    categories: string[];
    products: AdminProduct[];
    packages: AdminPackage[];
  };
  journal: {
    schemaVersion: number;
    posts: AdminPost[];
  };
  reviews: {
    schemaVersion: number;
    reviews: AdminReview[];
  };
  site: {
    schemaVersion: number;
    business: {
      name: string;
      currency: string;
      locale: string;
    };
    contact: {
      email: string;
      phone: string;
      whatsapp: string;
    };
    leadNotice: string;
    socialLinks: SocialLink[];
  };
};

export type PendingImage = {
  path: string;
  contentBase64: string;
};

export type AdminContentResponse = {
  baseSha: string;
  content: AdminContent;
};

export type PublishRequest = AdminContentResponse & {
  images: PendingImage[];
  deletions: string[];
};
