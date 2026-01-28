"use client"

import { CommandSeparator } from "@/components/ui/command"
import { CommandItem } from "@/components/ui/command"
import { CommandGroup } from "@/components/ui/command"
import { CommandEmpty } from "@/components/ui/command"
import { CommandList } from "@/components/ui/command"
import { CommandInput } from "@/components/ui/command"
import { CommandDialog } from "@/components/ui/command"
import { useRouter } from "next/navigation"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Shield, MapPin, Users, Bell, BarChart3, Radio, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LayoutDashboard, FileText, AlertCircle, Settings } from "lucide-react"

declare global {
  interface Window {
    google: any;
  }
}

function generateArc(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  curvature = 0.5,
  points = 100
) {
  const path: { lat: number; lng: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const t = i / points;

    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;

    const arcOffset = Math.sin(Math.PI * t) * curvature * 0.001;

    path.push({
      lat: lat + arcOffset,
      lng: lng,
    });
  }

  return path;
}

function HeroMap() {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      // Google Maps API is already loaded via script in layout.tsx
      // Just wait for it to be available
      if (!window.google?.maps) {
        setTimeout(initMap, 100);
        return;
      }

      const mapsLibrary = window.google.maps;
      const markerLibrary = window.google.maps.marker;

      if (!mapContainer.current) return;

      const { Map } = mapsLibrary;
      const { AdvancedMarkerElement } = markerLibrary;

      const center = { lat: 19.041632014913688, lng: 72.82281184918487 };

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

      const map = new mapsLibrary.Map(mapContainer.current, {
        zoom: 19,
        center: center,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '',
        mapTypeId: 'satellite',
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false,
        tilt: 65,
        heading: 45,
      });

      const marker = new markerLibrary.AdvancedMarkerElement({
        map: map,
        position: center,
        title: 'Analysis Center',
      });

      let heading = 0;
      const rotationInterval = setInterval(() => {
        heading = (heading + 0.5) % 360;
        map.setHeading(heading);
      }, 100);

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

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}

export default function LandingPage() {
  const [showMap, setShowMap] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false); // Declare setCommandOpen variable

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Map */}
      <section className="relative w-full h-screen overflow-hidden">
        {showMap && <HeroMap />}

        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6">
          <div className="text-center space-y-4 max-w-3xl">
            <h1 className="text-8xl md:text-9xl font-bold text-white tracking-tighter drop-shadow-xl" style={{ letterSpacing: '-0.02em' }}>
              CrimeWise
            </h1>

            <p className="text-xl md:text-2xl text-white tracking-wider font-light drop-shadow-lg" style={{ letterSpacing: '0.05em' }}>
              Predict. Prevent. Protect.
            </p>
          </div>

          <div className="flex gap-6 justify-center flex-wrap mt-16">
            <Link href="/login">
              <Button 
                className="px-10 py-3 text-base bg-white text-black hover:bg-gray-100 font-medium transition-colors tracking-wide"
                style={{ letterSpacing: '0.02em' }}
              >
                Access Command Center
              </Button>
            </Link>
            <Button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              className="px-10 py-3 text-base border-2 border-white text-white hover:bg-white/10 font-medium bg-transparent transition-colors tracking-wide"
              style={{ letterSpacing: '0.02em' }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative bg-white py-24 overflow-hidden border-t border-cyan-100">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-200 bg-cyan-50 mb-4">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-sm font-medium text-cyan-700">Core Capabilities</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mt-4">Advanced Analysis Tools</h2>
            <p className="mt-4 text-lg text-slate-600">
              Intelligent crime prediction and prevention powered by real-time data
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Hotspot Analysis"
              description="AI-driven crime prediction identifies high-risk zones before incidents occur"
            />
            <FeatureCard
              icon={<MapPin className="h-6 w-6" />}
              title="Patrol Optimization"
              description="Smart route planning ensures maximum coverage with available resources"
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Officer Management"
              description="Real-time tracking of personnel status, assignments, and availability"
            />
            <FeatureCard
              icon={<Radio className="h-6 w-6" />}
              title="Live Monitoring"
              description="Bodycam integration and patrol tracking for situational awareness"
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Alert System"
              description="Instant notifications for emergencies, backup requests, and critical updates"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="FIR Management"
              description="Streamlined incident reporting from field to database with GPS tagging"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative bg-cyan-50 py-16 border-t border-cyan-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard value="35%" label="Crime Reduction" />
            <StatCard value="2.5x" label="Faster Response" />
            <StatCard value="98%" label="Area Coverage" />
            <StatCard value="24/7" label="Active Monitoring" />
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section id="about" className="relative bg-white py-24 border-t border-cyan-100">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Role-Based Access</h2>
            <p className="mt-4 text-lg text-slate-600">
              Tailored interfaces for different operational needs
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <RoleCard
              title="Admin / Command Center"
              description="Full system access for decision makers and operations controllers"
              features={[
                "City-wide crime analytics",
                "FIR and hotspot management",
                "Patrol deployment control",
                "Officer assignment",
                "Live monitoring dashboard"
              ]}
            />
            <RoleCard
              title="Police Leader / Patrol"
              description="Streamlined mobile interface for field operations"
              features={[
                "Assigned patrol routes",
                "Real-time risk alerts",
                "Field FIR submission",
                "Bodycam control",
                "Emergency backup requests"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-900 border-t border-cyan-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-400">
                <Shield className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="font-semibold text-white">CrimeWise</span>
            </div>
            <p className="text-sm text-slate-400">
              Intelligent Crime Prevention Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group relative rounded-xl border border-cyan-200 bg-white p-6 transition-all hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-200/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 group-hover:bg-cyan-200 transition-colors">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative text-center p-6 rounded-lg border border-cyan-200 bg-white hover:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-200/50">
      <div className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{value}</div>
      <div className="mt-3 text-sm text-slate-600 font-medium">{label}</div>
    </div>
  )
}

function RoleCard({ title, description, features }: { title: string; description: string; features: string[] }) {
  return (
    <div className="relative rounded-xl border border-cyan-200 bg-white p-8 hover:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-200/50">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
            <CheckCircle2 className="h-5 w-5 text-cyan-600 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
