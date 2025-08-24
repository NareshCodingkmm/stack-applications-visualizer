import React, { useState, useEffect } from 'react';
import InfixToPostfixVisualizer from './components/InfixToPostfixVisualizer';
import InfixToPrefixVisualizer from './components/InfixToPrefixVisualizer';
import PostfixEvaluationVisualizer from './components/PostfixEvaluationVisualizer';
import PrefixEvaluationVisualizer from './components/PrefixEvaluationVisualizer';
import { Sun, Moon } from 'lucide-react';
import './App.css';

function App() {
  const [selectedVisualizer, setSelectedVisualizer] = useState('infixToPostfix');
  // ===== CHANGED: Default theme is now 'light' =====
  const [theme, setTheme] = useState('light');

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
    infixToPrefix: {
      name: 'Infix to Prefix Conversion',
      component: <InfixToPrefixVisualizer />,
    },
    postfixEvaluation: {
      name: 'Evaluation of Postfix Expression',
      component: <PostfixEvaluationVisualizer />,
    },
    prefixEvaluation: {
      name: 'Evaluation of Prefix Expression',
      component: <PrefixEvaluationVisualizer />,
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