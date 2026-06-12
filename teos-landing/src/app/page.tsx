import Nav from './components/Nav';
import Footer from './components/Footer';
import Hero from './components/sections/Hero';
import WhyNowAndGap from './components/sections/WhyNowAndGap';
import ArchitectureAndDemo from './components/sections/ArchitectureAndDemo';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import EnforcementConsole from './components/sections/EnforcementConsole';
import ThreatsAndCompare from './components/sections/ThreatsAndCompare';
import PricingSection from './components/PricingSection';
import EnterpriseTrustAndFinal from './components/sections/EnterpriseTrustAndFinal';

export default function Home() {
  return (
    <main className="relative z-[1]">
      <Nav />
      <Hero />
      <WhyNowAndGap />
      <ArchitectureDiagram />
      <ArchitectureAndDemo />
      <EnforcementConsole />
      <ThreatsAndCompare />
      <PricingSection />
      <EnterpriseTrustAndFinal />
      <Footer />
    </main>
  );
}
