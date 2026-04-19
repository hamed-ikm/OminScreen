import Hero from './components/Hero';
import Stats from './components/Stats';
import Services from './components/Services';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 w-full overflow-x-hidden">
      <Hero />
      <Stats />
      <Services />
      <Footer />
    </div>
  );
}
