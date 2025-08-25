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
    backgroundColor: '#FFFFFF',
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
    color: '#333',
  },
  contentBox: {
    fontSize: 10,
    fontFamily: 'Courier',
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 5,
    border: '1px solid #e0e0e0',
  },
  line: {
    marginBottom: 5,
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
});

// Create the PDF document component
const LogPDF = ({ initialExpression, logSteps, finalResult }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Stack Visualizer Operations Log</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Input Expression</Text>
        <View style={styles.contentBox}>
          <Text>{initialExpression}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Operations Log</Text>
        <View style={styles.contentBox}>
          {logSteps.map((line, i) => (
            <Text key={i} style={styles.line}>
              {line}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Final Result</Text>
        <View style={styles.contentBox}>
           <Text>{finalResult}</Text>
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