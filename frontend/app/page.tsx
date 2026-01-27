"use client"

import React from "react"

import Link from "next/link"
import { Shield, MapPin, Users, Bell, BarChart3, Radio, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">CityShield</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <ThemeToggle />
            <Link href="/login">
              <Button className="rounded-xl shadow-md">Sign In</Button>
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm" className="rounded-xl">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Crime Prevention
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Smarter Policing for
              <span className="text-primary"> Safer Cities</span>
            </h1>
            <p className="mt-6 text-pretty text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              CityShield combines real-time crime data analysis with AI-powered hotspot prediction 
              to optimize patrol routes and enhance community safety.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Access Command Center
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login?demo=true">
                <Button variant="outline" size="lg" className="bg-transparent">
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Core Capabilities</h2>
            <p className="mt-3 text-muted-foreground">
              A comprehensive suite of tools designed for modern law enforcement
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard value="35%" label="Crime Reduction" />
            <StatCard value="2.5x" label="Faster Response" />
            <StatCard value="98%" label="Area Coverage" />
            <StatCard value="24/7" label="Active Monitoring" />
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section id="about" className="border-t border-border bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Role-Based Access</h2>
            <p className="mt-3 text-muted-foreground">
              Tailored interfaces for different operational needs
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
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
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">CityShield</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for safer communities
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function RoleCard({ title, description, features }: { title: string; description: string; features: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <ul className="mt-5 space-y-2.5">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
