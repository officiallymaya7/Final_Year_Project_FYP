import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => (
  <div className="relative h-64 sm:h-72">
    <img
      src={heroBg}
      alt="Event management hero"
      className="absolute inset-0 w-full h-full object-cover"
      width={1920}
      height={640}
    />
    <div className="hero-overlay absolute inset-0" />
    <div className="relative z-10 flex flex-col items-center justify-center h-full pt-16 text-center px-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-2">
        Event Management Dashboard
      </h1>
      <p className="text-primary-foreground/70 text-sm sm:text-base max-w-xl">
        Manage, publish, and track all your events in one place
      </p>
    </div>
  </div>
);

export default HeroSection;
