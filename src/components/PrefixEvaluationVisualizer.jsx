import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Binary, Download } from 'lucide-react';
import { BlobProvider } from '@react-pdf/renderer';
import LogPDF from './LogPDF';
import './InfixToPostfixVisualizer.css'; 

const isOperator = (token) => ['+', '-', '*', '/', '^'].includes(token);

const algorithmRules = [
  { text: "Create an empty stack. Start reading symbols one by one from right to left." },
  { text: "If the symbol is an operand, push it onto the stack." },
  { 
    text: "If the symbol is an operator:",
    subSteps: [
      { text: "Perform the pop operation twice to get operand1 and operand2 respectively." },
      { text: "Perform the calculation: result = operand1 (operator) operand2" },
      { text: "Push the result back onto the stack." }
    ]
  },
  { text: "After processing all the symbols, the value remaining in the stack is the final answer." }
];

const validatePrefix = (expression, tokens) => {
    const cleanedInfix = expression.replace(/\s+/g, '');
    const rejoinedTokens = tokens ? tokens.join('') : '';
    if (cleanedInfix !== rejoinedTokens) {
        return `Invalid characters found. Please use numbers and operators only.`;
    }

    let count = 0;
    // Validate by reading right-to-left
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        if (!isNaN(parseFloat(token))) {
            count++;
        } else if (isOperator(token)) {
            if (count < 2) return "Invalid Prefix Expression: Not enough operands for an operator.";
            count--;
        }
    }
    if (count !== 1) return "Invalid Prefix Expression: The final count of operands is not one.";
    return null;
};


function AlgorithmRule({ rule, path, highlightedPath }) {
  const isHighlighted = highlightedPath && JSON.stringify(path) === JSON.stringify(highlightedPath.slice(0, path.length));
  return (
    <li>
      <span className={isHighlighted ? 'highlighted-text' : ''}>{rule.text}</span>
      {rule.subSteps && (
        <ol className="sub-steps">
          {rule.subSteps.map((subRule, index) => (
            <AlgorithmRule key={index} rule={subRule} path={[...path, index]} highlightedPath={highlightedPath} />
          ))}
        </ol>
      )}
    </li>
  );
}


