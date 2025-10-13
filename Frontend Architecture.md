# Frontend Architecture

This document outlines the architecture of the frontend application for the PSRA-LTSD Enterprise v2 platform.

## Overview

The frontend is a React-based single-page application that provides a user-friendly interface for interacting with the PSRA-LTSD Enterprise v2 platform. It communicates with the API server to perform operations and display data.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        React Application                        │
│                                                                 │
├─────────────┬─────────────┬─────────────────┬─────────────────┐ │
│             │             │                 │                 │ │
│    Pages    │  Components │     Hooks       │     Context     │ │
│             │             │                 │                 │ │
└─────────────┴─────────────┴─────────────────┴─────────────────┘ │
│                                                                 │
├─────────────┬─────────────┬─────────────────┬─────────────────┐ │
│             │             │                 │                 │ │
│    Redux    │    API      │     Utils       │     Config      │ │
│             │             │                 │                 │ │
└─────────────┴─────────────┴─────────────────┴─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │                 │
                        │    API Server   │
                        │                 │
                        └─────────────────┘
```

## Components

### Core Components

1. **Router**: Handles navigation between pages
2. **Authentication**: Handles user authentication and authorization
3. **API Client**: Communicates with the API server
4. **State Management**: Manages application state
5. **Error Handling**: Handles and displays errors
6. **Internationalization**: Handles translations
7. **Theme**: Manages the application theme
8. **Layout**: Manages the application layout

### Feature Modules

1. **Authentication**: User login, logout, and registration
2. **Dashboard**: Overview of recent calculations and reports
3. **Products**: Management of products and components
4. **Origin Calculation**: Wizard for calculating product origin
5. **Reports**: Viewing and exporting origin reports
6. **Trade Agreements**: Browsing trade agreements and rules
7. **Users**: Management of users and organizations
8. **Settings**: Configuration options for the platform

## Page Structure

### Public Pages

1. **Login**: User login page
2. **Register**: User registration page
3. **Forgot Password**: Password recovery page
4. **Reset Password**: Password reset page
5. **Landing**: Public landing page

### Protected Pages

1. **Dashboard**: Overview of recent calculations and reports
2. **Products**: List of products
3. **Product Detail**: Details of a product
4. **Origin Calculation**: Wizard for calculating product origin
5. **Reports**: List of reports
6. **Report Detail**: Details of a report
7. **Trade Agreements**: List of trade agreements
8. **Trade Agreement Detail**: Details of a trade agreement
9. **Users**: List of users
10. **User Detail**: Details of a user
11. **Organizations**: List of organizations
12. **Organization Detail**: Details of an organization
13. **Settings**: User and organization settings

## State Management

The frontend uses Redux Toolkit for state management, with the following slices:

1. **Auth**: Authentication state
2. **Products**: Products and components
3. **Trade Agreements**: Trade agreements and rules
4. **Origin Calculations**: Origin calculations
5. **Reports**: Origin reports
6. **Users**: Users and organizations
7. **UI**: UI state (theme, sidebar, etc.)

## API Integration

The frontend communicates with the API server using a custom API client built on top of Axios. The client handles:

1. **Authentication**: Adding authentication headers
2. **Error Handling**: Handling API errors
3. **Caching**: Caching responses
4. **Retries**: Retrying failed requests
5. **Cancellation**: Cancelling requests
6. **Logging**: Logging requests and responses

## Component Library

The frontend uses Material-UI as its component library, with custom components built on top of it. The component library includes:

1. **Layout Components**: Page layout, sidebar, header, footer
2. **Form Components**: Input fields, select fields, checkboxes, radio buttons
3. **Data Display Components**: Tables, cards, lists
4. **Feedback Components**: Alerts, snackbars, progress indicators
5. **Navigation Components**: Tabs, breadcrumbs, pagination
6. **Dialog Components**: Modals, drawers, popovers
7. **Chart Components**: Line charts, bar charts, pie charts

## Form Handling

The frontend uses Formik for form handling, with Yup for validation. Form components include:

1. **Form**: Base form component
2. **Field**: Base field component
3. **TextField**: Text input field
4. **SelectField**: Select field
5. **CheckboxField**: Checkbox field
6. **RadioField**: Radio button field
7. **DateField**: Date picker field
8. **FileField**: File upload field
9. **ArrayField**: Array field for managing lists
10. **ObjectField**: Object field for managing nested objects

## Routing

The frontend uses React Router for routing, with the following route structure:

```
/
├── login
├── register
├── forgot-password
├── reset-password
├── dashboard
├── products
│   ├── :id
│   └── new
├── origin-calculations
│   ├── :id
│   └── new
├── reports
│   └── :id
├── trade-agreements
│   └── :id
├── users
│   ├── :id
│   └── new
├── organizations
│   ├── :id
│   └── new
└── settings
```

## Authentication and Authorization

The frontend uses JWT-based authentication with Keycloak integration. The authentication flow is as follows:

1. User enters credentials on the login page
2. Frontend sends credentials to the API server
3. API server validates credentials and returns a JWT token
4. Frontend stores the token in local storage
5. Frontend includes the token in all subsequent requests
6. Frontend refreshes the token before it expires
7. User clicks logout
8. Frontend removes the token from local storage

## Error Handling

The frontend handles errors at multiple levels:

1. **API Client**: Handles network errors and API errors
2. **Redux Actions**: Handles errors in Redux actions
3. **Components**: Handles errors in components
4. **Global Error Boundary**: Catches unhandled errors

## Internationalization

The frontend uses react-intl for internationalization, with support for the following languages:

1. English
2. Dutch
3. German
4. French
5. Spanish

## Theming

The frontend uses Material-UI's theming system, with support for light and dark modes. The theme includes:

1. **Colors**: Primary, secondary, error, warning, info, success
2. **Typography**: Font family, font sizes, font weights
3. **Spacing**: Spacing scale
4. **Breakpoints**: Screen size breakpoints
5. **Shadows**: Box shadows
6. **Transitions**: Animation transitions
7. **Z-index**: Z-index scale

## Performance Considerations

1. **Code Splitting**: Split code by route
2. **Lazy Loading**: Lazy load components
3. **Memoization**: Memoize expensive calculations
4. **Virtualization**: Virtualize long lists
5. **Image Optimization**: Optimize images
6. **Bundle Size**: Minimize bundle size
7. **Caching**: Cache API responses
8. **Prefetching**: Prefetch data for likely navigation

## Accessibility

The frontend follows WCAG 2.1 AA guidelines, with the following considerations:

1. **Keyboard Navigation**: All functionality is accessible via keyboard
2. **Screen Readers**: All content is accessible to screen readers
3. **Color Contrast**: All text has sufficient color contrast
4. **Focus Indicators**: All focusable elements have visible focus indicators
5. **ARIA Attributes**: ARIA attributes are used where appropriate
6. **Semantic HTML**: Semantic HTML elements are used where appropriate

## Testing

The frontend includes the following types of tests:

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user flows
4. **Visual Regression Tests**: Test visual appearance
5. **Accessibility Tests**: Test accessibility compliance

## Deployment

The frontend is built as a static site and deployed to a CDN. The build process includes:

1. **Transpilation**: Transpile TypeScript to JavaScript
2. **Bundling**: Bundle JavaScript and CSS
3. **Minification**: Minify JavaScript and CSS
4. **Tree Shaking**: Remove unused code
5. **Code Splitting**: Split code by route
6. **Asset Optimization**: Optimize images and other assets
7. **Environment Configuration**: Configure environment variables
