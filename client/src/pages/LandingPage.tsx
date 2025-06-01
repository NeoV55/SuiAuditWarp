import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Award, Zap, ArrowRight, CheckCircle } from "lucide-react";
import logo from "../../../attached_assets/logo-removebg-preview.png";
import logo1 from "../../../attached_assets/AuditWarp-Labs.png";

export default function LandingPage() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-blue-400" />,
      title: "Automated Audits",
      description:
        "Run thorough smart contract audits quickly using our AI-powered tools and comprehensive security analysis.",
    },
    {
      icon: <Award className="h-8 w-8 text-purple-400" />,
      title: "NFT Certificates",
      description:
        "Mint secure NFT certificates to verify your audit results on the blockchain with permanent proof of security.",
    },
    {
      icon: <Shield className="h-8 w-8 text-green-400" />,
      title: "Cross-Chain Support",
      description:
        "Connect multiple wallets and audit contracts across different blockchain networks seamlessly.",
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-400" />,
      title: "Walrus Storage",
      description:
        "Decentralized blob storage by Mysten Labs ensures your audit reports are permanently accessible and censorship-resistant.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description:
        "Simply connect your Sui or MetaMask wallet to get started with the platform.",
    },
    {
      number: "02",
      title: "Upload Your Contract",
      description:
        "Submit your smart contract code for a comprehensive AI-powered security audit.",
    },
    {
      number: "03",
      title: "Mint Your NFT Certificate",
      description:
        "Generate and mint an NFT certificate for your audit report with blockchain verification.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header/Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="AuditWarp Logo"
              className="h-26 mx-auto mb-6 bg-transparent"
              style={{ backgroundColor: "transparent" }}
            />
          </div>

          {/* Hero Content */}
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AuditWarp
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Smart Contract Audits Made Easy – Secure your audits with NFT
              certificates in just a few clicks
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/audit">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Start Auditing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/nfts">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3"
                >
                  View My NFTs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Smart Contract Security
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to audit, verify, and secure your smart
              contracts with blockchain-verified certificates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-dark-800 border-dark-700 hover:border-blue-500/50 transition-all duration-300"
              >
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get started with AuditWarp in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="bg-dark-900 border-dark-700 h-full">
                  <CardContent className="p-8">
                    <div className="text-6xl font-bold text-blue-400/20 mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                    <div className="mt-6">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Arrow connector (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Secure Your Smart Contracts?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join AuditWarp today and secure your smart contract audits with
              our state-of-the-art NFT certification system.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/audit">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/bridge">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3"
                >
                  Explore Bridge
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-dark-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <img
                src={logo1}
                alt="AuditWarp Logo"
                className="h-32 mb-4 bg-transparent"
                style={{ backgroundColor: "transparent" }}
              />
              <p className="text-gray-400 max-w-md">
                Secure your smart contracts with AI-powered audits and
                blockchain-verified NFT certificates.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/audit"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Start Audit
                  </Link>
                </li>
                <li>
                  <Link
                    href="/nfts"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    My NFTs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/bridge"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Bridge Assets
                  </Link>
                </li>
                <li>
                  <Link
                    href="/report"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Audit Reports
                  </Link>
                </li>
                <li>
                  <Link
                    href="/audit"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Move AuditWarp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Rustc AuditWarp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Solidity AuditWarp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Vyper AuditWarp
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-gray-400">Documentation</span>
                </li>
                <li>
                  <span className="text-gray-400">FAQ</span>
                </li>
                <li>
                  <span className="text-gray-400">Contact Us</span>
                </li>
                <li>
                  <span className="text-gray-400">Help Center</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 AuditWarp Labs. All rights reserved. Securing smart
              contracts with blockchain verification.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
