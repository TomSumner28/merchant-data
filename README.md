# merchant-data

This repository contains a simple Flask dashboard for viewing merchant data. The application automatically downloads the merchant workbook from Google Sheets on start. The workbook should contain two sheets named **"merchant list"** and **"offs list"**. Statistics are calculated from the merchant list sheet.

## Requirements

The project relies only on the Python standard library and `flask`. If `flask` is not available in your environment, install it locally.

Set `GOOGLE_SHEETS_ID` to the ID of your workbook and `GOOGLE_API_KEY` if the sheet is private. When both are provided the app downloads the file using the Google Drive API.

Set `FLASK_SECRET_KEY` in your environment for session security. A default value is used if not provided.

## Running the app

```
python3 app/main.py
```
The script automatically adjusts the Python path so it can be executed from the
repository root without additional configuration.


Then open `http://localhost:5000` in your browser. The application downloads the workbook from Google Sheets and displays the dashboard automatically. Ensure the environment variables mentioned above are set so the sheet can be retrieved.

### Connecting your Google Sheet

1. Open your workbook in the browser and copy the long ID from the URL.
2. Export this value in your shell before running the app:

   ```bash
   export GOOGLE_SHEETS_ID="<YOUR_SHEET_ID>"
   export GOOGLE_API_KEY="<YOUR_API_KEY>"   # optional if the sheet is public
   export FLASK_SECRET_KEY="$(openssl rand -hex 16)"
   python3 app/main.py
   ```

The app will download the sheet on start. If you deploy to a service like Vercel, set these variables in the environment configuration so the same sheet is used.

## Dashboard features

The dashboard presents several visual reports:

- Number of merchants in each deal stage
- Merchants per region
- Live merchants per sales rep
- Average cashback across live merchants

Charts are rendered using Chart.js and an AI question bar lets you ask quick
queries such as "How many retailers does Lucy have live in the USA?".

If you only want to preview the design without running the Flask server, open
`index.html` in your browser. It links to a sample dashboard page with
placeholder data so you can verify the site deploys correctly before enabling
the back-end logic. These HTML files can also be deployed as a static site.
Deploying `index.html` and `dashboard.html` to a service such as Vercel will
give you a read-only preview of the interface without any back‑end.

For a simple design preview the repository includes a `vercel.json` file that
serves the static HTML only. If you want the full Flask back‑end in Vercel,
replace that configuration with one that builds `app/main.py` using the Vercel
Python runtime and sets the environment variables above so the Google Sheet is
loaded.

## Limitations

A minimal Excel reader is included (`simple_xlsx.py`). It supports basic cell types but may not handle all Excel features. For large workbooks, performance may be limited.
