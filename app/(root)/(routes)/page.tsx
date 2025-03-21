'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Plane, 
  Brain, 
  Sparkles, 
  Zap, 
  TreePine, 
  Clock, 
  Globe, 
  CalendarDays, 
  MapPin, 
  PenTool, 
  FileText, 
  Cloud, 
  Lightbulb,
  MessageSquare,
  Compass,
  Network,
  ChevronRight,
  Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';

const FuturisticHomePage = () => {
  const [activeAgent, setActiveAgent] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showParticles, setShowParticles] = useState(false);

  // Handle mouse movement for the interactive background effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Show particles with a delay for better initial loading experience
    const timer = setTimeout(() => setShowParticles(true), 500);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  // For the floating elements animation
  const floatingElements = Array(30).fill(0).map((_, i) => ({
    id: i,
    size: Math.random() * 10 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  // The three agents data
  const agents = [
    {
      id: 1,
      name: "NovaTrek",
      subName: "Travel Planner",
      icon: <Plane className="w-10 h-10" />,
      description: "Experience AI-powered travel planning. Get personalized itineraries, real-time recommendations, and interactive maps for your dream destinations.",
      features: ["Custom itineraries", "Interactive maps", "Local insights", "Budget optimization", "Real-time recommendations"],
      gradient: "from-cyan-500 via-blue-500 to-purple-500",
      available: true,
      link: "/agents1" as string,
      bgPattern: "bg-[url('/noise.svg')] bg-repeat opacity-10"
    },
    {
      id: 2,
      name: "DropThought",
      subName: "Note Taking",
      icon: <PenTool className="w-10 h-10" />,
      description: "Revolutionize your note-taking with AI that organizes, connects, and enhances your thoughts. Capture ideas instantly and transform them into actionable insights.",
      features: ["Smart organization", "Cross-linked ideas", "Voice-to-text", "Multi-media support", "Semantic search"],
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      available: false,
      comingSoonDate: "Summer 2025",
      bgPattern: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent"
    },
    {
      id: 3,
      name: "Nexus",
      subName: "Productivity Tree",
      icon: <TreePine className="w-10 h-10" />,
      description: "Visualize your productivity with an AI-powered mind mapping system that grows as you accomplish tasks, connecting your work in meaningful, revealing patterns.",
      features: ["Visual task mapping", "Progress visualization", "AI connections", "Team collaboration", "Growth metrics"],
      gradient: "from-amber-500 via-orange-500 to-pink-500",
      available: false,
      comingSoonDate: "Fall 2025",
      bgPattern: "bg-[conic-gradient(var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent"
    }
  ];

  // Paralax effect for hero section
  const calculateTransform = (depth: number) => {
    const x = (mousePosition.x - window.innerWidth / 2) * depth;
    const y = (mousePosition.y - window.innerHeight / 2) * depth;
    return `translate(${x / 100}px, ${y / 100}px)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white overflow-hidden relative">
      {/* Interactive background with particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingElements.map(elem => (
            <motion.div
              key={elem.id}
              className="absolute rounded-full bg-blue-500/20 backdrop-blur-sm"
              style={{
                width: elem.size,
                height: elem.size,
                left: `${elem.x}%`,
                top: `${elem.y}%`,
              }}
              animate={{
                y: ["-20px", "20px", "-20px"],
                x: ["0px", "30px", "0px"],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: elem.duration,
                repeat: Infinity,
                delay: elem.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Grid lines effect */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]"></div>
      
      {/* Interactive glow effect following cursor */}
      <div 
        className="absolute pointer-events-none opacity-30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-[120px] rounded-full w-[40vw] h-[40vw]"
        style={{
          left: mousePosition.x - 400,
          top: mousePosition.y - 400,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.5s cubic-bezier(.17,.67,.83,.67), top 0.5s cubic-bezier(.17,.67,.83,.67)'
        }}
      ></div>

      <main className="relative z-10">
        {/* Navbar */}
        <nav className="backdrop-blur-sm bg-black/30 border-b border-white/5 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-blue-400" />
                <motion.div 
                  className="absolute inset-0 text-blue-500 opacity-75"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-8 h-8" />
                </motion.div>
              </div>
              <span className="ml-2 text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Quipit</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#agents" className="text-gray-300 hover:text-white transition-colors">Agents</a>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-gray-300 hover:text-white transition-colors">Login</a>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 md:py-32 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-12 md:mb-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-md border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
                    AI Agents for 2025
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200">Your Personal</span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">AI Ecosystem</span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8 max-w-xl" style={{ transform: calculateTransform(0.2) }}>
                    Experience the future of productivity with intelligent AI agents that transform how you travel, organize thoughts, and manage tasks.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full px-8 py-6 h-auto text-lg"
                    >
                      Get Started
                    </Button>
                    
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-6 h-auto text-lg"
                    >
                      <span className="flex items-center">
                        <span>Watch Demo</span>
                        <Zap className="ml-2 w-5 h-5" />
                      </span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-black text-xs font-bold">
                          {['JD', 'SD', 'AP', 'MK'][i-1]}
                        </div>
                      ))}
                    </div>
                    <div className="text-gray-300 text-sm">
                      <span className="text-blue-400 font-semibold">4,000+</span> active users
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div className="md:w-1/2 relative" style={{ transform: calculateTransform(0.1) }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative"
                >
                  {/* 3D-looking card for hero illustration */}
                  <div className="w-full h-[450px] relative perspective-1000 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl flex items-center justify-center transform transition-transform duration-500 group-hover:rotate-y-12 group-hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-900/50 rounded-2xl"></div>
                      
                      {/* Animated elements inside the 3D card */}
                      <div className="relative z-10 px-8 py-10 w-full h-full overflow-hidden">
                        <div className="absolute top-2 left-2 right-2 h-12 bg-black/50 rounded-lg border-t border-white/10 backdrop-blur-md flex items-center px-4">
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="mx-auto text-sm text-gray-400">AI Agent Terminal</div>
                        </div>
                        
                        <div className="mt-16 space-y-4 font-mono">
                          <div className="flex">
                            <span className="text-green-500 mr-2">$</span>
                            <span className="text-gray-300">initializing quipit agents...</span>
                          </div>
                          
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="flex"
                          >
                            <span className="text-green-500 mr-2">$</span>
                            <span className="text-gray-300">loading NovaTrek travel planner...</span>
                          </motion.div>
                          
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="flex"
                          >
                            <span className="text-green-500 mr-2">$</span>
                            <span className="text-gray-300">accessing travel APIs...</span>
                          </motion.div>
                          
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 0.5 }}
                            className="flex"
                          >
                            <span className="text-green-500 mr-2">$</span>
                            <span className="text-gray-300">initializing DropThought...</span>
                          </motion.div>
                          
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2, duration: 0.5 }}
                            className="flex"
                          >
                            <span className="text-green-500 mr-2">$</span>
                            <span className="text-gray-300">preparing Nexus productivity tree...</span>
                          </motion.div>
                          
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.5, duration: 0.5 }}
                            className="flex"
                          >
                            <span className="text-green-500 mr-2">$</span>
                            <span className="text-blue-400">all systems operational. Ready to assist.</span>
                          </motion.div>
                        </div>
                        
                        {/* Animated elements */}
                        <div className="absolute bottom-8 right-8 flex space-x-4">
                          <motion.div
                            animate={{ 
                              y: [0, -10, 0],
                              opacity: [1, 0.6, 1]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              delay: 0.2
                            }}
                          >
                            <Globe className="w-12 h-12 text-blue-500/70" />
                          </motion.div>
                          
                          <motion.div
                            animate={{ 
                              y: [0, -10, 0],
                              opacity: [1, 0.6, 1]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              delay: 0.5
                            }}
                          >
                            <FileText className="w-12 h-12 text-teal-500/70" />
                          </motion.div>
                          
                          <motion.div
                            animate={{ 
                              y: [0, -10, 0],
                              opacity: [1, 0.6, 1]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              delay: 0.8
                            }}
                          >
                            <TreePine className="w-12 h-12 text-orange-500/70" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Showcase Section */}
        <section id="agents" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Meet Your AI Agents
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Crafted with cutting-edge AI, our agents work seamlessly to enhance different aspects of your life.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: agent.id * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className={`relative rounded-2xl overflow-hidden group`}
                >
                  {/* Background with gradient and pattern */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-10`}></div>
                  <div className={`absolute inset-0 ${agent.bgPattern}`}></div>
                  
                  {/* Card Content */}
                  <div className="relative z-10 p-8 h-full bg-gray-950/80 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br ${agent.gradient} text-white mb-4`}>
                      {agent.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-1 text-white">
                      {agent.name}
                    </h3>
                    <p className={`text-sm mb-4 text-transparent bg-clip-text bg-gradient-to-r ${agent.gradient}`}>
                      {agent.subName}
                    </p>
                    
                    <p className="text-gray-300 mb-6">
                      {agent.description}
                    </p>
                    
                    <div className="mb-8">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Key Features</h4>
                      <ul className="space-y-2">
                        {agent.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <div className={`p-1 rounded-full bg-gradient-to-br ${agent.gradient} text-white mr-2 mt-0.5`}>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Coming Soon Overlay for unavailable agents */}
                    {!agent.available && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${agent.gradient} text-white font-medium mb-2`}>
                          Coming Soon
                        </div>
                        <p className="text-white text-lg font-medium">{agent.comingSoonDate}</p>
                      </div>
                    )}
                    
                    {/* Action button */}
                    <div className="mt-auto">
                    {agent.available ? (
                      // @ts-ignore
  <Link href={agent.link} legacyBehavior>
    <a>
      <Button 
        className={`w-full bg-gradient-to-r ${agent.gradient} hover:opacity-90 text-white`}
      >
        Try {agent.name} Now
      </Button>
    </a>
  </Link>
) : (
  <Button 
    className="w-full bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-not-allowed"
    disabled
  >
    Join Waitlist
  </Button>
)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gradient-to-b from-black to-gray-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Quantum Leap in AI Technology
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our agents harness cutting-edge AI to deliver experiences that feel like science fiction.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Brain className="w-8 h-8" />,
                  title: "Neural Understanding",
                  description: "Our agents understand context, nuance, and your preferences with remarkable depth."
                },
                {
                  icon: <Network className="w-8 h-8" />,
                  title: "Cross-Agent Intelligence",
                  description: "Agents communicate with each other to provide a seamless, integrated experience."
                },
                {
                  icon: <Globe className="w-8 h-8" />,
                  title: "Real-Time Data Access",
                  description: "Constantly updated information ensures recommendations are always current."
                },
                {
                  icon: <MessageSquare className="w-8 h-8" />,
                  title: "Natural Conversation",
                  description: "Interact with your agents through natural language just like talking to a human expert."
                },
                {
                  icon: <Lightbulb className="w-8 h-8" />,
                  title: "Predictive Intelligence",
                  description: "Anticipates your needs based on patterns and preferences before you ask."
                },
                {
                  icon: <Compass className="w-8 h-8" />,
                  title: "Contextual Awareness",
                  description: "Understands your environment and adapts recommendations accordingly."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl"
                >
                  <div className="p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg inline-block mb-4 text-blue-400">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                {[1, 2, 3, 4, 5].map(i => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-blue-500/10"
                    style={{
                      width: Math.random() * 300 + 100,
                      height: Math.random() * 300 + 100,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      x: [0, 50, 0],
                      y: [0, 30, 0],
                      opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                      duration: 10 + i * 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200">
                  Ready to Experience the Future?
                </h2>
                
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Start with our fully functional NovaTrek travel agent today, and be first in line when our other groundbreaking agents launch.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link href="/agents1" legacyBehavior>
  <a>
    <Button 
      size="lg" 
      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full px-8 py-6 h-auto text-lg"
    >
      Try NovaTrek Now
    </Button>
  </a>
</Link>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-6 h-auto text-lg"
                  >
                    <span className="flex items-center">
                      <span>Join Waitlist</span>
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-950 pt-16 pb-8 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center mb-4">
                  <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
                  <span className="text-xl font-bold text-white">Quipit</span>
                </div>
                
                <p className="text-gray-400 mb-4">
                  AI that works for you. Revolutionizing travel, note-taking, and productivity.
                </p>
                
                <div className="flex space-x-4">
                  {['twitter', 'facebook', 'instagram', 'linkedin'].map(social => (
                    <a 
                      key={social}
                      href={`https://${social}.com/Ai.Quipit`}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="sr-only">{social}</span>
                      {/* Social icons simplified */}
                      <div className="w-4 h-4"></div>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Products</h3>
                <ul className="space-y-3">
                  <li><a href="/agents1" className="text-gray-400 hover:text-blue-400 transition-colors">NovaTrek</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">DropThought</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Nexus</a></li>
                  <li><a href="/pricing" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><a href="/about" className="text-gray-400 hover:text-blue-400 transition-colors">About Us</a></li>
                  <li><a href="/careers" className="text-gray-400 hover:text-blue-400 transition-colors">Careers</a></li>
                  <li><a href="/blog" className="text-gray-400 hover:text-blue-400 transition-colors">Blog</a></li>
                  <li><a href="/privacy-policy" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <MapPin className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                    <span className="text-gray-400">95A Park Street, Kolkata 700016</span>
                  </li>
                  <li className="flex items-start">
                    <MessageSquare className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                    <span className="text-gray-400">customercare@quipit.com</span>
                  </li>
                  <li className="flex items-start">
                    <Clock className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                    <span className="text-gray-400">Mon-Sat (9.30AM-6.30PM)</span>
                  </li>
                  <li className="flex items-start">
                    <Phone className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                    <span className="text-gray-400">+919830016577</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} Quipit. All rights reserved.
              </p>
              
              <div className="flex space-x-6">
                <a href="/privacy-policy" className="text-gray-500 hover:text-blue-400 text-sm">Privacy</a>
                <a href="/terms" className="text-gray-500 hover:text-blue-400 text-sm">Terms</a>
                <a href="/cookies" className="text-gray-500 hover:text-blue-400 text-sm">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default FuturisticHomePage;