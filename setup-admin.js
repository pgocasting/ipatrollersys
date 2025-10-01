import { setupAdminRole } from './src/utils/setupAdmin.js';

setupAdminRole().then(success => {
  if (success) {
    console.log('Admin role setup complete!');
  } else {
    console.log('Failed to setup admin role');
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

