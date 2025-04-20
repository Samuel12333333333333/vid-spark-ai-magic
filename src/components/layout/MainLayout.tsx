
import { Outlet } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import Footer from "@/components/layout/Footer";
import { ChatBubble } from "@/components/landing/ChatBubble";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <MainHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <div className="fixed bottom-4 right-4 z-50">
        <ChatBubble />
      </div>
    </div>
  );
}
