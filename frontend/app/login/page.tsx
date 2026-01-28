"use client"

import React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Shield, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Role = "admin" | "police-leader"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "true"
  
  const [email, setEmail] = useState(isDemo ? "admin@cityshield.gov" : "")
  const [password, setPassword] = useState(isDemo ? "demo123" : "")
  const [role, setRole] = useState<Role>("admin")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Store role in localStorage for demo purposes
    localStorage.setItem("userRole", role)
    localStorage.setItem("userEmail", email)
    
    // Redirect based on role
    if (role === "admin") {
      router.push("/admin")
    } else {
      router.push("/patrol")
    }
  }

  const handleDemoLogin = async (selectedRole: Role) => {
    setIsLoading(true)
    localStorage.setItem("userRole", selectedRole)
    localStorage.setItem("userEmail", selectedRole === "admin" ? "admin@cityshield.gov" : "officer@cityshield.gov")
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (selectedRole === "admin") {
      router.push("/admin")
    } else {
      router.push("/patrol")
    }
  }

  return (
    <div className="min-h-screen h-screen flex bg-white overflow-hidden">
      {/* Left Section - Image with theme background */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-cyan-50 to-blue-50 relative items-center justify-start overflow-visible">
        <div className="absolute inset-0 opacity-40 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative z-12 w-full h-full flex items-center justify-start px-0">
          <img
            src="/login.png"
            alt="CrimeWise Analyst"
            className="w-185 max-w-none h-auto object-contain translate-x-18"
            style={{
              filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))",
            }}
          />
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 lg:px-8 overflow-hidden">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">

          </Link>

          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to access the command center</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Role Selector */}
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        role === "admin"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Admin</div>
                      <div className="text-xs text-muted-foreground">Command Center</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("police-leader")}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        role === "police-leader"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Police Leader</div>
                      <div className="text-xs text-muted-foreground">Patrol Unit</div>
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@department.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Demo Login */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Quick Demo Access</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin("admin")}
                    disabled={isLoading}
                  >
                    Demo Admin
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin("police-leader")}
                    disabled={isLoading}
                  >
                    Demo Patrol
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need access?{" "}
            <button className="text-primary hover:underline">Contact your department admin</button>
          </p>
        </div>
      </div>
    </div>
  )
}
