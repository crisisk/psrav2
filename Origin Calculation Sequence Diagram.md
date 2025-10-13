# Origin Calculation Sequence Diagram

This document provides a detailed sequence diagram for the origin calculation flow in the PSRA-LTSD Enterprise v2 platform.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Server
    participant Database
    participant Origin Engine
    participant LLM

    User->>Frontend: Submit product for origin calculation
    Frontend->>API Server: POST /origin-calculations
    API Server->>Database: Create calculation record (status: pending)
    API Server->>Frontend: Return calculation ID
    Frontend->>User: Display loading indicator
    
    API Server->>Origin Engine: POST /calculate
    Origin Engine->>Origin Engine: Initialize calculation
    
    par Component Analysis
        Origin Engine->>LLM: Analyze component 1
        LLM->>Origin Engine: Component 1 analysis
        Origin Engine->>Origin Engine: Process component 1 result
    and
        Origin Engine->>LLM: Analyze component 2
        LLM->>Origin Engine: Component 2 analysis
        Origin Engine->>Origin Engine: Process component 2 result
    end
    
    Origin Engine->>LLM: Analyze manufacturing processes
    LLM->>Origin Engine: Manufacturing analysis
    
    Origin Engine->>LLM: Determine origin
    LLM->>Origin Engine: Origin determination
    
    Origin Engine->>LLM: Verify preferential status
    LLM->>Origin Engine: Preferential status verification
    
    Origin Engine->>LLM: Generate report
    LLM->>Origin Engine: Origin report
    
    Origin Engine->>API Server: Return calculation result
    API Server->>Database: Update calculation record (status: completed)
    
    loop Polling (if not using WebSockets)
        Frontend->>API Server: GET /origin-calculations/{id}
        API Server->>Database: Get calculation record
        Database->>API Server: Return calculation record
        API Server->>Frontend: Return calculation status and result
    end
    
    Frontend->>User: Display calculation result
```

## Detailed Flow Description

### 1. Calculation Initiation

1. **User Submits Product**:
   - User fills out product details and selects trade agreement
   - User clicks "Calculate Origin" button

2. **Frontend Sends Request**:
   - Frontend validates form data
   - Frontend sends POST request to `/origin-calculations`
   - Request includes product ID, trade agreement ID, and calculation type

3. **API Server Creates Record**:
   - API Server validates request data
   - API Server creates calculation record in database with status "pending"
   - API Server returns calculation ID to Frontend

4. **Frontend Updates UI**:
   - Frontend displays loading indicator
   - Frontend starts polling for updates or establishes WebSocket connection

### 2. Origin Engine Processing

1. **API Server Forwards Request**:
   - API Server retrieves product and trade agreement details
   - API Server sends calculation request to Origin Engine

2. **Origin Engine Initializes**:
   - Origin Engine validates input data
   - Origin Engine creates calculation context
   - Origin Engine initializes LangGraph workflow

3. **Parallel Component Analysis**:
   - Origin Engine processes components in parallel
   - For each component:
     - Send component data to LLM
     - LLM analyzes component origin
     - Process and store component analysis

4. **Manufacturing Analysis**:
   - Origin Engine sends manufacturing process data to LLM
   - LLM analyzes impact on origin
   - Origin Engine processes manufacturing analysis

5. **Origin Determination**:
   - Origin Engine sends component and manufacturing analyses to LLM
   - LLM determines product origin
   - Origin Engine processes origin determination

6. **Preferential Status Verification**:
   - Origin Engine sends origin and trade agreement data to LLM
   - LLM verifies preferential status
   - Origin Engine processes preferential status verification

7. **Report Generation**:
   - Origin Engine sends all analyses to LLM
   - LLM generates comprehensive origin report
   - Origin Engine processes and formats report

### 3. Result Handling

1. **Origin Engine Returns Result**:
   - Origin Engine compiles final result
   - Origin Engine returns result to API Server

2. **API Server Updates Record**:
   - API Server validates result
   - API Server updates calculation record in database with status "completed"
   - API Server stores result data

3. **Frontend Retrieves Result**:
   - If polling: Frontend periodically checks calculation status
   - If WebSocket: API Server pushes update to Frontend
   - Frontend receives completed calculation with result

4. **Frontend Displays Result**:
   - Frontend processes result data
   - Frontend displays origin determination and report
   - Frontend provides options to download or share report

## Alternative Flows

### Error Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Server
    participant Database
    participant Origin Engine
    participant LLM

    User->>Frontend: Submit product for origin calculation
    Frontend->>API Server: POST /origin-calculations
    API Server->>Database: Create calculation record (status: pending)
    API Server->>Frontend: Return calculation ID
    Frontend->>User: Display loading indicator
    
    API Server->>Origin Engine: POST /calculate
    Origin Engine->>LLM: Process calculation
    LLM-->>Origin Engine: Error response
    
    Origin Engine->>Origin Engine: Attempt retry
    Origin Engine->>LLM: Retry calculation
    LLM-->>Origin Engine: Error response
    
    Origin Engine->>API Server: Return error details
    API Server->>Database: Update calculation record (status: failed)
    
    Frontend->>API Server: GET /origin-calculations/{id}
    API Server->>Database: Get calculation record
    Database->>API Server: Return calculation record
    API Server->>Frontend: Return calculation status and error
    
    Frontend->>User: Display error message
```

