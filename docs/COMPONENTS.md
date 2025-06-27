# Component Documentation

This document provides detailed information about the React components used in the GitHub Contracts application.

## Component Architecture

The application follows a modular component architecture with clear separation of concerns:

```
src/components/
├── project/          # Project-specific components
├── settings/         # Settings page components
├── upload/           # Upload flow components
└── [core components] # Main application components
```

## Core Components

### App.tsx
Main application component that manages global state and routing.

**Props**: None
**State**: 
- `activeView`: Current page/view
- `selectedContract`: Currently selected contract
- `selectedProject`: Currently selected project
- `contracts`: Array of contract data

### Header.tsx
Application header with search and user information.

**Props**:
```typescript
interface HeaderProps {
  onQuickSearch?: (query: string) => void;
}
```

**Features**:
- Global search functionality
- User profile display
- Notifications indicator

### Sidebar.tsx
Navigation sidebar with main menu items.

**Props**:
```typescript
interface SidebarProps {
  activeView: string;
  onNavigate: (view: ViewType) => void;
}
```

**Features**:
- Active state management
- Categorized navigation
- Responsive design

### Dashboard.tsx
Main dashboard with statistics and recent activity.

**Props**:
```typescript
interface DashboardProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onNavigate?: (view: ViewType) => void;
  onViewProject?: (project: ContractProject) => void;
}
```

**Features**:
- Statistics cards
- Recent activity table
- Quick action buttons

## Project Components

### ContractsList.tsx
Displays list of contract projects with filtering and search.

**Props**:
```typescript
interface ContractsListProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onViewProject: (project: ContractProject) => void;
  viewMode?: 'all-projects' | 'contract-summaries';
}
```

**Features**:
- Card and list view modes
- Advanced filtering
- Search functionality
- Pagination support

### ContractDetail.tsx
Detailed view of a single contract with change analysis.

**Props**:
```typescript
interface ContractDetailProps {
  contract: Contract;
  onBack: () => void;
}
```

**Features**:
- Change summary
- Timeline view
- Export options
- Processing statistics

### ContractProjectDetail.tsx
Detailed view of a contract project with all documents.

**Props**:
```typescript
interface ContractProjectDetailProps {
  project: ContractProject;
  onBack: () => void;
  onAddDocument?: () => void;
}
```

**Features**:
- Document timeline
- Change evolution log
- Current status snapshot
- Action buttons

## Project Sub-components

### ChangeSummary.tsx
Displays AI-generated change analysis.

**Props**:
```typescript
interface ChangeSummaryProps {
  summary: string;
  sections: ChangeSection[];
}
```

**Features**:
- Expandable sections
- Confidence indicators
- Source document references

### ChangeEvolutionLog.tsx
Shows chronological history of document changes.

**Props**:
```typescript
interface ChangeEvolutionLogProps {
  entries: EvolutionEntry[];
}
```

**Features**:
- Timeline visualization
- Change type indicators
- Document source tracking

### CurrentStatusSnapshot.tsx
Displays current contract status and terms.

**Props**:
```typescript
interface CurrentStatusSnapshotProps {
  contractType: string;
}
```

**Features**:
- Categorized status items
- Change indicators
- Legend for status types

## Upload Components

### FileDropzone.tsx
Drag and drop file upload interface.

**Props**:
```typescript
interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}
```

**Features**:
- Drag and drop support
- File type validation
- Visual feedback states

### ProjectSetup.tsx
Form for creating new projects.

**Props**:
```typescript
interface ProjectSetupProps {
  onProjectCreate: (projectData: ProjectData) => void;
  suggestedName?: string;
}
```

**Features**:
- Project metadata form
- Tag management
- Suggested naming

### UploadProgress.tsx
Shows upload progress for multiple files.

**Props**:
```typescript
interface UploadProgressProps {
  files: UploadFile[];
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  disabled?: boolean;
}
```

**Features**:
- Progress bars
- Error handling
- Retry functionality

### UploadSummary.tsx
Summary and actions for upload process.

**Props**:
```typescript
interface UploadSummaryProps {
  stats: UploadStats;
  isUploading: boolean;
  onUpload: () => void;
  onRetryAll: () => void;
  onGoToDashboard: () => void;
  onProcessFiles: () => void;
}
```

**Features**:
- Upload statistics
- Action buttons
- Status messages

## Settings Components

### AccountProfile.tsx
User account and profile management.

**Props**:
```typescript
interface AccountProfileProps {
  onSave: (data: any) => void;
}
```

**Features**:
- Profile photo upload
- Password change modal
- Form validation

### Notifications.tsx
Notification preferences management.

**Props**:
```typescript
interface NotificationsProps {
  onSave: (data: any) => void;
}
```

**Features**:
- Toggle switches
- Frequency selection
- Real-time preview

### UIPreferences.tsx
User interface customization options.

