# GitHub Contracts - Enhanced Fork

A professional contract management system designed specifically for GitHub-related agreements, with advanced document analysis and AI-powered change detection.

## Features

### Core Functionality
- **Project-based Organization**: Group related contract documents into projects
- **Multi-format Support**: Upload PDF and DOCX files
- **AI-powered Analysis**: Automatic detection of amendments and changes
- **Change Evolution Tracking**: Visual timeline of document modifications
- **Unified Contract Generation**: Merge base contracts with amendments

### Enhanced Features
- **Advanced Filtering**: Filter by date range, document count, counterparty, tags, and status
- **Smart Search**: Quick search across projects and documents
- **Export Options**: Download contracts in PDF and DOCX formats
- **Real-time Notifications**: Get notified of upload completion and change detection
- **Responsive Design**: Optimized for desktop and mobile devices

### User Experience
- **Intuitive Dashboard**: Overview of all projects and recent activity
- **Drag & Drop Upload**: Easy file upload with progress tracking
- **Settings Management**: Customize notifications, UI preferences, and export defaults
- **Professional Design**: Clean, modern interface with attention to detail

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **Database**: Supabase (configured but not required for demo)
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd github-contracts
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Optional: Database Setup

If you want to persist data, set up Supabase:

1. Create a Supabase project
2. Copy your project URL and anon key
3. Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── project/         # Project-specific components
│   ├── settings/        # Settings page components
│   └── upload/          # Upload flow components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── pages/               # Main page components
└── types/               # TypeScript type definitions
```

## Key Components

### Dashboard
- Project overview with statistics
- Recent activity table
- Quick action cards

### Project Management
- Create new projects with metadata
- Upload multiple documents
- Track processing status
- View detailed change analysis

### Contract Analysis
- AI-powered change detection
- Clause-level comparison
- Confidence scoring
- Source document tracking

### Settings
- Account profile management
- Notification preferences
- UI customization
- Export defaults

## Usage

### Creating a New Project

1. Click "Create New Project" from the dashboard or sidebar
2. Fill in project details (name, counterparty, tags)
3. Upload your base contract and any amendments
4. Review the AI-generated change analysis
5. Export the unified contract

### Adding Documents to Existing Projects

1. Navigate to a project detail page
2. Click "Add New Document"
3. Upload additional files
4. Review updated change analysis

### Viewing Change Analysis

Each project provides:
- **Plain-English Summary**: High-level overview of changes
- **Section-by-Section Analysis**: Detailed clause modifications
- **Timeline View**: Chronological document history
- **Final Contract**: Merged document with all changes applied

## Customization

### Themes
The application supports light mode by default. Dark mode can be enabled in Settings > UI Preferences.

### Notifications
Configure notification preferences in Settings > Notifications:
- Real-time alerts
- Daily/weekly digests
- Upload completion notifications

### Export Formats
Set default export preferences in Settings > Export Defaults:
- PDF format
- DOCX format
- Watermark options

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the component examples in `/src/components`

## Roadmap

- [ ] Advanced OCR for scanned documents
- [ ] Integration with DocuSign
- [ ] Bulk document processing
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] API for third-party integrations

---

Built with ❤️ for professional contract management