import { FeatureCard } from './FeatureCard';
import { FEATURES } from './data';

export function Features() {
  return (
    <section id="features" className="border-t border-border/50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you keep scattered, in one place
          </h2>
          <p className="mt-3 text-muted-foreground">
            Five first-class types. Fuzzy search across all of them. One hotkey away.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
