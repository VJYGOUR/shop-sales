import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Navigation */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Stoq
                  </h1>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#features"
                  className="text-gray-300 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105"
                >
                  Features
                </a>
                <a
                  href="#testimonials"
                  className="text-gray-300 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105"
                >
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="text-gray-300 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105"
                >
                  Pricing
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative">Go to Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative">Get Started Free</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
              <span className="text-cyan-400 text-sm font-medium">
                Trusted by 5000+ businesses worldwide
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Business Intelligence
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Reimagined
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade analytics and inventory management for visionary
              businesses.
              <span className="text-cyan-400 font-semibold">
                {" "}
                87% faster decision making
              </span>{" "}
              with real-time insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative flex items-center space-x-2">
                    <span>Launch Dashboard</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      🚀
                    </span>
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative">Start Free Trial</span>
                  </Link>
                  <Link
                    to="/login"
                    className="group relative border-2 border-cyan-400/50 text-cyan-400 px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-500 transform hover:scale-105"
                  >
                    <span className="relative">Book a Demo</span>
                  </Link>
                </>
              )}
            </div>

            {/* Stats Bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-cyan-300 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Hero Preview */}
          <div className="mt-24 max-w-6xl mx-auto">
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/10">
              {/* Floating Elements */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-500"></div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Dashboard Preview */}
                <div className="bg-gradient-to-br from-slate-800 to-cyan-900 rounded-2xl p-6 text-white lg:col-span-2 shadow-2xl border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-cyan-300">
                      Sales Dashboard
                    </h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse delay-200"></div>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse delay-400"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                      <p className="text-sm opacity-90">Today's Sales</p>
                      <p className="text-2xl font-bold text-cyan-300">
                        ₹12,847
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                      <p className="text-sm opacity-90">Products</p>
                      <p className="text-2xl font-bold text-cyan-300">24</p>
                    </div>
                  </div>
                  <div className="h-32 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-full px-4">
                      <div className="flex items-end space-x-2 h-16">
                        {[30, 50, 70, 90, 60, 40, 80].map((height, index) => (
                          <div
                            key={index}
                            className="flex-1 bg-gradient-to-t from-cyan-400 to-cyan-600 rounded-t-lg transition-all duration-500 hover:from-cyan-300 hover:to-cyan-500"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Stats Preview */}
                <div className="space-y-6">
                  {previewStats.map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-400/30 transition-all duration-500 hover:scale-105 shadow-2xl"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-cyan-300">{stat.label}</p>
                          <p className="text-2xl font-bold text-white">
                            {stat.value}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-400/30">
                          <span className="text-xl">{stat.icon}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section
        id="features"
        className="py-24 bg-gradient-to-b from-slate-900 to-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Enterprise Features,
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                Simplified
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to scale your business, packed into one
              intuitive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-cyan-400/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative py-24 bg-gradient-to-r from-cyan-900/50 via-blue-900/50 to-purple-900/50 overflow-hidden">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"></div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Revolutionize Your Business?
          </h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join 5,000+ forward-thinking businesses that trust Stoq to drive
            growth and maximize efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/dashboard"
                className="group relative bg-white text-cyan-600 px-10 py-5 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="relative flex items-center space-x-2">
                  <span>Go to Dashboard</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    🚀
                  </span>
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="group relative bg-white text-cyan-600 px-10 py-5 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
                >
                  <span className="relative">Start Free Trial</span>
                </Link>
                <Link
                  to="/login"
                  className="group relative border-2 border-white text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-white hover:text-cyan-600 transition-all duration-500 transform hover:scale-105"
                >
                  <span className="relative">Schedule Demo</span>
                </Link>
              </>
            )}
          </div>
          <p className="text-cyan-200 mt-6 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-white py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Stoq
                </h3>
              </div>
              <p className="text-gray-400">
                Empowering the next generation of business leaders with
                intelligent tools.
              </p>
            </div>
            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold text-cyan-300 mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-3 text-gray-400">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="hover:text-cyan-400 transition-all duration-300 hover:translate-x-1 inline-block"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 Stoq. All rights reserved. Built with ❤️ for visionary
              businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Enhanced data arrays
const stats = [
  { value: "5,000+", label: "Active Businesses" },
  { value: "87%", label: "Faster Decisions" },
  { value: "24/7", label: "Real-time Analytics" },
  { value: "99.9%", label: "Uptime SLA" },
];

const previewStats = [
  {
    icon: "📦",
    label: "Active Products",
    value: "24",
  },
  {
    icon: "💰",
    label: "Monthly Profit",
    value: "₹8,429",
  },
  {
    icon: "📈",
    label: "Growth Rate",
    value: "+32%",
  },
];

const features = [
  {
    icon: "📊",
    title: "Real-time Analytics",
    description:
      "AI-powered insights and predictive analytics with live dashboards and automated reporting.",
  },
  {
    icon: "📦",
    title: "Smart Inventory",
    description:
      "AI-driven stock predictions and automated reordering to eliminate stockouts and overstocking.",
  },
  {
    icon: "💰",
    title: "Revenue Intelligence",
    description:
      "Advanced profit tracking, trend analysis, and revenue forecasting with 95% accuracy.",
  },
  {
    icon: "👥",
    title: "Customer 360",
    description:
      "Complete customer profiles with behavior analytics and personalized engagement tools.",
  },
  {
    icon: "📱",
    title: "Omnichannel",
    description:
      "Seamless experience across all devices with offline capability and instant sync.",
  },
  {
    icon: "🔒",
    title: "Bank-Grade Security",
    description:
      "Military-grade encryption, SOC 2 compliance, and real-time threat detection.",
  },
];

const footerSections = [
  {
    title: "Product",
    links: [
      { href: "#features", text: "Features" },
      { href: "#pricing", text: "Pricing" },
      { href: "#", text: "API" },
      { href: "#", text: "Integrations" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", text: "About" },
      { href: "#", text: "Blog" },
      { href: "#", text: "Careers" },
      { href: "#", text: "Press" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "#", text: "Help Center" },
      { href: "#", text: "Contact" },
      { href: "#", text: "Status" },
      { href: "#", text: "Documentation" },
    ],
  },
];

export default Home;
