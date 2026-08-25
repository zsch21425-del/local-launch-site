import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://fairway.upstatewebsites.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Fairway Automotive Group — Greenville SC | Family-Owned Since 1966',
    template: '%s | Fairway Automotive Group',
  },
  description:
    'Fairway Automotive Group — family-owned & locally-operated on the Motor Mile in Greenville, SC since 1966. Fairway Ford, Subaru, Lincoln, Body Shop, Commercial & Used. New & used vehicles, service and collision repair. Call 864-242-5060.',
  keywords: [
    'Fairway Automotive Group',
    'Fairway Ford Greenville SC',
    'Fairway Subaru Greenville SC',
    'Fairway Lincoln Greenville SC',
    'Greenville SC dealerships',
    'Motor Mile Greenville',
    'Fairway Body Shop',
    'Fairway Commercial Center',
    'used cars Greenville SC',
    'car dealership Greenville SC',
    'family owned dealership Upstate SC',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Fairway Automotive Group',
    title: 'Fairway Automotive Group — Greenville SC | Family-Owned Since 1966',
    description:
      'Family-owned & locally-operated on the Motor Mile in Greenville, SC since 1966. Fairway Ford, Subaru, Lincoln, Body Shop, Commercial & Used. Call 864-242-5060.',
    locale: 'en_US',
    images: [
      {
        url: '/assets/hero-dealership.jpg',
        width: 1200,
        height: 630,
        alt: 'Fairway Automotive Group — Greenville SC',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fairway Automotive Group — Greenville SC',
    description:
      'Family-owned & locally-operated on the Motor Mile in Greenville, SC since 1966. Fairway Ford, Subaru, Lincoln, Body Shop, Commercial & Used.',
    images: ['/assets/hero-dealership.jpg'],
  },
};

function jsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // The AutoDealer entity for the whole group
      {
        '@type': 'AutoDealer',
        '@id': SITE_URL + '/#organization',
        name: 'Fairway Automotive Group',
        alternateName: 'Fairway Auto',
        url: SITE_URL,
        telephone: '+1-864-242-5060',
        foundingDate: '1966',
        description:
          'Family-owned & locally-operated automotive group on the Motor Mile in Greenville, SC since 1966. Fairway Ford, Subaru, Lincoln, Body Shop, Commercial Center and Used vehicles.',
        email: 'n/a',
        priceRange: '$$',
        slogan: 'Family-Owned & Locally-Operated Since 1966',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '2323 Laurens Road',
          addressLocality: 'Greenville',
          addressRegion: 'SC',
          postalCode: '29607',
          addressCountry: 'US',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 34.8417,
          longitude: -82.3264,
        },
        areaServed: [
          { '@type': 'City', name: 'Greenville' },
          { '@type': 'City', name: 'Greer' },
          { '@type': 'City', name: 'Simpsonville' },
          { '@type': 'City', name: 'Mauldin' },
          { '@type': 'City', name: 'Taylors' },
          { '@type': 'City', name: 'Easley' },
          { '@type': 'City', name: 'Travelers Rest' },
          { '@type': 'City', name: 'Fountain Inn' },
          { '@type': 'City', name: 'Spartanburg' },
          { '@type': 'City', name: 'Anderson' },
          { '@type': 'City', name: 'Clemson' },
        ],
        sameAs: [
          'https://www.facebook.com/fairwayauto',
          'https://www.instagram.com/fairwayautomotive',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.6',
          reviewCount: '4131',
          bestRating: '5',
          worstRating: '1',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Fairway Automotive Group services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'New vehicle sales',
                serviceType: 'Automobile sales',
                provider: { '@id': SITE_URL + '/#organization' },
                areaServed: ['Greenville', 'Greer', 'Simpsonville', 'Mauldin', 'Taylors', 'Easley', 'Travelers Rest', 'Fountain Inn', 'Spartanburg', 'Anderson', 'Clemson'],
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Pre-owned vehicle sales',
                serviceType: 'Used car sales',
                provider: { '@id': SITE_URL + '/#organization' },
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Factory-authorized vehicle service & repair',
                serviceType: 'Automobile repair',
                provider: { '@id': SITE_URL + '/#organization' },
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Collision repair',
                serviceType: 'Collision repair',
                provider: { '@id': SITE_URL + '/#organization' },
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Commercial fleet service & parts',
                serviceType: 'Commercial vehicle service',
                provider: { '@id': SITE_URL + '/#organization' },
              },
            },
          ],
        },
        department: [
          {
            '@type': 'AutoDealer',
            name: 'Fairway Ford',
            url: 'https://www.fairwayford.com',
            telephone: '+1-864-242-5060',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '2323 Laurens Road',
              addressLocality: 'Greenville',
              addressRegion: 'SC',
              postalCode: '29607',
              addressCountry: 'US',
            },
          },
          {
            '@type': 'AutoDealer',
            name: 'Fairway Subaru',
            url: 'https://www.fairwaysubarusc.com',
            telephone: '+1-864-242-5060',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '2209 Laurens Road',
              addressLocality: 'Greenville',
              addressRegion: 'SC',
              postalCode: '29607',
              addressCountry: 'US',
            },
          },
          {
            '@type': 'AutoDealer',
            name: 'Fairway Lincoln',
            url: 'https://www.fairwaylincoln.com',
            telephone: '+1-864-242-5060',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '2323 Laurens Road',
              addressLocality: 'Greenville',
              addressRegion: 'SC',
              postalCode: '29607',
              addressCountry: 'US',
            },
          },
          {
            '@type': 'AutoRepair',
            name: 'Fairway Body Shop',
            url: 'https://www.fairwayford.com/bodyshop/body-shop.htm',
            telephone: '+1-864-242-5060',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '723 Keith Drive',
              addressLocality: 'Greenville',
              addressRegion: 'SC',
              postalCode: '29607',
              addressCountry: 'US',
            },
          },
          {
            '@type': 'AutoRepair',
            name: 'Fairway Commercial Center',
            url: 'https://fairwayfordpro.com/p/commercial-vehicle-service-and-parts-in-greenville-sc',
            telephone: '+1-864-242-5060',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '351 Halton Road',
              addressLocality: 'Greenville',
              addressRegion: 'SC',
              postalCode: '29607',
              addressCountry: 'US',
            },
          },
          {
            '@type': 'AutoDealer',
            name: 'Fairway Used',
            url: 'https://fairwayfordpro.com/?filters=Chassis.Condition:All',
            telephone: '+1-864-242-5060',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '1 Haywood Road',
              addressLocality: 'Greenville',
              addressRegion: 'SC',
              postalCode: '29607',
              addressCountry: 'US',
            },
          },
        ],
      },
      // Explicit WebSite entity so engines have a URL anchor
      {
        '@type': 'WebSite',
        '@id': SITE_URL + '/#website',
        url: SITE_URL,
        name: 'Fairway Automotive Group',
        publisher: { '@id': SITE_URL + '/#organization' },
      },
    ],
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
