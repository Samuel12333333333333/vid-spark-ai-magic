
import { Outlet } from "react-router-dom";
import MainHeader from "@/components/layout/MainHeader";
import Footer from "@/components/layout/Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <MainHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
