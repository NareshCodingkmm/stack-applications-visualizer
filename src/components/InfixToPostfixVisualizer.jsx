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
  { text: "Read the infix expression from left to right symbol by symbol." },
  { text: "If the symbol is operand, then append it to the output." },
  { text: "If the symbol is left (or open) parenthesis (, then push it onto the stack." },
  {
    text: "If the symbol is right (or closed) parenthesis ):",
    subSteps: [
      { text: "Pop all the operators from the stack and append them to output until a left (or open) parenthesis ( is encountered." },
      { text: "Pop the left parenthesis (, but do not append it to output." }
    ]
  },
  {
    text: "If the symbol is operator:",
    subSteps: [
      { text: "If the stack is empty, then push the current operator onto stack." },
      {
        text: "If the stack is not empty:",
        subSteps: [
          { text: "If the top of the stack is a left parenthesis (, then push the current operator onto stack." },
          { text: "If the top of the stack is an operator with higher or equal precedence than the current operator, then pop all such operators from the stack and append them to output. After that, push the current operator onto stack." },
          { text: "If the top of thestack is an operator with lower precedence than the current operator, then push the current operator onto stack." }
        ]
      }
    ]
  },
  { text: "After processing all symbols, pop all the remaining operators from the stack and append them to output." }
];

const validateExpression = (infix, tokens) => {
    if (!tokens || tokens.length === 0 && infix.trim() !== '') return "Invalid characters.";
    // ... (rest of your validation logic from previous versions)
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


function InfixToPostfixVisualizer() {
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

    const tokens = infix.replace(/\s+/g, '').match(/\d+(\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|[+\-*/^()]/g) || [];
    setExpressionTokens(tokens);

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
      highlightedRulePath: [0, 1], animatePostfix: false, tokenIndex: -1,
    });

    tokens.forEach((token, tokenIndex) => {
      let step = { token, stack: [...stack], postfix: [...postfix], animatePostfix: false, tokenIndex };
      let explanationText = "";
      if (isOperand(token)) {
        postfix.push(token);
        explanationText = `Token is an operand ('${token}'). Append it to the Postfix Output.`;
        step.highlightedRulePath = [2];
        step.animatePostfix = true;
      } else if (token === '(') {
        stack.push(token);
        explanationText = `Token is a left parenthesis ('('). Push it onto the stack.`;
        step.highlightedRulePath = [3];
      } else if (token === ')') {
        explanationText = `Token is a right parenthesis (')'). Pop operators from the stack and append to the Postfix Output until a left parenthesis is found.`;
        while (stack.length > 0 && stack[stack.length - 1] !== '(') { postfix.push(stack.pop()); }
        if (stack.length > 0) { stack.pop(); }
        else { setError("Mismatched parentheses."); return; }
        explanationText += " Then, pop the left parenthesis from the stack, but do not append it to output.";
        step.highlightedRulePath = [4, 0, 1];
        step.animatePostfix = true;
      } else if (isOperator(token)) {
        explanationText = `Token is an operator ('${token}'). `;
        const top = stack.length > 0 ? stack[stack.length - 1] : null;

        if (!top) {
            step.highlightedRulePath = [5, 0];
            explanationText += `The stack is empty, so push the current operator onto the stack.`;
            stack.push(token);
        } else if (top === '(') {
            step.highlightedRulePath = [5, 1, 0];
            explanationText += `The top of the stack is a left parenthesis, so push the current operator onto the stack.`;
            stack.push(token);
        } else if (precedence(token) > precedence(top)) {
            step.highlightedRulePath = [5, 1, 2];
            explanationText += `The top of the stack ('${top}') has lower precedence than '${token}', so push the current operator onto the stack.`
            stack.push(token);
        } else {
            step.highlightedRulePath = [5, 1, 1];
            if (precedence(token) < precedence(top)) {
                 explanationText += `The top of the stack ('${top}') has higher precedence than '${token}', so pop all such operators from the stack and append to output. `;
            } else {
                 explanationText += `The top of the stack ('${top}') has equal precedence to '${token}', so pop all such operators from the stack and append to output. `;
            }
            while (stack.length > 0 && stack[stack.length - 1] !== '(' && precedence(token) <= precedence(stack[stack.length-1])) {
                postfix.push(stack.pop());
            }
            stack.push(token);
            explanationText += `After that, push the current operator '${token}' onto the stack.`
            step.animatePostfix = true;
        }
      }
      step.explanation = explanationText;
      step.stack = [...stack];
      step.postfix = [...postfix];
      newSteps.push(step);
    });

    let lastStepAnimate = stack.length > 0;
    while (stack.length > 0) {
      if(stack[stack.length - 1] === '(') { setError("Mismatched parentheses."); return; }
      postfix.push(stack.pop());
    }

    newSteps.push({
      token: null, stack: [...stack], postfix: [...postfix],
      explanation: "After processing all symbols, pop all the remaining operators from the stack and append to output.",
      highlightedRulePath: [6],
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

  const cleanInfix = infix.replace(/\$/g, '');

  return (
    // ===== THIS IS THE MAIN FIX =====
    // We wrap everything in a div with the class "app-container".
    // Your CSS file already knows how to style this container to push the footer down.
    <div className="app-container">
      
      {/* All of your original content goes inside this first div */}
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
          {steps.length > 1 && !error && (
              <div className="panel log-panel">
                  <h3>
                    Operations Log
                    {currentStep === steps.length - 1 && (
                      <BlobProvider
                        document={
                         <LogPDF
                          title="Infix to Postfix Conversion Log"
                          type="conversion"
                          initialExpression={cleanInfix}
                          stepsData={steps.slice(1)}
                          finalResult={`Final Postfix: ${steps[steps.length - 1].postfix.join(' ')}`}
                        />
                        }
                      >
                        {({ url, loading }) =>
                          loading ? (
                            <button className="save-log-button">Generating PDF...</button>
                          ) : (
                            <a href={url} download="infix-to-postfix-log.pdf" className="save-log-button" style={{textDecoration: 'none'}}>
                              <Download size={14} style={{ marginRight: '8px' }}/>
                              Save Log as PDF
                            </a>
                          )
                        }
                      </BlobProvider>
                    )}
                  </h3>
                  <div className="log-container" ref={logContainerRef}>
                      <div className="log-entry log-input">
                          <strong>Input Expression:</strong>
                          <span>{infix}</span>
                      </div>
                      {steps.slice(1, currentStep + 1).map((step, index) => (
                         step.token &&
                          <div key={index} className="log-entry">
                              <span className="log-step-number">{index + 1}.</span> {step.explanation}
                          </div>
                      ))}
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

      {/* The footer now lives outside the main content container */}
      <footer className="app-footer">
        © 2025 Naresh Kumar Siripurapu. All Rights Reserved.
      </footer>
      
    </div>
  );
}

export default InfixToPostfixVisualizer;