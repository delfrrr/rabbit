const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const BASE_URL = 'https://delfrrr.github.io/rabbit';
const APPS_DIR = path.join(__dirname, '..');
const README_PATH = path.join(APPS_DIR, 'README.md');
const QR_DIR = path.join(APPS_DIR, 'docs', 'qr-codes');

// Ensure QR codes directory exists
if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

// App directories to include (must have index.html)
const APP_DIRS = ['hello-world', 'plugin-demo'];

// App metadata
const APP_METADATA = {
  'hello-world': {
    name: 'Hello World',
    description: 'A simple Hello World application for Rabbit R1',
    icon: '👋'
  },
  'plugin-demo': {
    name: 'Plugin Demo',
    description: 'Demonstrates various features available to R1 creations',
    icon: '🎮'
  }
};

async function generateQRCode(url, filepath) {
  try {
    await QRCode.toFile(filepath, url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    console.log(`✓ Generated QR code: ${filepath}`);
  } catch (err) {
    console.error(`✗ Error generating QR code for ${url}:`, err);
  }
}

async function checkAppExists(appDir) {
  const indexPath = path.join(APPS_DIR, appDir, 'index.html');
  return fs.existsSync(indexPath);
}

async function generateAllQRCodes() {
  console.log('Generating QR codes for R1 Creations...\n');
  
  const apps = [];
  
  for (const appDir of APP_DIRS) {
    const exists = await checkAppExists(appDir);
    if (!exists) {
      console.log(`⚠ Skipping ${appDir}: index.html not found`);
      continue;
    }
    
    const url = `${BASE_URL}/${appDir}`;
    const qrPath = path.join(QR_DIR, `${appDir}.png`);
    
    await generateQRCode(url, qrPath);
    
    const metadata = APP_METADATA[appDir] || {
      name: appDir,
      description: `R1 Creation: ${appDir}`,
      icon: '📱'
    };
    
    apps.push({
      dir: appDir,
      url: url,
      qrPath: `docs/qr-codes/${appDir}.png`,
      ...metadata
    });
  }
  
  return apps;
}

function generateREADME(apps) {
  const timestamp = new Date().toISOString();
  
  return `# Rabbit R1 Creations

A collection of Rabbit R1 Creations hosted on GitHub Pages.

## 📱 Available Creations

${apps.map(app => `
### ${app.icon} ${app.name}

**Path:** [\`/${app.dir}\`](${app.url})

**Description:** ${app.description}

**QR Code:**

![${app.name} QR Code](${app.qrPath})

**Scan this QR code with your Rabbit R1 device to launch the app.**

[🔗 Open ${app.name}](${app.url})
`).join('\n')}

---

## 🚀 How It Works

### Repository Structure

\`\`\`
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
\`\`\`

### Automatic Deployment

1. **Push to main branch** → GitHub Actions workflow triggers
2. **QR Code Generation** → Script scans for apps and generates QR codes
3. **README Update** → README.md is automatically updated with QR codes
4. **GitHub Pages Deployment** → Entire repository is deployed to GitHub Pages

### Accessing Apps

Each app is accessible at:
- \`https://delfrrr.github.io/rabbit/{app-name}/\`

For example:
- Hello World: \`https://delfrrr.github.io/rabbit/hello-world/\`
- Plugin Demo: \`https://delfrrr.github.io/rabbit/plugin-demo/\`

### Adding a New App

1. Create a new directory in the repository root (e.g., \`my-app/\`)
2. Add an \`index.html\` file in that directory
3. Add the app directory to \`APP_DIRS\` in \`scripts/generate-qr-codes.js\`
4. Add metadata to \`APP_METADATA\` in the same file
5. Push to main branch - QR codes will be auto-generated!

### R1 Creation Requirements

Each app directory must contain:
- \`index.html\` - Main HTML file
- \`css/styles.css\` - Stylesheet (optional but recommended)
- \`js/app.js\` - JavaScript logic (optional)

**Important:** R1 Creations must be designed for a **240x282px** viewport.

### Technical Details

- **Hosting:** GitHub Pages (static hosting)
- **Deployment:** Automated via GitHub Actions
- **QR Code Generation:** Node.js script using \`qrcode\` package
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

*Last updated: ${timestamp}*
`;
}

async function main() {
  try {
    const apps = await generateAllQRCodes();
    
    if (apps.length === 0) {
      console.log('\n⚠ No apps found to generate QR codes for.');
      return;
    }
    
    console.log(`\n✓ Generated ${apps.length} QR code(s)\n`);
    
    const readmeContent = generateREADME(apps);
    fs.writeFileSync(README_PATH, readmeContent, 'utf8');
    console.log('✓ Updated README.md with QR codes\n');
    
    console.log('Summary:');
    apps.forEach(app => {
      console.log(`  - ${app.icon} ${app.name}: ${app.url}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

