
import WalletConnector from "@/components/walletconnector/WalletConnector";
import NetworkToggle from "@/components/NetworkToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarMenu from "@/components/layout/SidebarMenu";

const Navbar = () => {
  const isMobile = useIsMobile();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 h-14 sm:h-16 backdrop-blur-md bg-unikron-navy-dark/70 border-b border-unikron-blue/10">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/f7bf7061-1d66-4b9a-8b8a-c02479456db5.png"
            alt="UNIKRON"
            className="h-4 sm:h-5" 
          />
        </div>
        
        {isMobile ? (
          <div className="flex items-center gap-2">
            <WalletConnector />
            <SidebarMenu />
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4">
            <NetworkToggle />
            <WalletConnector />
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
