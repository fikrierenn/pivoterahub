# Intake Form System Design Document

## Overview

The Intake Form System provides a flexible, dynamic form interface for collecting client consultation data. The system uses database-driven form templates and JSONB storage to support evolving business needs without code changes.

## Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   API Endpoints  │    │    Database     │
│                 │    │                  │    │                 │
│ - Dynamic Form  │◄──►│ /api/clients/    │◄──►│ - Form Templates│
│ - Validation    │    │ [id]/intake      │    │ - Form Responses│
│ - Progress      │    │                  │    │ - Client Data   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │  Form Renderer   │             │
         └──────────────►│                  │◄────────────┘
                        │ - Question Types │
                        │ - Validation     │
                        │ - State Mgmt     │
                        └──────────────────┘
```

### Data Flow

1. **Template Loading**: System loads active form template from database
2. **Form Rendering**: Dynamic form renderer creates UI based on template
3. **User Input**: Client information collected through form interface
4. **Validation**: Real-time validation based on question types and rules
5. **Data Storage**: Form responses saved in JSONB format
6. **Integration**: Form data feeds into analysis workflow

## Components and Interfaces

### Database Schema (Existing)

```sql
-- Form templates (already exists)
CREATE TABLE intake_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form responses (already exists)
CREATE TABLE client_intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES intake_form_templates(id),
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints (Existing)

#### GET /api/intake-questions
**Purpose**: Retrieve active form template

**Response**:
```typescript
{
  template: {
    id: string;
    name: string;
    description: string;
    questions: FormQuestion[];
  }
}
```

#### POST /api/clients/[id]/intake
**Purpose**: Save intake form responses

**Request Body**:
```typescript
{
  answers: Record<string, any>;
}
```

#### PUT /api/clients/[id]/intake
**Purpose**: Update existing intake form responses

### Frontend Components

#### IntakeFormPage Component
- Main form container with progress tracking
- Dynamic question rendering based on template
- Form validation and error handling
- Save/update functionality

#### DynamicFormRenderer Component
- Renders questions based on type (text, textarea, select, etc.)
- Handles conditional question logic
- Manages form state and validation
- Provides consistent styling across question types

#### FormQuestionComponents
- TextInput: Single-line text input
- TextareaInput: Multi-line text input
- SelectInput: Dropdown selection
- MultiselectInput: Multiple choice selection
- NumberInput: Numeric input with validation
- JsonInput: Structured data input

#### IntakeFormViewer Component
- Read-only display of completed forms
- Organized layout with sections and categories
- Highlighting of key information
- Quick edit access

## Data Models

### TypeScript Interfaces

```typescript
interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'json';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select/multiselect
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    dependsOn: string;
    value: any;
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  questions: FormQuestion[];
  is_active: boolean;
  is_default: boolean;
}

interface IntakeFormResponse {
  id: string;
  client_id: string;
  template_id?: string;
  answers: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface FormValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'range';
}
```

## Error Handling

### Validation Errors
- Required field validation
- Format validation (email, phone, etc.)
- Length validation for text inputs
- Range validation for numeric inputs
- Custom validation rules per question type

### API Error Responses
- 400: Invalid form data or validation errors
- 404: Client not found or template not found
- 409: Conflict when updating form responses
- 500: Database or server errors

### Frontend Error States
- Network connection errors
- Form validation errors
- Save/update failures
- Template loading errors

## Testing Strategy

### Unit Tests
- Form validation logic
- Question type rendering
- Data transformation functions
- API request/response handling

### Integration Tests
- Complete form submission flow
- Form update and edit functionality
- Template loading and rendering
- Database operations

### End-to-End Tests
- User form completion journey
- Form editing and updates
- Error handling scenarios
- Mobile responsiveness

## Performance Considerations

### Optimization
- Lazy loading of form templates
- Debounced auto-save functionality
- Efficient form state management
- Minimal re-renders on input changes

### Caching
- Template caching in browser storage
- Form draft auto-save
- Optimistic updates for better UX

### Mobile Optimization
- Touch-friendly form controls
- Responsive layout design
- Keyboard optimization for mobile
- Progressive form loading

## Security Considerations

### Data Protection
- Input sanitization for all form fields
- XSS prevention in dynamic content
- Secure storage of sensitive information

### Access Control
- Client-specific form access
- Template modification permissions
- Audit trail for form changes

### Validation
- Server-side validation for all inputs
- SQL injection prevention
- File upload restrictions (if applicable)