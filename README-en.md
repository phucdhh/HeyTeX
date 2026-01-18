# 🚀 HeyTeX: The LaTeX & Typst Editor

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Status](https://img.shields.io/badge/status-Beta-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Wasm](https://img.shields.io/badge/powered%20by-WebAssembly-purple)

> 🌐 [Tài liệu tiếng Việt](README.md)

**HeyTeX** is an open-source online scientific document editing platform that brings a **Visual Studio Code**-like experience directly to your browser.

The project's special feature is its ability to support two "engines" simultaneously: **LaTeX** (server-side TeXLive) and **Typst** (client-side Wasm), combined with real-time collaboration capabilities and a rich template system.

## ✨ Key Features

### 1. 🖥️ VS Code-like IDE Interface
*   Uses **Monaco Editor** (the core of VS Code) for a familiar coding experience.
*   Supports IntelliSense, auto-completion, and snippets for both LaTeX and Typst.
*   Customizable interface (Dark Mode/Light Mode) and theme support.

### 2. ⚡ Dual-Engine Compilation (Hybrid)
The compilation system uses a hybrid model to balance performance and compatibility:
*   **LaTeX Projects:** Compiled with TeXLive on the server (server-side TeXLive)
*   **Typst Projects:** Integrated **Typst Wasm Renderer** running in the browser for fast feedback (client-side Wasm).

### 3. 📋 Rich Template System
*   **Template Gallery:** Professional template library for various purposes:
    *   **CV/Resume:** Modern CV and Academic CV with publication lists
    *   **Letter:** Formal and business letters
    *   **Article:** Scientific articles with references
    *   **Paper:** Research papers in IEEE format
    *   **Poster:** Conference posters with tikzposter
    *   **Report:** Technical reports and documentation
*   **Finder-style UI:** Intuitive 2-column interface for selecting engine and template
*   Full support for both LaTeX and Typst

### 4. 👤 User Profile Management
*   **Profile Dashboard:** Detailed project statistics (LaTeX/Typst counts)
*   **Account Info:** Registration date, last login timestamp
*   **Avatar Upload:** Customize profile picture with MinIO storage
*   **Password Management:** Secure password change with old password verification

### 5. 🤝 Real-time Collaboration
*   Allows multiple users to edit a document simultaneously.
*   Displays other users' cursors in real-time.
*   Uses **CRDT** (Conflict-free Replicated Data Types) algorithm via **Yjs** to ensure data integrity.

### 6. 🔄 SyncTeX & Live Preview
*   **Integrated PDF Viewer:** Preview results right next to the source code.
*   **Reverse Sync (SyncTeX):** Double-click on PDF to jump to corresponding code line and vice versa.
*   **Auto-compile:** Automatic compilation on changes (debounced)

### 7. 📂 Smart Project Management
*   Supports multi-level folder structures.
*   Import images/documents via Drag & Drop.
*   Quick project search by name or engine.

---

## 🏗️ Architecture & Tech Stack

### Frontend
*   **Framework:** [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   **Editor Core:** [Monaco Editor](https://microsoft.github.io/monaco-editor/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **UI Components:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
*   **UI Library:** [Radix UI](https://www.radix-ui.com/) for accessible components

### Compilation Engines (The Core)
*   **LaTeX:** `texlive` (Server-side TeXLive; not a Wasm build).
*   **Typst:** `@typst/compiler` (Official Wasm compiler, runs client-side).

### Real-time Backend (Collab)
*   **Protocol:** WebSocket.
*   **Library:** [Yjs](https://github.com/yjs/yjs) (CRDT framework) + `y-websocket`.
*   **Server:** Node.js (Express) + TypeScript.

### Database & Storage
*   **Metadata:** PostgreSQL with Prisma ORM (Store user info, project settings, login tracking).
*   **File Storage:** MinIO (S3-compatible) for avatars and assets.
*   **Project Files:** Local filesystem with organized directory structure.

---

## 🛠️ Installation Guide (Development)

### Requirements
*   Node.js >= 18.0.0
*   npm or yarn
*   PostgreSQL >= 14
*   MinIO or S3-compatible storage
*   TeXLive (for LaTeX compilation)

### Step 1: Clone Repository
```bash
git clone https://github.com/phucdhh/HeyTeX.git
cd HeyTeX
```

### Step 2: Install Dependencies
```bash
# Install Frontend dependencies
cd client
npm install

# Install Backend dependencies
cd ../server
npm install
```

### Step 3: Environment Configuration
Create `.env` files in both `client` and `server` directories based on `.env.example`. Ensure proper configuration for database, MinIO, and TeXLyre Wasm assets.

**Server .env example:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/heytex"
JWT_SECRET="your-secret-key"
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
```

### Step 4: Database Setup
```bash
cd server
npx prisma generate
npx prisma db push
```

### Step 5: Run Project

**macOS:**
```bash
# First-time setup
./setup-mac.sh

# Services auto-start with LaunchDaemon (after reboot)
# See details: documents/LAUNCHDAEMON.md

# Or start manually
./start-services.sh
```

**Development:**
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm run dev
```

**Production Build:**
```bash
# Build Frontend
cd client && npm run build

# Build Backend
cd server && npm run build

# Start Backend
cd server && node dist/index.js
```

📖 See more: [SCRIPTS.md](documents/SCRIPTS.md) - List of scripts & configs

---

## 📁 Template Structure

Templates are organized in the `templates/` directory:

```
templates/
├── latex/
│   ├── blank/          # Empty LaTeX document
│   ├── cv/             # Modern CV (moderncv)
│   ├── academic-cv/    # Academic CV with publications
│   ├── letter/         # Formal letter
│   ├── article/        # Article with references
│   ├── paper/          # Research paper (IEEE format)
│   ├── poster/         # Conference poster (tikzposter)
│   └── report/         # Technical report
└── typst/
    ├── blank/          # Empty Typst document
    ├── cv/             # Modern CV
    ├── academic-cv/    # Academic CV with publications
    ├── letter/         # Formal letter
    ├── article/        # Article with sections
    ├── paper/          # Research paper
    ├── poster/         # Conference poster
    └── report/         # Technical report
```

Each template contains:
- `template.json`: Metadata (id, name, description, engine, mainFile, files)
- Template files: `.tex` or `.typ` files with professional layouts

---

## 🚀 Deployment

### Using Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `cd client && npm run build`
2. Deploy static files to web server (nginx/Apache)
3. Build and run backend: `cd server && npm run build && node dist/index.js`
4. Configure reverse proxy for WebSocket support

### LaunchDaemon (macOS)
For production deployment on macOS, use LaunchDaemons for automatic service management:
```bash
# Install daemons
sudo cp launchd-daemons/*.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.heytex.*.plist
```

See [documents/LAUNCHDAEMON.md](documents/LAUNCHDAEMON.md) for details.

---

## Roadmap & Future Development

Planned features for future releases:

- [x] ✅ Template Gallery: Professional templates for reports, CVs, papers (both LaTeX and Typst).
- [x] ✅ Profile Management: Project statistics and account management.
- [x] ✅ Password Change: Secure password change with verification.
- [ ] Git Integration: Commit, push, and pull code directly from GitHub/GitLab.
- [ ] AI Assistant: Integrate LLM (like OpenAI/Gemini) to explain LaTeX errors or suggest formulas.
- [ ] Offline Mode (PWA): Allow basic editing and compilation even when offline (Service Workers).
- [ ] Export Options: Export to HTML and ePub (PDF already supported).
- [ ] Custom Templates: Allow users to create and share their own templates.
- [ ] Template Preview: Preview templates before creating projects.

---

## 💡 Architecture Recommendations

1.  **WebAssembly (Wasm) Handling:**
    *   The `.wasm` files are primarily related to **Typst** (client-side). Use **Service Workers** to cache these files on first load, so users don't have to reload them every time they refresh the page.
    *   Use **Web Workers** to run Typst compilation in a separate thread (background thread), avoiding UI freezing when compiling large documents.

2.  **Persistence Mechanism:**
    *   Since collaboration is enabled, you can't just store files locally in the browser. You need a mechanism to periodically sync the `Yjs` state (from RAM) to the database (Persistence Layer) to prevent data loss when all users leave the room.

3.  **Typst Optimization:**
    *   Typst has **Incremental Compilation** capability. Ensure your frontend only sends the "delta" (changed parts) to the Wasm compiler instead of sending the entire file content with each keystroke.

4.  **Security:**
    *   Although compilation happens client-side (browser), uploading images or PDF outputs still requires strict access control (ACL) on S3/MinIO.

---

## 🤝 Contributing

We welcome all contributions! Please read CONTRIBUTING.md to learn about our Pull Request process.

### Development Guidelines
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📚 References

HeyTeX is built upon the following open-source projects:

- **[TeXlyre](https://github.com/texlyre/texlyre)** - Web-based LaTeX editor with WebAssembly
- **[TeXlyre Infrastructure](https://github.com/texlyre/texlyre-infrastructure)** - Docker deployment infrastructure
- **[WASM LaTeX Tools](https://github.com/SwiftLaTeX/wasm-latex-tools)** - WebAssembly compilation tools
- **[TeXlyre Documentation](https://texlyre.github.io/)** - Official documentation
- **[Typst](https://typst.app/)** - Modern markup-based typesetting system
- **[Yjs](https://docs.yjs.dev/)** - CRDT framework for building collaborative applications

---

## 📄 License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

AGPL-3.0 requires:
- Source code disclosure when deploying online services
- Derivative works must use the same license
- Protects software freedom for the community

---

## 🙏 Acknowledgments

Special thanks to:
- The TeXlyre team for the WebAssembly LaTeX foundation
- The Typst team for the modern typesetting system
- The Monaco Editor and VS Code teams at Microsoft
- The Yjs community for CRDT collaboration tools
- All contributors and users of HeyTeX

---

## 📧 Contact

- **GitHub:** [phucdhh/HeyTeX](https://github.com/phucdhh/HeyTeX)
- **Issues:** [Report bugs or request features](https://github.com/phucdhh/HeyTeX/issues)
- **Email:** support@heytex.dev

---

Made with ❤️ by the HeyTeX team
