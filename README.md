# 🛡️ MedIntel AI: Advanced Health Diagnostic & Risk Prediction Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Runtime-Vite%208-646CFF?logo=vite)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%20Pro-4285F4?logo=google-cloud)](https://ai.google.dev/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/pshree2003/Smart-Health-Report-Analyzer-with-AI-Risk-Prediction)
[![Live Demo](https://img.shields.io/badge/Live-Demo-2ecc71?logo=vercel)](https://medintel-ai-shrikantp.surge.sh/)

**MedIntel AI** is a professional-grade health informatics ecosystem designed to bridge the gap between complex laboratory data and actionable patient insights. By leveraging State-of-the-Art (SOTA) Multimodal Large Language Models via the **Google Gemini Pro** infrastructure, MedIntel AI automates the extraction, analysis, and visualization of clinical reports to provide a 360-degree view of a patient’s health trajectory.

---

## 🏗️ Technical Architecture

The platform is designed around a decoupled, intelligence-first architecture that prioritizes privacy and low-latency processing.

```mermaid
graph TD
    %% User Layer
    User[User] -- "Base64 Blobs" --> UI[React Frontend Hub]
    
    %% Application Layer
    subgraph "Application Layer (Vite Runtime)"
        UI -- "State Management" --> Context[Context API]
        Context -- "Route Protection" --> Dashboard[Clinical Dashboard]
        Dashboard -- "Export" --> PDF[html2pdf Engine]
    end

    %% Intelligence Layer
    subgraph "Intelligence Core"
        UI -- "Multimodal Prompting" --> GeminiNode{Gemini AI Hub}
        GeminiNode -- "Primary" --> G15F[Gemini 1.5 Flash]
        GeminiNode -- "Secondary" --> G15P[Gemini 1.5 Pro]
        GeminiNode -- "Experimental" --> G2F[Gemini 2.0 Flash Exp]
    end

    %% External & Data Layer
    subgraph "External Integration"
        GeminiNode -- "Schema Extraction" --> JSON[Structured Health JSON]
        Dashboard -- "City Query" --> Discovery[Discovery Engine]
        Discovery -- "Geospatial" --> OSM[OpenStreetMap / Nominatim]
    end

    %% Visualization
    JSON --> Dashboard
    OSM --> Dashboard
```

---

## 🔄 Operational Workflow

MedIntel AI follows a strict linear pipeline from unstructured ingestion to structured medical discovery.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant AI as Gemini Pro AI Node
    participant D as Dashboard HUD
    participant DS as Discovery Engine

    U->>F: Upload Report (PDF/Image)
    F->>F: Convert to Base64 (Local)
    F->>AI: Send Payload (Prompt + Data)
    Note over AI: Multi-Model Fallback Logic Execution
    AI-->>F: Structured JSON Health Schema
    F->>D: Hydrate Visualization Components
    D->>U: Display Health Score & Risk Analysis
    U->>DS: Query Local Healthcare Facilities
    DS->>AI: Fetch Specialist Data
    alt AI Failed
        DS->>DS: OSM Nominatim Fallback
    end
    DS-->>D: Display 10+ Hospitals & Consultants
```

---

## 🔬 Core Capabilities

### 1. Intelligent Clinical Ingestion
Utilizing high-performance Multimodal AI, the platform parses unstructured data from PDF and image-based laboratory results (e.g., CBC, Metabolic Panels). It identifies critical markers with high precision and maps them to a validated clinical schema.

### 2. Predictive Risk Stratification
Specialized AI agents evaluate longitudinal and static health markers against clinical benchmarks to predict risks for:
*   **Cardiovascular Resilience**: Assessment of lipid profiles and inflammatory markers.
*   **Glycemic Stability**: Analysis of glucose and HbA1c indicators.
*   **Hematological Balance**: Detection of anomalies in immune response and oxygen-carrying capacity.

### 3. Smart Healthcare Discovery
A dual-layer routing system matches identified health risks with appropriate medical facilities:
*   **Specialist Matching**: Prioritizes Hematologists or Cardiologists based on report findings.
*   **Geospatial Discovery**: Real-time identification of top-tier hospitals within the user's vicinity.

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 / Vite 8 | Core SPA infrastructure and fast HMR. |
| **Intelligence** | Google Gemini 1.5 | SOTA Multimodal extraction and reasoning. |
| **Geospatial** | OSN / Nominatim | Privacy-focused hospital location discovery. |
| **State** | React Context API | Global theme and health data orchestration. |
| **UI/UX** | CSS Glassmorphism | Premium, medical-grade visual interface. |
| **Icons** | Lucide React | High-contrast, accessibility-ready iconography. |

---

## ⚙️ Installation & Deployment

### Prerequisites
*   **Node.js**: v18.0.0+
*   **API Key**: A valid [Google AI Studio](https://aistudio.google.com/) Gemini API Key.

### Setup Guide
1.  **Clone the Ecosystem**:
    ```bash
    git clone https://github.com/pshree2003/Smart-Health-Report-Analyzer-with-AI-Risk-Prediction.git
    cd Smart-Health-Report-Analyzer-with-AI-Risk-Prediction
    ```
2.  **Initialize Environment**:
    Create a `.env` file in the root:
    ```env
    VITE_GEMINI_API_KEY=YOUR_SECURE_API_KEY
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Launch Local Instance**:
    ```bash
    npm run dev
    ```

---

## 🔐 Privacy & Ethical AI
**MedIntel AI** operates on the principle of **Ephemeral Health Data**. 
*   **Local Processing**: File-to-Base64 conversion happens entirely in the browser.
*   **Non-Persistence**: Health data is processed in-memory for the duration of the session and is **not persisted** on any external database.
*   **Medical Disclaimer**: AI-generated predictions are for informational purposes only and must be verified by a licensed medical professional.

---

## 👥 Contributors & Support
Developed and maintained by **[PShree](https://github.com/pshree2003)**. 
*Advancing the boundaries of AI-driven prophylactic medicine.*

---
© 2024 MedIntel AI Ecosystem. Licensed under MIT.
