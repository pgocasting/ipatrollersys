#!/usr/bin/env node

/**
 * Firebase Setup Helper Script
 * This script helps you get your Firebase configuration
 */

console.log('🔥 Firebase Setup Helper');
console.log('========================\n');

console.log('📋 Follow these steps to get your Firebase configuration:\n');

console.log('1. 🌐 Go to Firebase Console:');
console.log('   https://console.firebase.google.com/\n');

console.log('2. 🆕 Create a new project or select existing one:');
console.log('   - Click "Create a project" or select existing project');
console.log('   - Enter project name: "ipatrollersys" (or your preferred name)');
console.log('   - Enable Google Analytics (optional)');
console.log('   - Click "Create project"\n');

console.log('3. 🔐 Enable Authentication:');
console.log('   - Click "Authentication" in the left sidebar');
console.log('   - Click "Get started"');
console.log('   - Go to "Sign-in method" tab');
console.log('   - Click "Email/Password"');
console.log('   - Enable "Email/Password" and click "Save"\n');

console.log('4. 🗄️ Create Firestore Database:');
console.log('   - Click "Firestore Database" in the left sidebar');
console.log('   - Click "Create database"');
console.log('   - Choose "Start in test mode" (for development)');
console.log('   - Select a location (choose closest to your users)');
console.log('   - Click "Done"\n');

console.log('5. 📱 Get Web App Configuration:');
console.log('   - Click the gear icon (⚙️) → "Project settings"');
console.log('   - Scroll down to "Your apps" section');
console.log('   - Click "Add app" → Web app (</>) icon');
console.log('   - Enter app nickname: "IPatroller Web"');
console.log('   - Click "Register app"');
console.log('   - Copy the configuration object\n');

console.log('6. ✏️ Update src/firebase.js:');
console.log('   - Open src/firebase.js in your editor');
console.log('   - Replace the placeholder values with your actual config:');
console.log('   ');
console.log('   const firebaseConfig = {');
console.log('     apiKey: "AIzaSyC...", // Your actual API key');
console.log('     authDomain: "your-project.firebaseapp.com",');
console.log('     projectId: "your-project-id",');
console.log('     storageBucket: "your-project.appspot.com",');
console.log('     messagingSenderId: "123456789",');
console.log('     appId: "1:123456789:web:abcdef"');
console.log('   };\n');

console.log('7. 👤 Create a test user:');
console.log('   - Go to Authentication → Users');
console.log('   - Click "Add user"');
console.log('   - Enter email: test@example.com');
console.log('   - Enter password: password123');
console.log('   - Click "Add user"\n');

console.log('8. 🚀 Test your setup:');
console.log('   - Restart your development server (Ctrl+C then npm run dev)');
console.log('   - Go to http://localhost:5173');
console.log('   - Try logging in with test@example.com / password123\n');

console.log('🎯 Quick Test Commands:');
console.log('   - Navigate to: http://localhost:5173/firebase-connection-test');
console.log('   - Click "Run Connection Tests" to verify everything works\n');

console.log('❓ Need help? Check LOGIN_TROUBLESHOOTING.md for detailed instructions.\n');

console.log('✅ Once configured, your login should work perfectly!');
