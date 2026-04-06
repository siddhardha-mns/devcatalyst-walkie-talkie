---
description: How to deploy DevCatalyst (Frontend on Vercel, Backend on Render)
---

### 1. Deploy the Backend to Render
1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    -   **Name**: `devcatalyst-backend`
    -   **Root Directory**: `server`
    -   **Runtime**: `Node`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node index.js`
5.  Click **Create Web Service**.
6.  Once deployed, copy your **URL** (e.g., `https://devcatalyst-backend.onrender.com`).

### 2. Update the Frontend Configuration
1.  Open `client/index.html`.
2.  Find the `SERVER_URL` constant (around line 614).
3.  Replace `window.location.origin` with your Render URL:
    ```javascript
    const SERVER_URL = "https://your-render-url.onrender.com"; 
    ```
4.  Commit and push this change to your repository.

### 3. Deploy the Frontend to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** → **Project**.
3.  Import your GitHub repository.
4.  In the **Configure Project** section:
    -   **Framework Preset**: `Other`
    -   **Root Directory**: Click **Edit** and select the `client` folder.
5.  Click **Deploy**.
6.  Your app is now live at the Vercel URL!