**Props**:
```typescript
interface UIPreferencesProps {
  onSave: (data: any) => void;
}
```

**Features**:
- Theme selection
- Default view settings
- Live preview

### ExportDefaults.tsx
Default export format preferences.

**Props**:
```typescript
interface ExportDefaultsProps {
  onSave: (data: any) => void;
}
```

**Features**:
- Format selection
- Export options
- Preview display

## Custom Hooks

### useUpload.ts
Manages file upload state and operations.

**Returns**:
```typescript
interface UseUploadReturn {
  files: UploadFile[];
  isUploading: boolean;
  stats: UploadStats;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  uploadFiles: () => Promise<void>;
  retryFile: (id: string) => Promise<void>;
  clearFiles: () => void;
}
```

**Features**:
- File validation
- Upload simulation
- Progress tracking
- Error handling

## Styling Guidelines

### Tailwind Classes
Common utility classes used throughout:

```css
/* Layout */
.container-padding { @apply p-8; }
.card-base { @apply bg-white rounded-xl border border-gray-200; }
.button-primary { @apply bg-blue-600 text-white rounded-lg hover:bg-blue-700; }

/* Typography */
.heading-lg { @apply text-2xl font-bold text-gray-900; }
.heading-md { @apply text-lg font-semibold text-gray-900; }
.text-muted { @apply text-gray-600; }

/* States */
.state-active { @apply bg-blue-50 text-blue-700 border-blue-200; }
.state-hover { @apply hover:bg-gray-50 transition-colors; }
```

### Color System
- **Primary**: Blue (blue-600, blue-700)
- **Success**: Green (green-600, green-100)
- **Warning**: Yellow (yellow-600, yellow-100)
- **Error**: Red (red-600, red-100)
- **Neutral**: Gray (gray-50 to gray-900)

### Spacing System
8px grid system:
- `space-2` (8px)
- `space-4` (16px)
- `space-6` (24px)
- `space-8` (32px)

## Accessibility

### ARIA Labels
All interactive elements include appropriate ARIA labels:

```typescript
<button
  aria-label="Upload files"
  aria-describedby="upload-help-text"
>
  Upload
</button>
```

### Keyboard Navigation
- Tab order follows logical flow
- Enter/Space activate buttons
- Escape closes modals

### Screen Reader Support
- Semantic HTML elements
- Descriptive text for icons
- Status announcements

## Performance Optimization

### React.memo
Wrap components that receive stable props:

```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  // Component implementation
});
```

### useCallback
Memoize event handlers:

```typescript
const handleClick = useCallback(() => {
  // Handler implementation
}, [dependency]);
```

### Lazy Loading
Load components on demand:

```typescript
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

## Testing

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';

test('renders dashboard with statistics', () => {
  render(<Dashboard contracts={mockContracts} />);
  expect(screen.getByText('Projects Uploaded')).toBeInTheDocument();
});
```

### User Interaction Testing
```typescript
import { fireEvent } from '@testing-library/react';

test('handles file upload', () => {
  const onFilesAdded = jest.fn();
  render(<FileDropzone onFilesAdded={onFilesAdded} />);
  
  const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
  const input = screen.getByLabelText(/upload/i);
  
  fireEvent.change(input, { target: { files: [file] } });
  expect(onFilesAdded).toHaveBeenCalledWith([file]);
});
```

## Best Practices

1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Error Boundaries**: Wrap components that might fail
4. **Loading States**: Show loading indicators for async operations
5. **Empty States**: Provide helpful empty state messages
6. **Responsive Design**: Use responsive Tailwind classes
7. **Consistent Naming**: Use descriptive, consistent naming conventions

## Common Patterns

### Modal Pattern
```typescript
const [isOpen, setIsOpen] = useState(false);

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open Modal</button>
    {isOpen && (
      <Modal onClose={() => setIsOpen(false)}>
        <ModalContent />
      </Modal>
    )}
  </>
);
```

### Form Pattern
```typescript
const [formData, setFormData] = useState(initialData);

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit(formData);
};

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### List Pattern
```typescript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchItems().then(setItems).finally(() => setLoading(false));
}, []);

if (loading) return <LoadingSpinner />;
if (items.length === 0) return <EmptyState />;

return (
  <div>
    {items.map(item => (
      <ItemComponent key={item.id} item={item} />
    ))}
  </div>
);
```

## Troubleshooting

### Common Issues

1. **Props not updating**: Check if parent component is re-rendering
2. **Styles not applying**: Verify Tailwind class names
3. **Event handlers not firing**: Check event binding and dependencies
4. **State not updating**: Ensure state updates are immutable

### Debug Tools

- React Developer Tools
- Browser DevTools
- Console logging
- TypeScript compiler errors

## Contributing

When adding new components:

1. Follow the established patterns
2. Add TypeScript interfaces
3. Include proper documentation
4. Write unit tests
5. Ensure accessibility compliance
6. Test responsive behavior