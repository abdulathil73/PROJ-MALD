const fs = require('fs');
const content = fs.readFileSync('src/app/App.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('function SalesPage') || line.includes('function PurchasePage')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
