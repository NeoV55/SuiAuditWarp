import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { Theme } from "@radix-ui/themes";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import "@radix-ui/themes/styles.css";
import { Toaster } from "@/components/ui/toaster";
import { networkConfig } from "./networkConfig";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={{ testnet: { url: "https://fullnode.testnet.sui.io" } }}
        defaultNetwork="testnet"
      >
        <WalletProvider autoConnect={true}>
          <Theme appearance="dark" accentColor="cyan">
            <Toaster />
            <ToastContainer position="bottom-right" theme="dark" />
            <App />
          </Theme>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
