"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Download, Languages } from "lucide-react";

// Custom Components
import { HeroSection } from "@/components/homepage/hero-section";
import { FeatureCard } from "@/components/homepage/feature-card";
import { SectionHeading } from "@/components/homepage/section-heading";
import { ProcessStep } from "@/components/homepage/process-step";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // If loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <HeroSection
        title="Translate Minecraft Mods Together"
        description="Loqui is a free and open-source platform that makes translating Minecraft mods easy through crowdsourcing."
        primaryButtonText={
          isAuthenticated ? "Open Dashboard" : "Login with Modrinth"
        }
        primaryButtonHref={isAuthenticated ? "/dashboard" : "/auth"}
        secondaryButtonText="Learn More"
        secondaryButtonHref="#features"
      />

      {/* For Who Section */}
      <section className="w-full py-12 md:py-24 lg:py-32" id="features">
        <div className="container px-4 md:px-6">
          <SectionHeading title="Who is Loqui for?" />

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
            <FeatureCard
              icon={Code}
              title="For Developers"
              description="Simplify your mod localization"
              features={[
                "Opt-in with one click using Modrinth OAuth",
                "Automatic detection of new mod versions",
                "No manual work required for translations",
              ]}
              buttonText="Learn More"
              buttonHref="#how-it-works"
            />

            <FeatureCard
              icon={Languages}
              title="For Translators"
              description="Contribute to your favorite mods"
              features={[
                "Easy-to-use translation interface",
                "Translation memory and helpful tools",
                "Earn recognition in the community",
              ]}
              buttonText="Learn More"
              buttonHref="#how-it-works"
            />

            <FeatureCard
              icon={Download}
              title="For Users"
              description="Enjoy mods in your language"
              features={[
                "Download the Loqui mod for automatic updates",
                "Or use translation resource packs",
                "Access translations for your favorite mods",
              ]}
              buttonText="Learn More"
              buttonHref="#how-it-works"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="w-full py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-950/50"
        id="how-it-works"
      >
        <div className="container px-4 md:px-6">
          <SectionHeading
            title="How Loqui Works"
            description="A simple process that benefits everyone in the Minecraft modding ecosystem."
          />

          <div className="mx-auto mt-8">
            <Tabs
              defaultValue="developers"
              className="w-full max-w-3xl mx-auto"
            >
              <TabsContent value="developers">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">For Developers</h3>
                  <ol className="space-y-4">
                    <ProcessStep
                      number={1}
                      title="Opt-In"
                      description="Log in to Loqui with your Modrinth account and select which projects to include."
                    />
                    <ProcessStep
                      number={2}
                      title="Automatic Updates"
                      description="When you release a new version, Loqui detects it and extracts the en_us.json file."
                    />
                    <ProcessStep
                      number={3}
                      title="Continuous Translation"
                      description="Translators work on new or modified text, keeping translations fresh and current."
                    />
                    <ProcessStep
                      number={4}
                      title="Track Progress"
                      description="Access a dashboard to monitor translation progress and analytics for your mods."
                    />
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="translators">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">For Translators</h3>
                  <ol className="space-y-4">
                    <ProcessStep
                      number={1}
                      title="Create an Account"
                      description="Log in to Loqui with your Modrinth account in Translator mode."
                    />
                    <ProcessStep
                      number={2}
                      title="Find Projects"
                      description="Browse available projects or get a random selection to translate."
                    />
                    <ProcessStep
                      number={3}
                      title="Translate"
                      description="Use the translation interface with helpful tools like translation memory."
                    />
                    <ProcessStep
                      number={4}
                      title="Earn Recognition"
                      description="Earn a share of Modrinth revenue when your work is included in translation resource packs."
                    />
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="users">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">For Users</h3>
                  <ol className="space-y-4">
                    <ProcessStep
                      number={1}
                      title="Choose Your Method"
                      description="Decide between the Loqui mod or translation resource packs."
                    />
                    <ProcessStep
                      number={2}
                      title="Download"
                      description="Get the Loqui mod from Modrinth/CurseForge or download translation resource packs."
                    />
                    <ProcessStep
                      number={3}
                      title="Install"
                      description="Add the mod or resource packs to your Minecraft installation."
                    />
                    <ProcessStep
                      number={4}
                      title="Enjoy"
                      description="Play your favorite mods in your preferred language."
                    />
                  </ol>
                </div>
              </TabsContent>

              <TabsList className="grid w-full grid-cols-3 mt-6">
                <TabsTrigger value="developers">Developers</TabsTrigger>
                <TabsTrigger value="translators">Translators</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <SectionHeading
            title="Ready to Get Started?"
            description="Join the Loqui community today and help make Minecraft mods accessible to everyone."
          />

          <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center mt-6">
            <Button size="lg" className="gap-1" asChild>
              <Link href="/auth">Login with Modrinth</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
