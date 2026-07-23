"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Lock, Globe, Code, BarChart3, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  const features = [
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description: "Implement traditional RBAC with hierarchical roles and granular permissions for your organization.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: Zap,
      title: "Attribute-Based Access Control",
      description: "Dynamic, contextual decisions based on user attributes, environment conditions, and resource properties.",
      color: "from-teal-500 to-cyan-600",
    },
    {
      icon: Lock,
      title: "Plan-Based Entitlements",
      description: "Feature gating based on subscription tiers and billing plans with automatic entitlement management.",
      color: "from-cyan-500 to-sky-600",
    },
    {
      icon: Globe,
      title: "Usage-Based Limits",
      description: "Quota enforcement and metering for API calls, storage, and other usage-based pricing models.",
      color: "from-sky-500 to-blue-600",
    },
    {
      icon: Code,
      title: "Developer-Friendly SDK",
      description: "Type-safe SDKs for Node.js, Python, and Go with comprehensive documentation and examples.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Monitor authorization decisions, track usage patterns, and get insights into your access control system.",
      color: "from-indigo-500 to-violet-600",
    },
  ];

  const benefits = [
    "Enterprise-grade security with SOC 2 compliance",
    "Sub-millisecond decision latency",
    "99.99% uptime SLA guarantee",
    "GDPR and CCPA compliant",
    "24/7 enterprise support",
    "Flexible pricing based on usage",
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 mb-8"
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Enterprise Authorization Infrastructure</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Secure Access Control
              </span>
              <br />
              <span className="text-gray-900">for Modern SaaS</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              AccessForge provides authorization as a service, combining RBAC, ABAC, plan-based entitlements, 
              and usage-based limits in a unified, developer-friendly platform.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white border-2 border-emerald-200 text-emerald-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-emerald-300 transition-all"
              >
                View Documentation
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Authorization
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive access control features designed for modern SaaS applications
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose AccessForge?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built for scale, security, and simplicity. Our platform handles millions of authorization 
                decisions per day with sub-millisecond latency.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Calls Today</span>
                      <span className="text-2xl font-bold">2.4M</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white rounded-full h-2 w-3/4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Avg Latency</span>
                      <span className="text-2xl font-bold">0.8ms</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white rounded-full h-2 w-1/4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-2xl font-bold">99.99%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white rounded-full h-2 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-600">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Secure Your Application?
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Get started with AccessForge today and implement enterprise-grade authorization in minutes.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
          >
            Start Free Trial
          </motion.button>
        </motion.div>
      </section>

      {/* Privacy Policy Section */}
      <section id="privacy" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h2>
            <div className="prose prose-lg max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Collection</h3>
              <p className="text-gray-600 mb-6">
                AccessForge collects only the data necessary to provide our authorization services. 
                We collect entity identifiers, resource metadata, and authorization decision logs 
                for the purpose of service delivery and analytics.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Usage</h3>
              <p className="text-gray-600 mb-6">
                Your data is used solely to provide and improve our authorization services. 
                We never sell your data to third parties. All data is encrypted at rest and in transit.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h3>
              <p className="text-gray-600 mb-6">
                Authorization decision logs are retained for 90 days by default. 
                You can configure custom retention periods based on your compliance requirements.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing</h3>
              <p className="text-gray-600 mb-6">
                We do not share your data with third parties except as required by law or 
                with your explicit consent. Subprocessors are carefully vetted and bound by 
                strict data protection agreements.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Security</h3>
              <p className="text-gray-600 mb-6">
                We implement industry-standard security measures including encryption, 
                access controls, and regular security audits. Our platform is SOC 2 Type II 
                compliant and GDPR ready.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h3>
              <p className="text-gray-600 mb-6">
                You have the right to access, modify, or delete your data at any time. 
                Contact our support team for data-related requests or to exercise your rights.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
