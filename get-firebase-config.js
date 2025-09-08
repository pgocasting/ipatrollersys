#!/usr/bin/env node

console.log('🔥 FIREBASE CONFIGURATION HELPER');
console.log('================================');
console.log('');

console.log('📋 STEP-BY-STEP INSTRUCTIONS:');
console.log('');

console.log('1️⃣  Go to Firebase Console:');
console.log('   https://console.firebase.google.com/');
console.log('');

console.log('2️⃣  Select your existing project:');
console.log('   - Look for project: "ipatrollersys"');
console.log('   - Click on it to open');
console.log('   - (If you don\'t see it, create a new project with name "ipatrollersys")');
console.log('');

console.log('3️⃣  Enable Authentication:');
console.log('   - Click "Authentication" in left sidebar');
console.log('   - Click "Get started"');
console.log('   - Go to "Sign-in method" tab');
console.log('   - Enable "Email/Password"');
console.log('   - Click "Save"');
console.log('');

console.log('4️⃣  Create Firestore Database:');
console.log('   - Click "Firestore Database" in left sidebar');
console.log('   - Click "Create database"');
console.log('   - Select "Start in test mode"');
console.log('   - Choose location (closest to you)');
console.log('   - Click "Done"');
console.log('');

console.log('5️⃣  Get Web App Configuration:');
console.log('   - Click gear icon (⚙️) → "Project settings"');
console.log('   - Scroll to "Your apps" section');
console.log('   - Click "Add app" → Web app icon (</>)');
console.log('   - App nickname: "IPatroller Web"');
console.log('   - Click "Register app"');
console.log('   - COPY the configuration object');
console.log('');

console.log('6️⃣  Update src/firebase.js:');
console.log('   - Replace the demo config with your actual config');
console.log('   - Save the file');
console.log('');

console.log('7️⃣  Create Test User:');
console.log('   - Go to "Authentication" → "Users"');
console.log('   - Click "Add user"');
console.log('   - Email: test@example.com');
console.log('   - Password: password123');
console.log('   - Click "Add user"');
console.log('');

console.log('8️⃣  Test Your Setup:');
console.log('   - Restart your dev server (Ctrl+C, then npm run dev)');
console.log('   - Go to http://localhost:5173');
console.log('   - Login with: test@example.com / password123');
console.log('');

console.log('🎯 Your configuration should look like this:');
console.log('');
console.log('const firebaseConfig = {');
console.log('  apiKey: "AIzaSyC...",');
console.log('  authDomain: "your-project.firebaseapp.com",');
console.log('  projectId: "your-project-id",');
console.log('  storageBucket: "your-project.appspot.com",');
console.log('  messagingSenderId: "123456789",');
console.log('  appId: "1:123456789:web:abcdef"');
console.log('};');
console.log('');

console.log('📚 For detailed help, see:');
console.log('   - GET_FIREBASE_CONFIG.md');
console.log('   - FIREBASE_QUICK_SETUP.md');
console.log('   - LOGIN_TROUBLESHOOTING.md');
console.log('');

console.log('✅ After setup, your login will work perfectly!');
