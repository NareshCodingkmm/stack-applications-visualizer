import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Binary } from 'lucide-react';
import './InfixToPostfixVisualizer.css';

// Helper function to define operator precedence
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

// Nested data structure for the detailed algorithm
const algorithmRules = [
  { text: "Create an empty stack and read symbols one by one from left to right." }, // 0
  { text: "If the symbol is an operand, directly append it to output." }, // 1
  { text: "If the symbol is a left (open) parenthesis '(', then push it onto stack." }, // 2
  { // 3
    text: "If the symbol is a right (closed) parenthesis ')':",
    subSteps: [
      { text: "Pop all operators from stack and append to output, until you encounter a '('. "}, // 3.0
      { text: "Pop the '(' from stack, but do not append it to output." } // 3.1
    ]
  },
  { // 4
    text: "If the symbol is an operator:",
    subSteps: [
      { text: "If the stack is empty, push the current operator onto stack." }, // 4.0
      { // 4.1
        text: "If the stack is not empty:",
        subSteps: [
          { text: "If the top of the stack is '(', push the current operator onto stack." }, // 4.1.0
          { text: "If the top has higher or equal precedence, pop from stack to output. Repeat until this is false, then push the current operator." }, // 4.1.1
          { text: "If the top has lower precedence, push the current operator onto stack." } // 4.1.2
        ]
      }
    ]
  },
  { text: "After processing all symbols, pop all remaining operators from stack and append them to output." } // 5
];

