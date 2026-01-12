# Digital Logbook (Electron + .NET)

A cross-platform desktop application for digital logbook recording, built with Electron, React, and .NET 8.

## 🚀 Features

- **Digital Inking**: Draw naturally on PDF templates using a stylus or mouse.
- **Form Filling**: Automatically detects and lets you fill out PDF form fields.
- **Cloud Sync**: Save your drafts and projects to the self-hosted backend.
- **Project Management**: Organize your work into projects (templates) and versioned drafts.
- **Export**: detailed PDF export with high-quality vector annotations.
- **Authentication**: Secure user accounts with JWT authentication.

## 🛠️ Tech Stack

- **Frontend (Desktop)**:
  - [Electron](https://www.electronjs.org/)
  - [React](https://react.dev/) + [Vite](https://vitejs.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [react-pdf](https://github.com/wojtekmaj/react-pdf)

- **Backend (API)**:
  - [.NET 8 Web API](https://dotnet.microsoft.com/)
  - [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
  - [SQLite](https://www.sqlite.org/)
  - [iText7](https://itextpdf.com/) (PDF Processing)

## 📂 Project Structure

```
/
├── apps/
│   ├── desktop/      # Electron Client
│   └── api/          # ASP.NET Core API
├── packages/         # Shared Libraries
│   ├── backend.core
│   ├── backend.data
│   └── ...
└── DigitalLogbook.sln
```

## ⚡ Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **.NET SDK** (v8.0)

### 1. Setup Backend

The backend handles authentication, file storage, and PDF processing.

```bash
# Restore dependencies
dotnet restore

# Initialize the database (SQLite)
dotnet ef database update --project apps/api/DigitalLogbook.Api.csproj

# Run the API
dotnet run --project apps/api/DigitalLogbook.Api.csproj --urls "http://localhost:5263"
```
The API will be available at `http://localhost:5263`.

### 2. Setup Desktop App

Open a new terminal for the frontend.

```bash
cd apps/desktop

# Install dependencies
npm install

# Start the Electron development app
npm run dev
```

## 📦 Building for Production

To create a distributable installer for your OS:

```bash
cd apps/desktop
npm run build
```
The output will be generated in the `dist` or `release` folder.

## 📄 License

[MIT](LICENSE)
