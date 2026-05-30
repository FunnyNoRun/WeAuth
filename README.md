# WeAuth Landing Page & Protocol Redirector

This branch contains the source code for the official **WeAuth** landing page and the deep-link redirection service hosted on Cloudflare Pages.

## 🚀 Core Features

- **Deep Link Redirection**: Automatically handles `weauth://` protocol redirection for URLs containing `?uuid=xxxx`.
- **Intelligent Fallback**: Detects if the client is installed; if not, displays a refined installation prompt.
- **Mobile Responsive**: Fully optimized for mobile devices with specific layout adjustments.
- **Auto Deployment**: Integrated GitHub Actions for seamless deployment to Cloudflare Pages.

## 🛠️ Tech Stack

- **React 19** + **Vite**
- **Tailwind CSS** (for styling)
- **Framer Motion** (for premium animations)
- **Cloudflare Pages** (for hosting)

## 📦 Deployment

1. Push changes to the `static` branch.
2. Ensure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set in your GitHub Repository Secrets.
3. The GitHub Action will automatically build and deploy to your Cloudflare Pages project.

---
Maintained by [FunnyNoRun](https://github.com/FunnyNoRun) 
