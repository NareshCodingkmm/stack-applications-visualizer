import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Registering fonts for bold/italic styles
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/-V-4-3m2x_s2z-I.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/-V-4-3m2x_s2z-I.ttf', fontWeight: 'bold' },
  ],
});
Font.register({
  family: 'Courier',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/courierprime/v5/u-450q2lgwslOQP26g5g_w.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/courierprime/v5/u-450q2lgwslOQP26g5g_w.ttf', fontWeight: 'bold' },
  ]
});


// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 20,
    marginBottom: 25,
    textAlign: 'center',
    color: '#007bff',
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#0056b3',
  },
  contentBox: {
    fontSize: 10,
    fontFamily: 'Courier',
    padding: 12,
    borderRadius: 5,
    border: '1px solid #e0e0e0',
  },
  stepContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid #e0e0e0',
  },
  lastStepContainer: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 'none',
  },
  explanationText: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: '#444444',
  },
  explanationBlock: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    border: '1px solid #e9ecef',
    marginBottom: 8,
  },
  // ===== NEW STYLE for indented sub-steps =====
  subStepExplanationBlock: {
    backgroundColor: '#f8f9fa',
    padding: '8px 8px 8px 24px', // Adds left indentation
    borderRadius: 4,
    border: '1px solid #e9ecef',
    marginBottom: 8,
  },
  tokenDisplay: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: 'Courier',
    color: '#0056b3',
    fontWeight: 'bold',
  },
  stateRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  stackStateBox: {
    padding: 6,
    width: '15%',
  },
  outputStateBox: {
    padding: 6,
    width: '85%',
  },
  stateLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stateContent: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: '#111',
    minHeight: 10,
    backgroundColor: '#fafafa',
    border: '1px solid #e0e0e0',
    borderRadius: 3,
    padding: 6,
    wordBreak: 'break-all',
  },
  finalResultText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 10,
  },
  stackVisualContainer: {
    width: '100%',
    minHeight: 80,
    borderLeft: '1.5px solid #aaa',
    borderRight: '1.5px solid #aaa',
    borderBottom: '1.5px solid #aaa',
    padding: 2,
    display: 'flex',
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  stackItem: {
    backgroundColor: '#cce5ff',
    border: '1px solid #007bff',
    borderRadius: 3,
    width: '85%',
    textAlign: 'center',
    padding: 4,
    marginBottom: 2,
  },
  stackItemText: {
    fontSize: 8,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#004085',
  },
  emptyStackText: {
    fontSize: 9,
    color: '#999',
    marginTop: 30,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontSize: 45,
    color: 'grey',
    opacity: 0.2,
    transform: 'rotate(-45deg)',
    pointerEvents: 'none',
  },
});

const StackVisual = ({ items }) => (
  <View style={styles.stackVisualContainer}>
    {items && items.length > 0 ? (
      items.map((item, index) => (
        <View key={index} style={styles.stackItem}>
          <Text style={styles.stackItemText}>
            {typeof item === 'number' && !Number.isInteger(item) ? item.toFixed(2) : item}
          </Text>
        </View>
      ))
    ) : (
      <Text style={styles.emptyStackText}>[Empty]</Text>
    )}
  </View>
);

const LogPDF = ({ title, type, initialExpression, stepsData, finalResult }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.watermarkContainer} fixed>
        <Text style={styles.watermarkText}>Naresh Kumar Siripurapu</Text>
      </View>
      
      <Text style={styles.header}>{title || 'Stack Operation Log'}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Input Expression</Text>
        <View style={styles.contentBox}>
          <Text>{initialExpression}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Operations Log</Text>
        <View style={styles.contentBox}>
          {stepsData.map((step, index) => (
            <View 
              key={index} 
              style={index === stepsData.length - 1 ? styles.lastStepContainer : styles.stepContainer}
              wrap={false}
            >
              {/* ===== UPDATED LOGIC for visual hierarchy ===== */}
              <View style={step.isSubStep ? styles.subStepExplanationBlock : styles.explanationBlock}>
                <Text style={styles.explanationText}>
                  {!step.isSubStep && `${index + 1}. `}{step.explanation}
                </Text>
                {step.token && (
                  <Text style={styles.tokenDisplay}>
                    Token Processed: {step.token}
                  </Text>
                )}
              </View>

              {type === 'conversion' ? (
                <View style={styles.stateRow}>
                  <View style={styles.stackStateBox}>
                    <Text style={styles.stateLabel}>Stack:</Text>
                    <StackVisual items={step.stack} />
                  </View>
                  <View style={styles.outputStateBox}>
                    <Text style={styles.stateLabel}>Output:</Text>
                    <Text style={styles.stateContent}> 
                      {
                        (step.postfix && step.postfix.length > 0) 
                          ? step.postfix.join(' ') 
                          : (step.prefix || '[Empty]')
                      }
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.stackStateBox}>
                  <Text style={styles.stateLabel}>Stack:</Text>
                  <StackVisual items={step.stack} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Final Result</Text>
        <View style={styles.contentBox}>
           <Text style={styles.finalResultText}>{finalResult}</Text>
        </View>
      </View>

      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
);

export default LogPDF;