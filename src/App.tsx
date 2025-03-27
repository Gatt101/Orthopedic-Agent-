import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Chat } from './components/Chat';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <Hero />
      <main id="chat-section" className="flex-1 container mx-auto px-4 py-16">
        <Chat />
      </main>
      <Footer />
    </div>
  );
}

export default App;