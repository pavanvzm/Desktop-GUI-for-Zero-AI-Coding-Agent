# Zero Desktop

Desktop GUI for [Zero](https://github.com/pavanvzm/zero) - An AI Coding Agent that helps you code faster with intelligent assistance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Electron](https://img.shields.io/badge/Electron-28.1.0-47848F)

## Features

- 🖥️ **Native Desktop Application** - Cross-platform desktop GUI built with Electron
- 🎨 **Modern UI** - Clean, dark-themed interface built with React and Tailwind CSS
- 🔌 **Multi-Provider Support** - Connect to various AI providers:
  - OpenAI
  - Anthropic
  - Ollama (local models)
  - LM Studio (local models)
  - Groq
  - Google Gemini
- 📝 **Session Management** - Create, manage, and fork multiple coding sessions
- 🔐 **Permission Control** - Granular permission system for file writes, shell commands, and network access
- 📊 **Real-time Output** - Live terminal output with ANSI color support
- 🗂️ **Git Integration** - Work with Git repositories and worktrees
- ⚡ **Interactive & Exec Modes** - Choose between interactive coding sessions or one-off executions

## Prerequisites

Before using Zero Desktop, you need:

1. **Node.js** (v18 or higher)
2. **Zero CLI** - The core Zero AI Coding Agent binary
   - Install from: https://github.com/pavanvzm/zero

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/pavanvzm/zero.git
cd zero/zero-desktop
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Development Mode

Run the application in development mode with hot-reload:

```bash
npm run electron:dev
```

This will start both the Vite dev server and Electron simultaneously.

### 4. Build for Production

Build the application for your platform:

```bash
npm run electron:build
```

The built application will be available in the `release/` directory.

## Project Structure

```
zero-desktop/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # App entry point
│   │   ├── preload.ts          # Preload script for context isolation
│   │   ├── ipc/
│   │   │   └── handlers.ts     # IPC channel handlers
│   │   └── services/
│   │       └── ZeroProcessManager.ts  # Manages Zero CLI processes
│   ├── renderer/               # React renderer process
│   │   ├── components/
│   │   │   └── ui/            # Reusable UI components
│   │   ├── store/
│   │   │   └── index.ts       # Zustand state management
│   │   ├── lib/
│   │   │   └── utils.ts       # Utility functions
│   │   └── index.css          # Global styles with Tailwind
│   └── shared/
│       └── types.ts           # Shared TypeScript types
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production and package |
| `npm run preview` | Preview production build |
| `npm run electron:dev` | Run Electron in development mode |
| `npm run electron:build` | Build and package Electron app |

## Configuration

### AI Providers

Zero Desktop supports multiple AI providers. Configure them through the settings UI:

- **API Keys**: Securely store API keys for cloud providers
- **Local Models**: Connect to Ollama or LM Studio for local inference
- **Custom Endpoints**: Set custom base URLs for compatible APIs

### Settings

Access settings via the UI to configure:

- **Theme**: Dark, Light, or System
- **Auto-approve**: Enable auto-approval for low-risk operations
- **Max Sessions**: Limit concurrent AI sessions
- **Zero Binary Path**: Specify custom path to Zero CLI
- **Default Work Directory**: Set default project directory

## Usage

### Starting a Session

1. Open Zero Desktop
2. Click "New Session" or navigate to the Dashboard
3. Select a Git repository
4. Choose your AI model/provider
5. Enter your task or prompt
6. Monitor the session output in real-time

### Permission Requests

When Zero needs to perform sensitive operations, you'll see permission requests:

- **File Write**: Review and approve/deny file modifications
- **Shell Command**: Approve command execution
- **Network Access**: Control external API calls

You can set default actions for each permission type in Settings.

### Session Management

- **View Sessions**: See all active and past sessions
- **Fork Sessions**: Create new sessions from existing ones
- **Delete Sessions**: Clean up completed sessions

## Technology Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or feature requests, please open an issue on the [GitHub repository](https://github.com/pavanvzm/zero/issues).

## Acknowledgments

- Built on top of the [Zero AI Coding Agent](https://github.com/pavanvzm/zero)
- Inspired by modern developer tools and IDEs
