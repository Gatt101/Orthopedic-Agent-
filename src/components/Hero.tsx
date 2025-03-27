import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Brain, Shield, Zap, Upload, FileText, Clock, CheckCircle, ChevronDown } from 'lucide-react';

export const Hero = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [showChat, setShowChat] = useState(false);

  const features = [
    {
      icon: <Upload className="h-8 w-8" />,
      title: "X-Ray Image Upload",
      description: "Easily upload X-ray images for instant analysis by our AI model."
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI algorithms detect and analyze fractures with high accuracy."
    },
    {
      icon: <ChevronDown className="h-8 w-8" />,
      title: "Severity Assessment",
      description: "Get detailed severity assessment to understand the fracture condition."
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Detailed Reports",
      description: "Receive comprehensive reports with treatment recommendations."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Instant Results",
      description: "Get analysis results in seconds, not days or hours."
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Expert Validation",
      description: "Our AI model is trained on thousands of expert-validated X-rays."
    }
  ];

  const scrollToChat = () => {
    setShowChat(true);
    const chatElement = document.getElementById('chat-section');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 pt-20 pb-32">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400 rounded-full filter blur-[100px] opacity-20 dark:opacity-30"
          />

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="block"
            >
              Orthopedic
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-blue-600 dark:text-blue-400"
            >
              Agent
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12"
          >
            Your AI-powered orthopedic assistant that provides instant, accurate analysis of X-ray images.
            Perfect for healthcare professionals and medical students.
          </motion.p>

          <motion.button
            onClick={scrollToChat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-semibold 
                     hover:bg-blue-700 transform hover:shadow-xl transition-all duration-300"
          >
            Explore Interface
          </motion.button>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl 
                       transform hover:-translate-y-1 transition-all duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="text-blue-600 dark:text-blue-400 mb-6"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gray-400 dark:text-gray-500"
          >
            <ChevronDown className="h-8 w-8" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};