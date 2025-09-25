# Deployment Guide - Media Flight Planning App

## 🚀 **RECOMMENDED: Vercel Deployment**

Vercel is the **best choice** for this application because:
- ✅ **Zero configuration** Node.js support
- ✅ **Serverless functions** for Excel export
- ✅ **Automatic HTTPS** and CDN
- ✅ **Free tier** available
- ✅ **Easy deployment** with Git integration

### **Step-by-Step Vercel Deployment:**

#### **1. Install Vercel CLI**
```bash
npm install -g vercel
```

#### **2. Login to Vercel**
```bash
vercel login
```

#### **3. Deploy from your project directory**
```bash
cd /path/to/flighting-docs
vercel
```

#### **4. Follow the prompts:**
- **Set up and deploy**: Yes
- **Which scope**: Choose your account
- **Link to existing project**: No (first time)
- **What's your project's name**: flighting-docs (or your preferred name)
- **In which directory is your code located**: ./
- **Want to override settings**: No

#### **5. Production deployment**
```bash
vercel --prod
```

### **Vercel Configuration Already Set Up:**
- ✅ `vercel.json` - Deployment configuration
- ✅ `api/excel-export.js` - Serverless function for Excel exports
- ✅ `config.js` - Updated for production URLs

---

## 🔄 **Alternative: SiteGround (Advanced Plans Only)**

### **Requirements for SiteGround:**
- **SiteGround Cloud** or **GoGeek/GrowBig with Node.js** support
- SSH access
- Ability to install Node.js packages

### **SiteGround Deployment Steps:**
1. **Upload files via cPanel File Manager or FTP**
2. **SSH into your account**
3. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
4. **Start the server:**
   ```bash
   node excel-export-server.js
   ```
5. **Set up process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start excel-export-server.js
   pm2 save
   pm2 startup
   ```

**Note**: Most SiteGround shared hosting plans **do NOT support Node.js**. You'll need their Cloud hosting or advanced plans.

---

## 🚀 **Other Excellent Options:**

### **Netlify + Netlify Functions**
- Similar to Vercel
- Great for static sites with serverless functions
- Would require similar setup to Vercel approach

### **Railway**
- Great for full Node.js applications
- Easy GitHub deployment
- Good free tier

### **Heroku**
- Traditional platform-as-a-service
- Easy deployment with Git
- Free tier available (with limitations)

---

## ⚙️ **Configuration for Different Environments:**

The app automatically detects the environment:
- **Localhost**: Uses local development server (port 3002)
- **Production**: Uses serverless functions (/api/excel-export)

### **To force a specific environment:**
Add `?env=production` or `?env=development` to the URL.

---

## 📝 **Pre-Deployment Checklist:**

### **Files Required:**
- ✅ `index.html` - Main application
- ✅ `config.js` - Environment configuration
- ✅ `excel-export-client.js` - Client-side export functions
- ✅ `api/excel-export.js` - Serverless export function
- ✅ `templates/` - All Excel template files
- ✅ `package.json` - Dependencies
- ✅ `vercel.json` - Vercel configuration

### **Dependencies:**
- ✅ `xlsx` - Excel file handling
- ✅ `xlsx-populate` - Enhanced Excel manipulation
- ✅ `express` - Web server (for local dev)
- ✅ `cors` - Cross-origin requests

---

## 🎯 **Final Recommendation:**

**Use Vercel** - it's specifically designed for this type of application and will handle all the technical complexities automatically. The serverless function approach is perfect for Excel export functionality.

### **Vercel Advantages for This App:**
1. **No server management** required
2. **Automatic scaling** for export operations
3. **Built-in CDN** for fast global delivery
4. **HTTPS by default**
5. **Zero configuration** deployment
6. **Git integration** for automatic updates

Simply run `vercel` in your project directory and you'll have a production-ready deployment in minutes!