### Streaming Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Server
    participant Origin Engine
    participant LLM

    User->>Frontend: Submit product for origin calculation
    Frontend->>API Server: POST /origin-calculations/stream
    API Server->>Frontend: Establish SSE connection
    
    API Server->>Origin Engine: POST /calculate/stream
    Origin Engine->>API Server: Establish SSE connection
    
    Origin Engine->>LLM: Initialize calculation
    Origin Engine->>API Server: Send "Calculation started" update
    API Server->>Frontend: Forward update
    Frontend->>User: Display "Calculation started"
    
    Origin Engine->>LLM: Analyze components
    Origin Engine->>API Server: Send "Analyzing components" update
    API Server->>Frontend: Forward update
    Frontend->>User: Display "Analyzing components"
    
    Origin Engine->>LLM: Analyze manufacturing
    Origin Engine->>API Server: Send "Analyzing manufacturing" update
    API Server->>Frontend: Forward update
    Frontend->>User: Display "Analyzing manufacturing"
    
    Origin Engine->>LLM: Determine origin
    Origin Engine->>API Server: Send "Determining origin" update
    API Server->>Frontend: Forward update
    Frontend->>User: Display "Determining origin"
    
    Origin Engine->>LLM: Verify preferential status
    Origin Engine->>API Server: Send "Verifying preferential status" update
    API Server->>Frontend: Forward update
    Frontend->>User: Display "Verifying preferential status"
    
    Origin Engine->>LLM: Generate report
    Origin Engine->>API Server: Send "Generating report" update
    API Server->>Frontend: Forward update
    Frontend->>User: Display "Generating report"
    
    Origin Engine->>API Server: Send final result
    API Server->>Frontend: Forward final result
    Frontend->>User: Display calculation result
    
    API Server->>Frontend: Close SSE connection
    Origin Engine->>API Server: Close SSE connection
```

## Performance Considerations

1. **Parallel Processing**:
   - Component analysis is performed in parallel to reduce calculation time
   - Multiple calculations can be processed simultaneously by scaling the Origin Engine

2. **Caching**:
   - Similar calculations are cached to avoid redundant processing
   - Trade agreement rules are cached for quick access

3. **Asynchronous Processing**:
   - Long-running calculations are processed asynchronously
   - Users can continue working while calculations are in progress

4. **Streaming Updates**:
   - Real-time updates provide feedback during long-running calculations
   - Users can see the progress of their calculations

## Security Considerations

1. **Authentication and Authorization**:
   - All requests require authentication
   - Users can only access their own calculations
   - API keys are used for service-to-service communication

2. **Data Protection**:
   - Sensitive product data is encrypted
   - Calculation results are stored securely
   - Access to calculation data is logged

3. **Rate Limiting**:
   - API endpoints are rate limited to prevent abuse
   - LLM requests are rate limited to control costs

## Conclusion

The origin calculation flow is designed to provide a seamless user experience while ensuring high performance, reliability, and security. The asynchronous and streaming options allow for efficient processing of complex calculations, while the parallel processing and caching strategies optimize performance.
