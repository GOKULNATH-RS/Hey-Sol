import Chat from "@/components/Chat";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeySol from "@/components/HeySol";
import { RPC_URL } from "@hey-sol/shared/constants";
 
export default function Home() {


  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-transparent flex flex-col h-screen z-10 relative">
        <Header />
        <HeySol />
        <Chat />
        <Footer />
    </div>
  );
}
