import { Nav } from "@/components/Nav";
import { Bento } from "@/components/sections/Bento";
import { Download } from "@/components/sections/Download";
import { Cover } from "@/components/sections/Cover";
import { Film } from "@/components/sections/Film";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Deck } from "@/components/Deck";
import { Product } from "@/components/sections/Product";
import { Providers } from "@/components/sections/Providers";
import { Skills } from "@/components/sections/Skills";
import { Security } from "@/components/sections/Security";
import { WhatsNew } from "@/components/sections/WhatsNew";

export default function Home() {
  return (
    <>
      <Nav />
      <Deck />
      <main>
        <Cover />
        <Film />
        <WhatsNew />
        <HowItWorks />
        <Product />
        <Bento />
        <Skills />
        <Providers />
        <Security />
        <Download />
      </main>
    </>
  );
}