// Comprehensive validation function
const validateExpression = (infix, tokens) => {
    const cleanedInfix = infix.replace(/\s+/g, '');
    const rejoinedTokens = tokens.join('');
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

// Recursive component to render the nested algorithm rules
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


function InfixToPostfixVisualizer() {
  const [infix, setInfix] = useState('A * (B + C) - D/E');
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [error, setError] = useState(null);
  const [expressionTokens, setExpressionTokens] = useState([]);
  const intervalRef = useRef(null);
  const logContainerRef = useRef(null); // ===== NEW: Ref for the log container for auto-scrolling =====

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

  // ===== NEW: Effect to auto-scroll the log panel =====
  useEffect(() => {
    if (logContainerRef.current) {
        const element = logContainerRef.current;
        element.scrollTop = element.scrollHeight;
    }
  }, [currentStep]); // Trigger scroll on every step change


  const generateSteps = () => {
    setError(null);
    setSteps([]);
    setCurrentStep(0);
    
    const tokens = infix.match(/\d+(\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|[+\-*/^()]/g) || [];
    setExpressionTokens(tokens);

    if (tokens.length === 0 && infix.trim() !== '') {
        setError("Invalid characters found. Please use only letters, numbers, and valid operators.");
        return;
    }
    if (infix.trim() === '') {
        setError("Expression cannot be empty.");
        return;
    }

    const validationError = validateExpression(infix, tokens);
    if (validationError) {
        setError(validationError);
        return;
    }

    const newSteps = [];
    let stack = [];
    let postfix = [];
    
    newSteps.push({
      token: null, stack: [], postfix: [],
      explanation: 'Algorithm starts. Reading expression tokens.',
      highlightedRulePath: [0], animatePostfix: false, tokenIndex: -1,
    });

    tokens.forEach((token, tokenIndex) => {
      let step = { token, stack: [...stack], postfix: [...postfix], animatePostfix: false, tokenIndex };
      if (isOperand(token)) {
        postfix.push(token);
        step.postfix = [...postfix];
        step.explanation = `Token is an operand ('${token}'). Append it to the Postfix Output.`;
        step.highlightedRulePath = [1];
        step.animatePostfix = true;
      } else if (token === '(') {
        stack.push(token);
        step.stack = [...stack];
        step.explanation = `Token is a left parenthesis ('('). Push it onto the stack.`;
        step.highlightedRulePath = [2];
      } else if (token === ')') {
        step.explanation = `Token is a right parenthesis (')'). Pop operators from the stack to the Postfix Output until a left parenthesis is found.`;
        while (stack.length > 0 && stack[stack.length - 1] !== '(') { postfix.push(stack.pop()); }
        if (stack.length > 0) { stack.pop(); } 
        else { setError("Mismatched parentheses."); return; }
        step.explanation += " Then, pop and discard the left parenthesis from the stack.";
        step.stack = [...stack];
        step.postfix = [...postfix];
        step.highlightedRulePath = [3, 0, 1];
        step.animatePostfix = true;
      } else if (isOperator(token)) {
        step.explanation = `Token is an operator ('${token}'). `;
        const top = stack.length > 0 ? stack[stack.length - 1] : null;
        if (!top) {
            step.highlightedRulePath = [4, 0];
            step.explanation += `The stack is empty, so push '${token}' onto the stack.`;
            stack.push(token);
        } else if (top === '(') {
            step.highlightedRulePath = [4, 1, 0];
            step.explanation += `The top of the stack is a left parenthesis, so push '${token}' onto the stack.`;
            stack.push(token);
        } else if (precedence(token) > precedence(top)) {
            step.highlightedRulePath = [4, 1, 2];
            step.explanation += `Precedence of '${token}' is greater than the top of the stack ('${top}'), so push '${token}' onto the stack.`
            stack.push(token);
        } else {
            step.highlightedRulePath = [4, 1, 1];
            if (precedence(token) === precedence(top)) {
                step.explanation += `Precedence of '${token}' is equal to the top of the stack ('${top}'), so pop the stack and append to the Postfix Output. `;
            } else {
                step.explanation += `Precedence of '${token}' is less than the top of the stack ('${top}'), so pop the stack and append to the Postfix Output. `;
            }
            while (stack.length > 0 && stack[stack.length - 1] !== '(' && precedence(token) <= precedence(stack[stack.length-1])) {
                postfix.push(stack.pop());
            }
            stack.push(token);
            step.explanation += `After popping, push the current operator '${token}' onto the stack.`
            step.animatePostfix = true;
        }
        step.stack = [...stack];
        step.postfix = [...postfix];
      }
      newSteps.push(step);
    });
    
    let lastStepAnimate = stack.length > 0;
    while (stack.length > 0) {
      if(stack[stack.length - 1] === '(') { setError("Mismatched parentheses."); return; }
      postfix.push(stack.pop());
    }
    
    newSteps.push({
      token: null, stack: [...stack], postfix: [...postfix],
      explanation: "The entire infix expression has been scanned. Pop all remaining operators from the stack to the Postfix Output. Conversion is complete.",
      highlightedRulePath: [5],
      animatePostfix: lastStepAnimate,
      tokenIndex: -1,
    });
    setSteps(newSteps);
  };
  
  const handleReset = () => { setIsPlaying(false); setCurrentStep(0); setSteps([]); setError(null); setExpressionTokens([]); };
  const handlePlayPause = () => { if (steps.length === 0) generateSteps(); else setIsPlaying(!isPlaying); };
  const handleNext = () => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
  const handlePrev = () => currentStep > 0 && setCurrentStep(currentStep - 1);
  const currentData = steps[currentStep] || { stack: [], postfix: [], explanation: 'Enter an infix expression and click Start.', token: null, highlightedRulePath: null, animatePostfix: false, tokenIndex: -1 };
  const stack = currentData.stack;

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
            <h3>Postfix Output</h3>
            <div className="output-visual">
              {currentData.postfix.map((item, index) => (
                <div key={`${index}-${item}`} className={`postfix-element ${index === currentData.postfix.length - 1 && currentData.animatePostfix ? 'animate-add' : ''}`}>
                  {item}
                </div>
              ))}
            </div>
        </div>
        
        {/* ===== UPDATED: Log panel now renders step-by-step ===== */}
        {steps.length > 0 && !error && (
            <div className="panel log-panel">
                <h3>Operations Log</h3>
                <div className="log-container" ref={logContainerRef}>
                    <div className="log-entry log-input">
                        <strong>Input Expression:</strong>
                        <span>{infix}</span>
                    </div>
                    {/* Map only up to the current step */}
                    {steps.slice(1, currentStep + 1).map((step, index) => (
                       step.token && // Render only if it's an actual processing step
                        <div key={index} className="log-entry">
                            <span className="log-step-number">{index + 1}.</span> {step.explanation}
                        </div>
                    ))}
                    {/* Show final output only on the last step */}
                    {currentStep === steps.length - 1 && (
                         <div className="log-entry log-output">
                            <strong>Final Postfix:</strong>
                            <span>{steps[steps.length - 1].postfix.join(' ')}</span>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default InfixToPostfixVisualizer;