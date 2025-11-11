# Development Documentation

## Overview

This repository hosts multiple Rabbit R1 Creations on GitHub Pages. Each creation is a self-contained web application that runs in the Rabbit R1 device's browser.

## Architecture

### Repository Structure

```
rabbit/
├── hello-world/              # Example: Hello World app
│   ├── index.html            # Main HTML file (required)
│   ├── css/
│   │   └── styles.css       # Stylesheet
│   └── js/
│       └── app.js            # JavaScript logic
├── plugin-demo/              # Example: Plugin Demo app
│   ├── index.html
│   ├── css/
│   └── js/
├── scripts/
│   └── generate-qr-codes.js  # Auto-generates QR codes
├── docs/
│   ├── DEVELOPMENT.md        # This file
│   └── qr-codes/             # Generated QR code images
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # GitHub Actions deployment
└── README.md                 # Auto-generated with QR codes
```

### How It Works

1. **App Structure**: Each app is a directory containing an `index.html` file
2. **QR Code Generation**: A Node.js script scans for apps and generates QR codes
3. **Auto-Deployment**: GitHub Actions automatically deploys on push to main
4. **GitHub Pages**: Static files are served from the `gh-pages` branch

## Creating a New R1 Creation

### Step 1: Create App Directory

Create a new directory in the repository root:

```bash
mkdir my-new-app
cd my-new-app
```

### Step 2: Create Required Files

**index.html** (required):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=240, initial-scale=1.0, user-scalable=no">
    <title>My New App - R1 Creation</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="app">
        <!-- Your app content here -->
    </div>
    <script src="js/app.js"></script>
</body>
</html>
```

**css/styles.css** (recommended):
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    width: 240px;
    height: 282px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    font-size: 12px;
    background: #0a0a0a;
    color: #fff;
    overflow: hidden;
}

/* Your styles here */
```

**js/app.js** (optional):
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('My New App loaded!');
    
    // Check if running as R1 plugin
    if (typeof PluginMessageHandler !== 'undefined') {
        console.log('Running as R1 Creation');
    } else {
        console.log('Running in browser preview mode');
    }
    
    // Plugin message handler (for R1 device)
    window.onPluginMessage = function(data) {
        console.log('Received plugin message:', data);
    };
});
```

### Step 3: Register the App

Edit `scripts/generate-qr-codes.js`:

1. Add your app directory to the `APP_DIRS` array:
```javascript
const APP_DIRS = ['hello-world', 'plugin-demo', 'my-new-app'];
```

2. Add metadata to `APP_METADATA`:
```javascript
const APP_METADATA = {
  // ... existing apps
  'my-new-app': {
    name: 'My New App',
    description: 'Description of what this app does',
    icon: '🚀'
  }
};
```

### Step 4: Test Locally

1. Install dependencies:
```bash
npm install
```

2. Generate QR codes locally:
```bash
npm run generate-qr
```

3. Test your app:
   - Open `my-new-app/index.html` in a browser
   - Resize browser window to 240x282px to simulate R1 device
   - Or use browser dev tools to set custom viewport size

### Step 5: Deploy

1. Commit your changes:
```bash
git add my-new-app/
git add scripts/generate-qr-codes.js
git commit -m "Add my-new-app creation"
git push origin main
```

2. GitHub Actions will automatically:
   - Generate QR codes
   - Update README.md
   - Deploy to GitHub Pages

3. Your app will be available at:
   - `https://delfrrr.github.io/rabbit/my-new-app/`

## R1 Creation Specifications

### Viewport Size

- **Width**: 240px (fixed)
- **Height**: 282px (fixed)
- **User Scalable**: No

### Browser Environment

R1 Creations run in a WebView with:
- Standard HTML5/CSS3/JavaScript support
- Access to R1-specific APIs (when available)
- No external network requests (apps must be self-contained)

### Best Practices

1. **Keep it simple**: R1 has limited resources
2. **Optimize assets**: Minimize image sizes, use CSS for styling
3. **Test locally**: Use 240x282px viewport in browser dev tools
4. **Self-contained**: Don't rely on external CDNs or APIs
5. **Dark theme**: R1 has a dark background, design accordingly

## QR Code Generation

### How It Works

The `generate-qr-codes.js` script:

1. Scans for app directories listed in `APP_DIRS`
2. Verifies each directory has an `index.html` file
3. Generates QR code PNG images using the `qrcode` package
4. Saves QR codes to `docs/qr-codes/`
5. Updates `README.md` with app listings and QR codes

### Manual Generation

To generate QR codes locally:

```bash
npm install
npm run generate-qr
```

### QR Code Format

QR codes contain JSON data with:
- `title`: App name
- `url`: Full URL to the app
- `description`: App description
- `iconUrl`: (optional) Icon URL
- `themeColor`: (optional) Theme color

## GitHub Actions Workflow

### Workflow Steps

1. **Checkout**: Gets the latest code
2. **Setup Node.js**: Installs Node.js 18
3. **Generate QR codes**: Runs the QR code generation script
4. **Deploy**: Uses `peaceiris/actions-gh-pages` to deploy to `gh-pages` branch

### Workflow File

Located at: `.github/workflows/deploy-pages.yml`

### Manual Trigger

You can manually trigger the workflow:
1. Go to Actions tab in GitHub
2. Select "Deploy R1 Creations to GitHub Pages"
3. Click "Run workflow"

## Testing Locally

### Using a Local Server

```bash
# Python 3
python3 -m http.server 8000

# Node.js (with http-server)
npx http-server -p 8000

# Then visit: http://localhost:8000/hello-world/
```

### Browser Dev Tools

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set custom dimensions: 240x282
4. Test your app

## Troubleshooting

### QR Code Not Generating

- Check that `index.html` exists in the app directory
- Verify the app is listed in `APP_DIRS`
- Check Node.js version (requires Node 14+)

### App Not Loading on R1

- Verify viewport meta tag is correct
- Check for JavaScript errors in console
- Ensure all assets use relative paths
- Test in browser with 240x282px viewport

### GitHub Pages 404

- Wait a few minutes after deployment
- Check GitHub Pages settings (should use `gh-pages` branch)
- Verify the app directory exists in the deployed branch
- Check Actions tab for deployment errors

## Contributing

1. Create your app in a new directory
2. Follow the app structure guidelines
3. Add your app to the QR code generation script
4. Test locally
5. Submit a pull request

## Resources

- [Rabbit R1 Documentation](https://rabbit.tech)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [QR Code Generator](https://github.com/soldair/node-qrcode)

