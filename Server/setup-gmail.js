#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📧 Elderlyze Gmail Emergency Alert Setup\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupGmail() {
  console.log('This will help you set up Gmail for emergency alerts.\n');
  console.log('Prerequisites:');
  console.log('1. Gmail account with 2-Step Verification enabled');
  console.log('2. App Password generated for "Elderlyze SOS"\n');
  
  const gmailUser = await question('Enter your Gmail address: ');
  const gmailPassword = await question('Enter your Gmail App Password (16 characters): ');
  
  if (!gmailUser.includes('@gmail.com')) {
    console.log('❌ Please enter a valid Gmail address');
    rl.close();
    return;
  }
  
  if (gmailPassword.length !== 16) {
    console.log('❌ App Password must be exactly 16 characters');
    console.log('Please generate a new App Password from Google Account settings');
    rl.close();
    return;
  }
  
  // Create .env content
  const envContent = `# Gmail Configuration
GMAIL_USER=${gmailUser}
GMAIL_APP_PASSWORD=${gmailPassword}

# Server Configuration
PORT=3001
NODE_ENV=development
`;
  
  // Write to .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ .env file created successfully!');
  console.log(`📧 Gmail: ${gmailUser}`);
  console.log(`📁 File: ${envPath}`);
  
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your server: npm start');
  console.log('2. Test Gmail connection: http://localhost:3001/test/gmail');
  console.log('3. Test email sending: Use the SOS interface');
  
  console.log('\n📋 How to generate App Password:');
  console.log('1. Go to https://myaccount.google.com/');
  console.log('2. Security → 2-Step Verification → App passwords');
  console.log('3. Select "Mail" and "Other (Custom name)"');
  console.log('4. Name it "Elderlyze SOS"');
  console.log('5. Copy the 16-character password');
  
  rl.close();
}

setupGmail().catch(console.error);
