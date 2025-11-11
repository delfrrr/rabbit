# Rabbit R1 Creations

A collection of Rabbit R1 Creations hosted on GitHub Pages.

## 📱 Available Creations


### 👋 Hello World

**Path:** [`/hello-world`](https://delfrrr.github.io/rabbit/hello-world/)

**Description:** A simple Hello World application for Rabbit R1

**QR Code:**

![Hello World QR Code](docs/qr-codes/hello-world.png)

**Scan this QR code with your Rabbit R1 device to launch the app.**

[🔗 Open Hello World](https://delfrrr.github.io/rabbit/hello-world/)


### 🎮 Plugin Demo

**Path:** [`/plugin-demo`](https://delfrrr.github.io/rabbit/plugin-demo/)

**Description:** Demonstrates various features available to R1 creations

**QR Code:**

![Plugin Demo QR Code](docs/qr-codes/plugin-demo.png)

**Scan this QR code with your Rabbit R1 device to launch the app.**

[🔗 Open Plugin Demo](https://delfrrr.github.io/rabbit/plugin-demo/)


---

## 🚀 How It Works

### Repository Structure

```
rabbit/
├── hello-world/          # Hello World app
│   ├── index.html
│   ├── css/
│   └── js/
├── plugin-demo/          # Plugin Demo app
│   ├── index.html
│   ├── css/
│   └── js/
├── scripts/               # Build scripts
│   └── generate-qr-codes.js
├── docs/                  # Documentation and QR codes
│   └── qr-codes/
└── .github/
    └── workflows/
        └── deploy-pages.yml
```

### Automatic Deployment

1. **Push to main branch** → GitHub Actions workflow triggers
2. **QR Code Generation** → Script scans for apps and generates QR codes
3. **README Update** → README.md is automatically updated with QR codes
4. **GitHub Pages Deployment** → Entire repository is deployed to GitHub Pages

### Accessing Apps

Each app is accessible at:
- `https://delfrrr.github.io/rabbit/{app-name}/`

For example:
- Hello World: `https://delfrrr.github.io/rabbit/hello-world/`
- Plugin Demo: `https://delfrrr.github.io/rabbit/plugin-demo/`

### Adding a New App

1. Create a new directory in the repository root (e.g., `my-app/`)
2. Add an `index.html` file in that directory
3. Add the app directory to `APP_DIRS` in `scripts/generate-qr-codes.js`
4. Add metadata to `APP_METADATA` in the same file
5. Push to main branch - QR codes will be auto-generated!

### R1 Creation Requirements

Each app directory must contain:
- `index.html` - Main HTML file
- `css/styles.css` - Stylesheet (optional but recommended)
- `js/app.js` - JavaScript logic (optional)

**Important:** R1 Creations must be designed for a **240x282px** viewport.

### Technical Details

- **Hosting:** GitHub Pages (static hosting)
- **Deployment:** Automated via GitHub Actions
- **QR Code Generation:** Node.js script using `qrcode` package
- **Update Frequency:** On every push to main branch

---

## 📚 Documentation

### For Developers

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development documentation.

### For Users

1. Open the Rabbit R1 app on your device
2. Scan the QR code for the creation you want to use
3. The creation will load in the R1 browser

---

*Last updated: 2025-11-11T18:03:44.932Z*
