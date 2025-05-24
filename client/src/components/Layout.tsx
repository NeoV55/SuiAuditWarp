import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useMedia } from "react-use";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
  currentPath: string;
}

export default function Layout({ children, currentPath }: LayoutProps) {
  const isWide = useMedia("(min-width: 768px)", true);

  return (
    <div className="flex h-screen overflow-hidden">
      {isWide ? (
        <Sidebar currentPath={currentPath} />
      ) : (
        <div className="bg-sidebar fixed top-0 w-full z-50 px-4 py-3 flex items-center justify-between border-b border-border">
          <Link href="/">
            <a className="text-xl font-bold text-white flex items-center">
              <span className="material-icons mr-2">security</span>
              AuditWarp
            </a>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-sidebar">
              <Sidebar currentPath={currentPath} />
            </SheetContent>
          </Sheet>
        </div>
      )}
      <main className="flex-1 overflow-y-auto bg-background pt-0 md:pt-0">
        {!isWide && <div className="h-14"></div>}
        {children}
      </main>
    </div>
  );
}
