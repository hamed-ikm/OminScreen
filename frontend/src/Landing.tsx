import Hero from './landing_components/Hero';
import Stats from './landing_components/Stats';
import Services from './landing_components/Services';
import Footer from './landing_components/Footer';


interface LandingProps {
  onTryNow: () => void;
}

export default function Landing({ onTryNow }: LandingProps) {
  return (
    <div className="font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 w-full overflow-x-hidden bg-white">
      <Hero onTryNow={onTryNow} />
      <Stats />
      <Services />
      <Footer />
    </div>
  );
}
