// src/App.tsx
import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import LandingPage from "@/pages/LandingPage";
import AuditPage from "@/pages/AuditPage";
import WormholePage from "@/pages/WormholePage";
import MintNFT from "@/pages/MintNFT";
import PDFViewer from "@/pages/PDFViewer";
import NFTList from "@/pages/NFTList";
import NotFound from "@/pages/not-found";
import { queryClient } from "./lib/queryClient";

// Define the type for audit data passed between pages.
export type AuditData = {
  id?: number;
  contractName: string;
  contractCode: string;
  blockchain: string;
  auditResult?: string;
  ipfsHash?: string;
  pdfUrl?: string;
  ethAmount?: string;
  vulnerabilityScore?: number;
};

function App() {
  // Get the current location from wouter so we can update the document title.
  const [location] = useLocation();

  // Manage audit data state – this is shared among pages.
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  // Manage the current step of the audit process.
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Update the document title based on the current route.
  useEffect(() => {
    const titles: { [key: string]: string } = {
      "/": "AuditWarp - Smart Contract Audits & NFT Certificates",
      "/audit": "Smart Contract Audit | AuditWarp",
      "/bridge": "Cross-Chain Bridge | AuditWarp",
      "/mint": "NFT Certification | AuditWarp",
      "/report": "Audit Report | AuditWarp",
      "/nfts": "My NFTs | AuditWarp",
    };
    document.title =
      titles[location] ||
      "AuditWarp - Cross-Chain Smart Contract Audit Platform";
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route>
            <Layout currentPath={location}>
              <Route
                path="/audit"
                component={() => (
                  <AuditPage
                    setAuditData={setAuditData}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                  />
                )}
              />
              <Route
                path="/bridge"
                component={() => (
                  <WormholePage
                    auditData={auditData}
                    setAuditData={setAuditData}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                  />
                )}
              />
              <Route
                path="/mint"
                component={() => (
                  <MintNFT
                    auditData={auditData}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                  />
                )}
              />
              <Route
                path="/report"
                component={() => (
                  <PDFViewer auditData={auditData} currentStep={currentStep} />
                )}
              />
              <Route path="/nfts" component={NFTList} />
            </Layout>
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
