# Deployment Guide

## Step 1: Add Your Credentials

Open `app.js` and replace these lines at the top:

```javascript
let config = {
    apiKey: 'YOUR_API_KEY_HERE',
    sheetId: 'YOUR_SPREADSHEET_ID_HERE'
};
```

With your actual values:

```javascript
let config = {
    apiKey: 'AIzaSyAbc123...',
    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUaCLeAqhmIrDaBc'
};
```

## Step 2: Deploy to GitHub Pages (Easiest for Phone Access)

### Option A: Using GitHub Desktop or Git

1. Create a new repository on GitHub (make it private if you want)
2. Upload these files: `index.html`, `app.js`, `styles.css`
3. Go to repository Settings → Pages
4. Under "Source", select "main" branch
5. Click Save
6. Your site will be live at: `https://yourusername.github.io/repository-name`

### Option B: Using GitHub Web Interface

1. Go to github.com and create a new repository
2. Click "uploading an existing file"
3. Drag and drop: `index.html`, `app.js`, `styles.css`
4. Commit the files
5. Go to Settings → Pages and enable GitHub Pages
6. Access from your phone at the provided URL

## Step 3: Access on Your Phone

1. Open the GitHub Pages URL in your phone's browser
2. Add to home screen for app-like experience:
   - **iPhone**: Tap Share → Add to Home Screen
   - **Android**: Tap Menu (⋮) → Add to Home screen

## Alternative: Quick Local Testing

If you just want to test locally first:

1. Put all files in a folder
2. Open `index.html` in your browser
3. Make sure your credentials are correct

## Security Note

Since your API key will be visible in the code, make sure to:
- Restrict your API key in Google Cloud Console to only allow Sheets API
- Consider making the repository private
- The Google Sheet should already be set to "view only" for anyone with the link
