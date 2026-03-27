// Image data structure for high-performance Subaru Impreza gallery
// Copyright-free images for workshop specialization showcase

export interface GalleryImage {
  id: string;
  title: string;
  description: string;
  category: 'engine' | 'rally' | 'street' | 'track' | 'drift' | 'racing';
  specs: string[];
  placeholder: string; // Emoji placeholder until actual images are loaded
  // Future implementation: actual image paths when images are downloaded
  imagePath?: string;
  imageAlt: string;
  sourceAttribution?: string;
}

export interface ServiceImage {
  id: string;
  service: string;
  iconEmoji: string;
  backgroundImage?: string;
  description: string;
}

// Gallery Images Data - Ready for implementation
export const galleryImages: GalleryImage[] = [
  {
    id: 'impreza-sti-2015',
    title: 'Impreza STI 2015',
    description: '350HP • Turbo upgrade • ECU remap',
    category: 'engine',
    specs: ['350 HP', 'Turbo Upgrade', 'ECU Remap', 'Performance Exhaust'],
    placeholder: '🏎️',
    imageAlt: 'Blue Subaru Impreza STI 2015 with performance modifications showcasing 350HP turbo upgrade',
    sourceAttribution: 'Unsplash automotive photography collection'
  },
  {
    id: 'wrx-rally-build',
    title: 'WRX Rally Build',
    description: 'Rally setup • Roll cage • Competition ready',
    category: 'rally',
    specs: ['Roll Cage', 'Rally Suspension', 'Competition Tires', 'Safety Equipment'],
    placeholder: '🏁',
    imageAlt: 'Subaru WRX rally car build with roll cage and competition modifications',
    sourceAttribution: 'Pexels sports car collection'
  },
  {
    id: 'street-performance',
    title: 'Street Performance',
    description: 'Daily driver • 280HP • Perfect balance',
    category: 'street',
    specs: ['280 HP', 'Street Tuning', 'Daily Reliability', 'Balanced Setup'],
    placeholder: '⚡',
    imageAlt: 'Street-performance Subaru Impreza optimized for daily driving with 280HP',
    sourceAttribution: 'Pixabay modified cars collection'
  },
  {
    id: 'track-day-special',
    title: 'Track Day Special',
    description: 'Circuit setup • Aerodynamics • 320HP',
    category: 'track',
    specs: ['320 HP', 'Aerodynamic Kit', 'Track Suspension', 'Racing Brakes'],
    placeholder: '🔥',
    imageAlt: 'Track-focused Subaru Impreza with aerodynamic modifications and 320HP setup',
    sourceAttribution: 'Unsplash racing collection'
  },
  {
    id: 'drift-machine',
    title: 'Drift Machine',
    description: 'Drift setup • LSD • Custom suspension',
    category: 'drift',
    specs: ['Limited Slip Diff', 'Drift Suspension', 'Angle Kit', 'Custom Setup'],
    placeholder: '💨',
    imageAlt: 'Subaru Impreza drift machine with LSD and custom suspension setup',
    sourceAttribution: 'Pexels drift cars collection'
  },
  {
    id: 'championship-winner',
    title: 'Championship Winner',
    description: 'Racing build • 400HP • Podium finisher',
    category: 'racing',
    specs: ['400 HP', 'Racing Build', 'Competition Spec', 'Championship Winner'],
    placeholder: '🏆',
    imageAlt: 'Championship-winning Subaru Impreza race car with 400HP professional racing build',
    sourceAttribution: 'Unsplash competition cars'
  }
];

// Service Images Data
export const serviceImages: ServiceImage[] = [
  {
    id: 'ecu-programming',
    service: 'Reprogramación ECU',
    iconEmoji: '⚡',
    description: 'Optimización de la centralita para máximo rendimiento y eficiencia.',
    backgroundImage: 'service-ecu-tuning.webp'
  },
  {
    id: 'engine-preparation',
    service: 'Preparación Motor',
    iconEmoji: '🔧',
    description: 'Modificaciones internas del motor para alta performance.',
    backgroundImage: 'service-engine-build.webp'
  },
  {
    id: 'sport-suspension',
    service: 'Suspensión Deportiva',
    iconEmoji: '🏁',
    description: 'Setup de suspensión para competición y uso deportivo.',
    backgroundImage: 'service-suspension.webp'
  },
  {
    id: 'exhaust-system',
    service: 'Sistema de Escape',
    iconEmoji: '💨',
    description: 'Escapes deportivos para mejor flujo y sonido racing.',
    backgroundImage: 'service-exhaust.webp'
  }
];

// Hero Section Image Data
export const heroImage = {
  id: 'hero-performance',
  title: 'High-Performance Subaru Impreza Workshop',
  description: 'Professional workshop specializing in Subaru Impreza performance modifications',
  imagePath: 'hero-subaru-performance.webp',
  imageAlt: 'High-performance Subaru Impreza in professional workshop setting showcasing performance modifications',
  sourceAttribution: 'Unsplash automotive workshop collection'
};

// Experience Section Images
export const experienceImages = {
  workshop: {
    imagePath: 'experience-workshop.webp',
    imageAlt: 'Professional workshop with Subaru Impreza performance vehicles under service',
    sourceAttribution: 'Pexels automotive workshop collection'
  },
  racing: {
    imagePath: 'experience-racing.webp',
    imageAlt: 'Racing podium ceremony with championship-winning Subaru team',
    sourceAttribution: 'Unsplash motorsport collection'
  }
};

// Image optimization constants
export const IMAGE_SIZES = {
  hero: {
    desktop: '1920x1080',
    tablet: '1024x768',
    mobile: '768x432'
  },
  gallery: {
    desktop: '600x400',
    tablet: '400x300',
    mobile: '350x250'
  },
  service: {
    icon: '300x300',
    background: '800x600'
  }
} as const;

// Helper function to generate responsive image sources
export const generateImageSources = (basePath: string, sizes: Record<string, string>) => {
  return Object.entries(sizes).map(([device, dimensions]) => ({
    device,
    dimensions,
    webp: `${basePath}-${dimensions}.webp`,
    jpeg: `${basePath}-${dimensions}.jpg`
  }));
};

// Keywords for image search (for future reference)
export const imageSearchKeywords = {
  subaru: ['subaru impreza', 'subaru wrx', 'subaru sti', 'impreza performance'],
  performance: ['turbo upgrade', 'ecu tuning', 'performance modification', 'high performance'],
  racing: ['rally car', 'track day', 'racing car', 'motorsport', 'competition'],
  technical: ['engine bay', 'suspension setup', 'exhaust system', 'automotive workshop'],
  style: ['blue subaru', 'performance car', 'modified car', 'tuned vehicle']
} as const;