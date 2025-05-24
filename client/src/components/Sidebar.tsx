import { Link } from "wouter";
import SuiWalletButton from "./SuiWalletButton";
import EvmWalletConnect from "./EvmWalletConnect";
import NetworkSwitcher from "./NetworkSwitcher";
import logo from "../../../attached_assets/logo-text-removebg-preview_1748011262574.png"; // Adjust with your actual path

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const navItems = [
    { path: "/", icon: "security", label: "Audit Contract" },
    { path: "/bridge", icon: "swap_horiz", label: "Bridge Assets" },
    { path: "/nfts", icon: "collections", label: "My NFTs" },
    { path: "/report", icon: "history", label: "Audit Report" },
  ];

  return (
    <aside className="flex flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-dark-800 bg-sidebar">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-dark-800">
          <Link href="/">
            <div className="text-xl font-bold text-white flex items-center cursor-pointer">
              <img
                src={logo}
                alt="SuiAudit Warp Logo"
                className="h-20 w-auto bg-transparent" // Made background transparent
                style={{ backgroundColor: "transparent" }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/default-logo.png";
                }}
              />
            </div>
          </Link>
        </div>

        {/* Sui Wallet Button - Primary Network */}
        <SuiWalletButton />

        {/* EVM Wallet Connect - Optional */}
        <div className="border-b border-dark-800 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
            Optional Connections
          </h3>
          <EvmWalletConnect />
        </div>

        {/* Network Switcher */}
        <NetworkSwitcher />

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  currentPath === item.path
                    ? "text-white bg-primary-700"
                    : "text-gray-300 hover:bg-dark-800 hover:text-white"
                }`}
              >
                <span
                  className={`material-icons mr-3 ${currentPath === item.path ? "text-white" : "text-gray-400"}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="flex items-center p-4 border-t border-dark-800">
          <div className="flex-shrink-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-700">
              <span className="text-sm font-medium leading-none text-white">
                AU
              </span>
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">AuditWarp User</p>
            <p className="text-xs text-gray-400">View profile</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
