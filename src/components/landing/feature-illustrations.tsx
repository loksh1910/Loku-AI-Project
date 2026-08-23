import Image from "next/image";

function Illustration({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-full w-full bg-[#0a0a0f]">
      <Image
        src={src}
        alt={alt}
        fill
        loading="eager"
        className="object-cover"
        sizes="(min-width: 640px) 50vw, 100vw"
      />
    </div>
  );
}

export function SketchToUiIllustration() {
  return (
    <Illustration
      src="/images/feature-sketch-to-ui.png"
      alt="A sketch upload transforming into a generated UI screen"
    />
  );
}

export function FlowsIllustration() {
  return (
    <Illustration
      src="/images/feature-design-experiences.png"
      alt="Sitemap and user flow connecting into a UI screen and user journey"
    />
  );
}

export function VariationsIllustration() {
  return (
    <Illustration
      src="/images/feature-variations.png"
      alt="Three UI variations generated side by side for comparison"
    />
  );
}

export function AiManualIllustration() {
  return (
    <Illustration
      src="/images/feature-ai-manual.png"
      alt="A screen being edited manually next to the same screen with AI suggestions"
    />
  );
}
