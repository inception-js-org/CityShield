'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google: any;
  }
}

// Arc path generator function
function generateArc(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  curvature = 0.5,
  points = 100
) {
  const path: { lat: number; lng: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const t = i / points;

    // Linear interpolation
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;

    // Parabolic offset
    const arcOffset = Math.sin(Math.PI * t) * curvature * 0.001;

    path.push({
      lat: lat + arcOffset,
      lng: lng,
    });
  }

  return path;
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');

      setOptions({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      });

      const mapsLibrary = await importLibrary('maps');
      const markerLibrary = await importLibrary('marker');

      if (!mapContainer.current) return;

      const { Map } = mapsLibrary;
      const { AdvancedMarkerElement } = markerLibrary;

      const center = { lat: 19.041632014913688, lng: 72.82281184918487 };

      // Define hotspots
      // const hotspots = [
        // { lat: 19.04127963675092, lng: 72.8224204608146, risk: 'high' as const },
        // { lat: 19.04326558388509, lng: 72.8210956602454, risk: 'high' as const },
        // { lat: 19.041967444642236, lng: 72.81837120641995, risk: 'high' as const },
        // { lat: 19.045324078367297, lng: 72.81917061669964, risk: 'high' as const },
        // { lat: 19.048905628081823, lng: 72.82282910599356, risk: 'high' as const },
        // { lat: 19.0424, lng: 72.8242, risk: 'high' as const },           
        // { lat: 19.0424, lng: 72.8242, risk: 'high' as const },     
      //   { lat: 19.0424, lng: 72.8242, risk: 'high' as const },
      //   { lat: 19.0408, lng: 72.8213, risk: 'medium' as const },
      //   { lat: 19.0431, lng: 72.8201, risk: 'low' as const },
      // ];

      // Define hotspots
      const hotspots = [
        { lat: 19.04127963675092, lng: 72.8224204608146, risk: 'high' as const },
        { lat: 19.04326558388509, lng: 72.8210956602454, risk: 'high' as const },
        { lat: 19.041967444642236, lng: 72.81837120641995, risk: 'high' as const },
        { lat: 19.045324078367297, lng: 72.81917061669964, risk: 'high' as const },
        { lat: 19.048905628081823, lng: 72.82282910599356, risk: 'high' as const },
        { lat: 19.0424, lng: 72.8242, risk: 'high' as const },           
        { lat: 19.0424, lng: 72.8242, risk: 'high' as const },     
        { lat: 19.0424, lng: 72.8242, risk: 'high' as const },
        { lat: 19.0408, lng: 72.8213, risk: 'medium' as const },
        { lat: 19.0431, lng: 72.8201, risk: 'low' as const },
      ];      

      const map = new Map(mapContainer.current, {
        zoom: 19,
        center: center,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
        mapTypeId: 'satellite',
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false,
        tilt: 65,
        heading: 45,
      });

      // Central marker
      const marker = new AdvancedMarkerElement({
        map: map,
        position: center,
        title: 'Analysis Center',
      });

      // Rotate map continuously
      let heading = 0;
      const rotationInterval = setInterval(() => {
        heading = (heading + 0.5) % 360;
        map.setHeading(heading);
      }, 100);

      // Draw animated arc lines to hotspots
      hotspots.forEach((spot) => {
        const arcPath = generateArc(center, spot, 0.8);

        const polyline = new window.google.maps.Polyline({
          path: arcPath,
          geodesic: true,
          strokeColor: '#38BDF8',
          strokeOpacity: 0.7,
          strokeWeight: 2,
          map: map,
          icons: [
            {
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 2,
                strokeColor: '#38BDF8',
              },
              offset: '0%',
            },
          ],
        });

        // Animate the line
        let offset = 0;
        const animationInterval = setInterval(() => {
          offset = (offset + 1) % 100;
          polyline.set('icons', [
            {
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 2,
                strokeColor: '#38BDF8',
              },
              offset: `${offset}%`,
            },
          ]);
        }, 50);

        return () => clearInterval(animationInterval);
      });

      // Add pulsing hotspot nodes
      hotspots.forEach((spot) => {
        const color =
          spot.risk === 'high'
            ? '#EF4444'
            : spot.risk === 'medium'
            ? '#F59E0B'
            : '#10B981';

        const circle = new window.google.maps.Circle({
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: color,
          fillOpacity: 0.6,
          map,
          center: spot,
          radius: 8,
        });

        // Pulse animation
        let growing = true;
        const pulseInterval = setInterval(() => {
          let radius = circle.getRadius() || 8;
          if (growing) {
            radius += 0.5;
            if (radius > 18) growing = false;
          } else {
            radius -= 0.5;
            if (radius < 8) growing = true;
          }
          circle.setRadius(radius);
        }, 60);

        return () => clearInterval(pulseInterval);
      });

      return () => {
        clearInterval(rotationInterval);
      };
    };

    initMap();
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Map Background */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Subtle Dark Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6">
        {/* Header Section - Minimal and Clean */}
        <div className="text-center space-y-4 max-w-3xl">
          {/* Main Title */}
          <h1 className="text-8xl md:text-9xl font-bold text-white tracking-tighter drop-shadow-xl" style={{ letterSpacing: '-0.02em' }}>
            CrimeWise
          </h1>

          {/* Subtitle - Clean and minimal */}
          <p className="text-xl md:text-2xl text-white tracking-wider font-light drop-shadow-lg" style={{ letterSpacing: '0.05em' }}>
            Predict. Prevent. Protect.
          </p>
        </div>

        {/* CTA Buttons - Minimal spacing */}
        <div className="flex gap-6 justify-center flex-wrap mt-16">
          <Button className="px-10 py-3 text-base bg-white text-black hover:bg-gray-100 font-medium transition-colors tracking-wide" style={{ letterSpacing: '0.02em' }}>
            Start Analysis
          </Button>
          <Button
            variant="outline"
            className="px-10 py-3 text-base border-2 border-white text-white hover:bg-white/10 font-medium bg-transparent transition-colors tracking-wide"
            style={{ letterSpacing: '0.02em' }}
          >
            Learn More
          </Button>
        </div>
      </div>
    </main>
  );
}
