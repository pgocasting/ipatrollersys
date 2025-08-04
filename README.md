# iPatroller Management System

A modern, comprehensive patrol data management system built with React, Firebase, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **📊 Patrol Data Management**: Add, edit, and manage daily patrol counts across districts
- **🏢 Multi-District Support**: Manage data for 3 districts with multiple municipalities
- **📅 Monthly Data Organization**: Organize data by month and year
- **💾 Firebase Integration**: Real-time data synchronization with Firestore database
- **📈 Analytics Dashboard**: View patrol statistics and performance metrics

### Data Operations
- **📤 Excel Import**: Import patrol data from Excel files
- **📥 CSV Export**: Export filtered data to CSV format
- **🔍 Advanced Filtering**: Filter by district, municipality, and search terms
- **📊 Sorting Options**: Sort by municipality, district, or total patrols
- **✏️ Inline Editing**: Edit patrol counts directly in the table

### User Experience
- **🌙 Dark/Light Mode**: Toggle between dark and light themes
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **⚡ Real-time Updates**: Instant data synchronization
- **🎯 User-friendly Interface**: Modern, intuitive design

### Analytics & Reporting
- **📊 Performance Metrics**: Total patrols, active/inactive municipalities
- **📈 Visual Analytics**: Interactive charts and statistics
- **📋 Summary Reports**: Comprehensive monthly reports
- **🏆 Ranking System**: Municipality performance rankings

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Lucide React
- **Excel Processing**: SheetJS (XLSX)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IPatrollerSys
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Authentication
   - Copy your Firebase config to `src/firebase.js`

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Firebase Setup
The system uses Firebase for:
- **Authentication**: User login and role management
- **Firestore**: Patrol data storage
- **Real-time Updates**: Live data synchronization

### District Configuration
The system is configured for 3 districts:
- **1ST DISTRICT**: Abucay, Orani, Samal, Hermosa
- **2ND DISTRICT**: Balanga, Pilar, Orion, Limay  
- **3RD DISTRICT**: Bagac, Dinalupihan, Mariveles, Morong

## 📖 Usage Guide

### Adding Patrol Data
1. Navigate to the iPatroller page
2. Select the desired month and year
3. Click "Add Record" button
4. Fill in district, municipality, and daily patrol counts
5. Click "Add Record" to save

### Importing Excel Data
1. Prepare an Excel file with the following structure:
   - Column A: District
   - Column B: Municipality
   - Columns C onwards: Daily patrol counts
2. Click "Import Excel" button
3. Select your Excel file
4. Data will be automatically processed and imported

### Filtering and Sorting
- **Search**: Use the search box to find specific municipalities
- **District Filter**: Filter by specific districts
- **Sorting**: Sort by municipality name, district, or total patrols

### Exporting Data
1. Apply any desired filters
2. Click "Export CSV" button
3. Data will be downloaded as a CSV file

## 🏗️ Project Structure

```
src/
├── components/
│   └── ui/           # Reusable UI components
├── hooks/
│   └── useFirebase.js # Firebase integration hooks
├── utils/
│   ├── initFirebaseAuth.js
│   └── initFirestore.js
├── Ipatroller.jsx    # Main patrol management component
├── Dashboard.jsx     # Dashboard component
├── Login.jsx         # Authentication component
├── firebase.js       # Firebase configuration
└── App.jsx          # Main application component
```

## 🔐 Authentication

The system supports role-based access:
- **Admin**: Full access to all features
- **User**: Read-only access to patrol data
- **Viewer**: Limited access to analytics

## 📊 Data Model

### Patrol Data Structure
```javascript
{
  district: "1ST DISTRICT",
  municipality: "Abucay",
  data: [5, 3, 7, 2, ...], // Daily patrol counts
  updatedAt: "2025-01-15T10:30:00Z"
}
```

### User Data Structure
```javascript
{
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  role: "Admin",
  status: "Active",
  district: "ALL DISTRICTS"
}
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- Uses ESLint for code quality
- Follows React best practices
- Implements modern React patterns (hooks, memoization)

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Issues**
- Verify Firebase configuration in `src/firebase.js`
- Check Firestore rules allow read/write access
- Ensure authentication is properly configured

**Excel Import Issues**
- Ensure Excel file follows the required format
- Check that all required columns are present
- Verify file is not corrupted

**Data Not Loading**
- Check browser console for errors
- Verify Firebase connection
- Ensure user has proper permissions

## 📈 Performance Features

- **Memoized Computations**: Optimized data filtering and sorting
- **Lazy Loading**: Components load only when needed
- **Efficient Re-renders**: Minimal component updates
- **Optimized Database Queries**: Efficient Firestore operations

## 🔮 Future Enhancements

- **Advanced Analytics**: More detailed performance metrics
- **Mobile App**: Native mobile application
- **Offline Support**: Work without internet connection
- **Advanced Reporting**: PDF report generation
- **API Integration**: Connect with external systems

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**iPatroller Management System** - Modern patrol data management for law enforcement agencies.
