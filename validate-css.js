/* global process */
import fs from 'fs';
import path from 'path';

function validateCss() {
  const cssPath = path.resolve('src/index.css');
  if (!fs.existsSync(cssPath)) {
    console.log('No index.css found, skipping CSS validation.');
    return;
  }
  
  const content = fs.readFileSync(cssPath, 'utf8');
  
  let openBraces = 0;
  let closeBraces = 0;
  
  // Basic parser to ignore braces inside comments or strings
  let inComment = false;
  let inString = false;
  let stringChar = null;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    // Comment handling
    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false;
        i++;
      }
      continue;
    }
    
    if (char === '/' && nextChar === '*') {
      inComment = true;
      i++;
      continue;
    }
    
    // String handling
    if (inString) {
      if (char === stringChar && content[i - 1] !== '\\') {
        inString = false;
        stringChar = null;
      }
      continue;
    }
    
    if ((char === '"' || char === "'") && content[i - 1] !== '\\') {
      inString = true;
      stringChar = char;
      continue;
    }
    
    // Brace counting
    if (char === '{') openBraces++;
    if (char === '}') closeBraces++;
  }
  
  console.log(`CSS Syntax Validator -> Open braces: ${openBraces}, Close braces: ${closeBraces}`);
  
  if (openBraces !== closeBraces) {
    console.error(`\x1b[31mERROR: Mismatched curly braces detected in src/index.css!\x1b[0m`);
    console.error(`Total '{': ${openBraces}, Total '}': ${closeBraces}`);
    console.error(`This causes browsers to ignore blocks of styles on certain widths. Please inspect your recent edits.`);
    process.exit(1);
  }
  
  console.log('\x1b[32mCSS validation passed successfully (braces match).\x1b[0m');
}

validateCss();
