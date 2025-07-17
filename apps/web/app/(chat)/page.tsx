import Chat from "@/components/Chat";
import Footer from "@/components/Footer";
import Header from "@/components/Header";


export default function Home() {

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col h-screen z-10 relative">
        <Header />
        <div className="flex-1">
          <Chat />
        </div>
        <Footer />
    </div>
  );
}
