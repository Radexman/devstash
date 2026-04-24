import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  Navbar,
  Hero,
  Features,
  AiSection,
  Pricing,
  CtaBand,
  Footer,
} from '@/components/home';

export const metadata: Metadata = {
  title: 'DevStash — One hub for all your developer knowledge',
  description:
    'Stop losing your snippets, prompts, commands, and links. DevStash is the fast, searchable, AI-enhanced hub for everything you build.',
};

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <AiSection />
        <Pricing />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