function PrefixEvaluationVisualizer() {
  const [prefix, setPrefix] = useState('- + * 5 3 8 / 4 2');
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [error, setError] = useState(null);
  const [expressionTokens, setExpressionTokens] = useState([]);
  const intervalRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) { return prev + 1; }
          setIsPlaying(false); clearInterval(intervalRef.current); return prev;
        });
      }, speed);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, steps.length, speed]);

  useEffect(() => {
    if (logContainerRef.current) {
        const element = logContainerRef.current;
        element.scrollTop = element.scrollHeight;
    }
  }, [currentStep]);


  const generateSteps = () => {
    setError(null);
    setSteps([]);
    setCurrentStep(0);
    
    const tokens = prefix.match(/\d+(\.\d+)?|[+\-*/^]/g) || [];
    setExpressionTokens(tokens);

    if (prefix.trim() === '') {
        setError("Expression cannot be empty.");
        return;
    }
    
    const validationError = validatePrefix(prefix, tokens);
    if (validationError) {
        setError(validationError);
        return;
    }

    const newSteps = [];
    let stack = [];
    const reversedTokens = [...tokens].reverse();
    
    newSteps.push({
      token: null, stack: [], explanation: 'Algorithm starts. Reading prefix expression from right to left.',
      highlightedRulePath: [0], tokenIndex: -1,
    });

    reversedTokens.forEach((token, reversedIndex) => {
      const tokenIndex = tokens.length - 1 - reversedIndex;
      let step = { token, stack: [...stack], tokenIndex };

      if (!isNaN(parseFloat(token))) {
        stack.push(parseFloat(token));
        step.stack = [...stack];
        step.explanation = `Symbol is an operand ('${token}'). Push it onto the stack.`;
        step.highlightedRulePath = [1];
      } else if (isOperator(token)) {
        if (stack.length < 2) {
            setError("Invalid Prefix Expression: Not enough operands for operator.");
            return;
        }
        const operand1 = stack.pop();
        const operand2 = stack.pop();
        let result;
        switch (token) {
            case '+': result = operand1 + operand2; break;
            case '-': result = operand1 - operand2; break;
            case '*': result = operand1 * operand2; break;
            case '/':
                if (operand2 === 0) {
                    setError("Error: Cannot divide by zero.");
                    return;
                }
                result = operand1 / operand2; 
                break;
            case '^': result = Math.pow(operand1, operand2); break;
            default: break;
        }
        stack.push(result);
        step.stack = [...stack];
        step.explanation = `Symbol is an operator ('${token}'). Pop ${operand1} and ${operand2}. Calculate ${operand1} ${token} ${operand2} = ${result}. Push result onto stack.`;
        step.highlightedRulePath = [2, 0, 1, 2];
      }
      newSteps.push(step);
    });
    
    newSteps.push({
      token: null, stack: [...stack], 
      explanation: `After processing all symbols, the final answer is ${stack[0]}.`,
      highlightedRulePath: [3],
      tokenIndex: -1,
    });
    setSteps(newSteps);
  };
  
  const handleReset = () => { setIsPlaying(false); setCurrentStep(0); setSteps([]); setError(null); setExpressionTokens([]); };
  const handlePlayPause = () => { if (steps.length === 0) generateSteps(); else setIsPlaying(!isPlaying); };
  const handleNext = () => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
  const handlePrev = () => currentStep > 0 && setCurrentStep(currentStep - 1);
  const currentData = steps[currentStep] || { stack: [], explanation: 'Enter a prefix expression and click Evaluate.', token: null, highlightedRulePath: null, tokenIndex: -1 };
  const stack = currentData.stack;

  const getFinalResult = () => {
    if (steps.length > 1) {
        const finalValue = steps[steps.length - 1].stack[0];
        const formattedResult = Number.isInteger(finalValue) ? finalValue : finalValue.toFixed(2);
        return `Final Answer: ${formattedResult}`;
    }
    return '';
  };

  return (
    <div className="visualizer-container">
      <div className="controls">
        <div className="input-group">
            <label htmlFor="prefix-input">Prefix Expression:</label>
            <input id="prefix-input" type="text" value={prefix} onChange={(e) => { setPrefix(e.target.value); setError(null); }} />
            <small className="input-note">Note: Please enter spaces between each number and operator.</small>
        </div>
        <button onClick={generateSteps}><Binary size={18}/> Evaluate</button>
        <button onClick={handleReset} className="clear-button"><RotateCcw size={18}/> Clear</button>
        <div className="navigation-controls">
          <button onClick={handlePrev} disabled={currentStep === 0}><SkipBack size={20}/></button>
          <button onClick={handlePlayPause} disabled={steps.length > 0 && currentStep === steps.length - 1}>{isPlaying ? <Pause size={20}/> : <Play size={20}/>}</button>
          <button onClick={handleNext} disabled={currentStep >= steps.length - 1}><SkipForward size={20}/></button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      {steps.length > 0 && !error && (
          <div className="expression-display">
              <div className="given-expression">
                <strong>Processing:</strong>
                <div className="expression-string">
                  {expressionTokens.map((t, index) => (
                    <span key={index} className={index === currentData.tokenIndex ? 'highlight-token' : 'token'}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
          </div>
      )}

      <div className="main-content-area">
        <div className="panels-container">
          <div className="panel algorithm-panel"><h3>Algorithm Steps</h3><ol>{algorithmRules.map((rule, index) => (<AlgorithmRule key={index} rule={rule} path={[index]} highlightedPath={currentData.highlightedRulePath} />))}</ol></div>
          <div className="panel explanation-panel"><h3>Explanation</h3><p>{currentData.explanation}</p></div>
          <div className="panel visualization-panel">
            <h3>Visualization</h3>
            <div className="stack-container">
              <h3>Operand Stack</h3>
              <div className="stack-visual-wrapper">
                <div className="stack-indices">{stack.map((_, index) => <div key={index} className="stack-index">{index}</div>)}</div>
                <div className="stack-visual">{stack.map((item, index) => <div key={index} className="stack-element">{Number.isInteger(item) ? item : item.toFixed(2)}</div>)}</div>
                {stack.length > 0 && <div className="stack-top-pointer" style={{ bottom: `${(stack.length-1) * 44 + 22}px`}}>TOP</div>}
              </div>
            </div>
          </div>
        </div>
        <div className="panel output-panel">
            <h3>Final Answer</h3>
            <div className="output-visual">
              {currentStep === steps.length - 1 ? (getFinalResult().replace('Final Answer: ', '')) : ''}
            </div>
        </div>
        
        {steps.length > 1 && !error && (
            <div className="panel log-panel">
                <h3>
                  Operations Log
                  {currentStep === steps.length - 1 && (
                    <BlobProvider
                      document={
                        <LogPDF
                          initialExpression={prefix}
                          logSteps={steps.slice(1).map((step, index) => `${index + 1}. ${step.explanation}`)}
                          finalResult={getFinalResult()}
                        />
                      }
                    >
                      {({ url, loading }) =>
                        loading ? (
                          <button className="save-log-button">Generating PDF...</button>
                        ) : (
                          <a href={url} download="prefix-evaluation-log.pdf" className="save-log-button" style={{textDecoration: 'none'}}>
                            <Download size={14} style={{ marginRight: '8px' }}/>
                            Save Log as PDF
                          </a>
                        )
                      }
                    </BlobProvider>
                  )}
                </h3>
                <div className="log-container" ref={logContainerRef}>
                    <div className="log-entry log-input"><strong>Input Expression:</strong><span>{prefix}</span></div>
                    {steps.slice(1, currentStep + 1).map((step, index) => (
                       step.token && 
                        <div key={index} className="log-entry">
                            <span className="log-step-number">{index + 1}.</span> {step.explanation}
                        </div>
                    ))}
                    {currentStep === steps.length - 1 && (
                         <div className="log-entry log-output"><strong>Final Answer:</strong><span>{getFinalResult().replace('Final Answer: ', '')}</span></div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default PrefixEvaluationVisualizer;