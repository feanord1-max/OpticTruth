# OpticTruth

## Project Setup

### Prerequisites
To build the iOS app and manage dependencies, you need:
1.  **Node.js**: [Download LTS Version](https://nodejs.org/)
2.  **Xcode**: Download from the Mac App Store (Required for iOS)
3.  **Git**: Already initialized in this folder.

### Running Locally
You can run a local server using Python (pre-installed on macOS):
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000/profile.html`.

### Deployment (Web)
To put this on the internet:
1.  Create an account on [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2.  **Option A (Easy)**: Drag and drop this folder onto the Netlify dashboard.
3.  **Option B (Recommended)**: Push this code to GitHub and connect it to Vercel/Netlify for automatic updates.

### iOS App (Coming Soon)
Once Node.js is installed, we will:
1.  Run `npm init` to create a package file.
2.  Install Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/ios`.
3.  Build the app: `npx cap add ios`.
