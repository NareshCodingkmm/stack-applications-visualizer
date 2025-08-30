import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Binary, Download } from 'lucide-react';
import { BlobProvider } from '@react-pdf/renderer';
import LogPDF from './LogPDF';
import './InfixToPostfixVisualizer.css'; 

const precedence = (op) => {
  switch (op) {
    case '+': case '-': return 1;
    case '*': case '/': return 2;
    case '^': return 3;
    default: return 0;
  }
};

const isOperator = (token) => ['+', '-', '*', '/', '^'].includes(token);
const isOperand = (token) => !isOperator(token) && token !== '(' && token !== ')';

const algorithmRules = [
  { text: "Create an empty stack." },
  { text: "Reverse the given infix expression, then read all the symbols from left to right." },
  { text: "If the symbol is operand, then prefix it to output." },
  { text: "If the symbol is right (or closed parenthesis), then push it onto stack." },
  {
    text: "If the symbol is left (or open parenthesis):",
    subSteps: [
      { text: "Pop all the content from stack and prefix them to output, until we encounter the right (or closed) parenthesis." },
      { text: "Pop the right (or closed) parenthesis, but do not prefix it to output." }
    ]
  },
  {
    text: "If the symbol is operator:",
    subSteps: [
      { text: "If the stack is empty, then push the current operator onto stack." },
      {
        text: "If stack is not empty:",
        subSteps: [
          { text: "If the top of the stack is a right (or closed) parenthesis, then push the current operator onto stack." },
          { text: "If the top of the stack is an operator with higher or equal precedence than the current operator, then pop all such operators from the stack and prefix them to output. After that, push the current operator onto stack." },
          { text: "If the top of the stack is an operator with lower precedence than the current operator, then push the current operator onto stack." }
        ]
      }
    ]
  },
  { text: "After processing all symbols, pop all the remaining operators from stack and prefix them to output." }
];

