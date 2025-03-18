
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NetworkToggle from "@/components/NetworkToggle";

const SidebarMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-unikron-navy-dark border-unikron-blue/20 w-[300px] py-8">
        <div className="flex flex-col gap-8 h-full">
          {/* Network Section - Now Only Option */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80 px-1">Network</h3>
            <div className="px-1">
              <NetworkToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SidebarMenu;
