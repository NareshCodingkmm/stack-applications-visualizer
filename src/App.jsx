import React, { useState, useEffect } from 'react';
import InfixToPostfixVisualizer from './components/InfixToPostfixVisualizer';
import { Sun, Moon } from 'lucide-react';
import './App.css';

function App() {
  const [selectedVisualizer, setSelectedVisualizer] = useState('infixToPostfix');
  // CHANGED: Default theme is now 'light'
  const [theme, setTheme] = useState('light');

  // Effect to update the body class when the theme changes
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const visualizers = {
    infixToPostfix: {
      name: 'Infix to Postfix Conversion',
      component: <InfixToPostfixVisualizer />,
    },
  };

  return (
    <div className={`App ${theme}`}>
      <header className="App-header">
        <h1>Stack Applications Visualizer - Naresh Kumar Siripurapu</h1>
        <div className="header-controls">
          <div className="visualizer-selector">
            <select 
              value={selectedVisualizer} 
              onChange={(e) => setSelectedVisualizer(e.target.value)}
            >
              {Object.entries(visualizers).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>
          {/* ADDED: New container for the theme toggle for better layout and clarity */}
          <div className="theme-toggle-container">
            <label htmlFor="theme-toggle-btn">Toggle Theme</label>
            <button id="theme-toggle-btn" onClick={toggleTheme} className="theme-toggle">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>
      <main>
        {visualizers[selectedVisualizer].component}
      </main>
    </div>
  );
}

export default App;