const validateExpression = (infix, tokens) => {
    const cleanedInfix = infix.replace(/\s+/g, '');
    const rejoinedTokens = tokens ? tokens.join('') : '';
    if (cleanedInfix !== rejoinedTokens) {
        return "Invalid characters found in the expression. Only use A-Z, 0-9, and operators.";
    }
    for (let i = 0; i < tokens.length - 1; i++) {
        const current = tokens[i];
        const next = tokens[i+1];
        if (isOperator(current) && isOperator(next)) { return `Syntax Error: Consecutive operators '${current}' and '${next}'.`; }
        if (isOperand(current) && isOperand(next)) { return `Syntax Error: Consecutive operands '${current}' and '${next}'.`; }
        if (current === '(' && next === ')') { return "Syntax Error: Empty parentheses '()'."; }
        if (isOperator(current) && next === ')') { return `Syntax Error: Operator '${current}' cannot be followed by ')'.`; }
        if (current === '(' && isOperator(next)) { return `Syntax Error: Operator '${next}' cannot follow '('.`; }
    }
    if (isOperator(tokens[0]) || tokens[0] === ')') { return `Syntax Error: Expression cannot start with '${tokens[0]}'.`; }
    if (isOperator(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === '(') { return `Syntax Error: Expression cannot end with '${tokens[tokens.length - 1]}'.`; }
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


function InfixToPrefixVisualizer() {
  const [infix, setInfix] = useState('A * (B + C) - D/E');
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
    
    const originalTokens = infix.match(/\d+(\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|[+\-*/^()]/g) || [];
    
    const validationError = validateExpression(infix, originalTokens);
    if (validationError) {
        setError(validationError);
        return;
    }

    const tokens = [...originalTokens].reverse();
    setExpressionTokens(tokens);

    const newSteps = [];
    let stack = [];
    let prefix = '';
    
    newSteps.push({
      token: null, stack: [], prefix: '',
      explanation: 'Algorithm starts. Reverse the expression and read tokens.',
      highlightedRulePath: [0, 1], animatePrefix: false, tokenIndex: -1,
    });

    tokens.forEach((token, tokenIndex) => {
      let step = { token, stack: [...stack], prefix, animatePrefix: false, tokenIndex };
      let explanationText = "";

      if (isOperand(token)) {
        prefix = token + (prefix ? ' ' : '') + prefix;
        step.prefix = prefix;
        explanationText = `Token is an operand ('${token}'). Prefix it to output.`;
        step.highlightedRulePath = [2];
        step.animatePrefix = true;
      } else if (token === ')') {
        stack.push(token);
        step.stack = [...stack];
        explanationText = `Token is a right parenthesis (')'). Push it onto stack.`;
        step.highlightedRulePath = [3];
      } else if (token === '(') {
        explanationText = `Token is a left parenthesis ('('). Pop content from stack and prefix to output until a ')' is found.`;
        while (stack.length > 0 && stack[stack.length - 1] !== ')') {
            prefix = stack.pop() + (prefix ? ' ' : '') + prefix;
        }
        if (stack.length > 0) { 
            stack.pop();
        } else { 
            setError("Mismatched parentheses."); return; 
        }
        explanationText += " Then, pop the right parenthesis from the stack, but do not prefix it to output.";
        step.stack = [...stack];
        step.prefix = prefix;
        step.highlightedRulePath = [4, 0, 1];
        step.animatePrefix = true;
      } else if (isOperator(token)) {
        explanationText = `Token is an operator ('${token}'). `;
        const top = stack.length > 0 ? stack[stack.length - 1] : null;
        if (!top) {
            step.highlightedRulePath = [5, 0];
            explanationText += `The stack is empty, so push the current operator onto the stack.`;
            stack.push(token);
        } else if (top === ')') {
            step.highlightedRulePath = [5, 1, 0];
            explanationText += `The top of the stack is a right parenthesis, so push the current operator onto the stack.`;
            stack.push(token);
        } else if (precedence(token) > precedence(top)) {
            step.highlightedRulePath = [5, 1, 2];
            explanationText += `The top of the stack ('${top}') has lower precedence than '${token}', so push '${token}' onto the stack.`
            stack.push(token);
        } else {
            step.highlightedRulePath = [5, 1, 1];
            if (precedence(token) < precedence(top)) {
                explanationText += `The top of the stack ('${top}') has higher precedence than '${token}', so pop all such operators from the stack and prefix to output. `;
            } else { // equal precedence
                explanationText += `The top of the stack ('${top}') has equal precedence to '${token}', so pop all such operators from the stack and prefix to output. `;
            }
            while (stack.length > 0 && stack[stack.length - 1] !== ')' && precedence(token) <= precedence(stack[stack.length-1])) {
                prefix = stack.pop() + (prefix ? ' ' : '') + prefix;
            }
            stack.push(token);
            explanationText += `After that, push the current operator '${token}' onto the stack.`
            step.animatePrefix = true;
        }
        step.stack = [...stack];
        step.prefix = prefix;
      }
      step.explanation = explanationText;
      newSteps.push(step);
    });
    
    let lastStepAnimate = stack.length > 0;
    while (stack.length > 0) {
      if(stack[stack.length - 1] === ')') {
        setError("Mismatched parentheses."); 
        return; 
      }
      prefix = stack.pop() + (prefix ? ' ' : '') + prefix;
    }
    
    newSteps.push({
      token: null, stack: [...stack], prefix: prefix.trim(),
      explanation: "After processing all symbols, pop all the remaining operators from stack and prefix them to output.",
      highlightedRulePath: [6],
      animatePrefix: lastStepAnimate,
      tokenIndex: -1,
    });
    setSteps(newSteps);
  };
  
  const handleReset = () => { setIsPlaying(false); setCurrentStep(0); setSteps([]); setError(null); setExpressionTokens([]); };
  const handlePlayPause = () => { if (steps.length === 0) generateSteps(); else setIsPlaying(!isPlaying); };
  const handleNext = () => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
  const handlePrev = () => currentStep > 0 && setCurrentStep(currentStep - 1);
  const currentData = steps[currentStep] || { stack: [], prefix: '', explanation: 'Enter an infix expression and click Start.', token: null, highlightedRulePath: null, animatePrefix: false, tokenIndex: -1 };
  const stack = currentData.stack;

  const cleanInfix = infix.replace(/\$/g, '');

  return (
    <div className="visualizer-container">
      <div className="controls">
        <label htmlFor="infix-input">Infix Expression:</label>
        <input id="infix-input" type="text" value={infix} onChange={(e) => { setInfix(e.target.value); setError(null); }} />
        <button onClick={generateSteps}><Binary size={18}/> Convert</button>
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
                <strong>Processing Reversed:</strong>
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
              <h3>Operator Stack</h3>
              <div className="stack-visual-wrapper">
                <div className="stack-indices">{stack.map((_, index) => <div key={index} className="stack-index">{index}</div>)}</div>
                <div className="stack-visual">{stack.map((item, index) => <div key={index} className="stack-element">{item}</div>)}</div>
                {stack.length > 0 && <div className="stack-top-pointer" style={{ bottom: `${(stack.length-1) * 44 + 22}px`}}>TOP</div>}
              </div>
            </div>
          </div>
        </div>
        <div className="panel output-panel">
            <h3>Prefix Output</h3>
            <div className="output-visual">
              {currentData.prefix.trim().split(' ').map((char, index) => (
                  char && <div key={`${index}-${char}`} className={`prefix-element ${index === 0 && currentData.animatePrefix ? 'animate-add' : ''}`}>
                      {char}
                  </div>
              ))}
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
                          title="Infix to Prefix Conversion Log"
                          type="conversion"
                          initialExpression={cleanInfix}
                          stepsData={steps.slice(1)}
                          finalResult={`Final Prefix: ${steps[steps.length - 1].prefix}`}
                        />
                      }
                    >
                      {({ url, loading }) =>
                        loading ? (
                          <button className="save-log-button">Generating PDF...</button>
                        ) : (
                          <a href={url} download="infix-to-prefix-log.pdf" className="save-log-button" style={{textDecoration: 'none'}}>
                            <Download size={14} style={{ marginRight: '8px' }}/>
                            Save Log as PDF
                          </a>
                        )
                      }
                    </BlobProvider>
                  )}
                </h3>
                <div className="log-container" ref={logContainerRef}>
                    <div className="log-entry log-input"><strong>Input Expression:</strong><span>{infix}</span></div>
                    {steps.slice(1, currentStep + 1).map((step, index) => (
                       step.token && 
                        <div key={index} className="log-entry">
                            <span className="log-step-number">{index + 1}.</span> {step.explanation}
                        </div>
                    ))}
                    {currentStep === steps.length - 1 && (
                         <div className="log-entry log-output"><strong>Final Prefix:</strong><span>{steps[steps.length - 1].prefix}</span></div>
                    )}
                </div>
            </div>
        )}
      </div>
      <footer className="app-footer">
      © 2025 Naresh Kumar Siripurapu. All Rights Reserved.
    </footer>
    </div>
  );
}

export default InfixToPrefixVisualizer;