# merchant-data

This repository contains a simple Flask dashboard for viewing merchant data. The application automatically downloads the merchant workbook from Google Sheets on start. The workbook should contain two sheets typically named **"Merchant List"** and **"Offs List"** (matching is case-insensitive). Statistics are calculated from the merchant list sheet.

## Requirements

The project relies only on the Python standard library and `flask`. Install the
dependency with:

```bash
pip install -r requirements.txt
```

Set `GOOGLE_SHEETS_ID` to the ID of your workbook and `GOOGLE_API_KEY` if the sheet is private. Alternatively you can provide the full link via `GOOGLE_SHEET_URL`. When a link ending in `/edit` is supplied the app automatically converts it into the correct export URL. If none of these variables are set the dashboard uses the public TRC Master List for demonstration purposes.

To enable AI answers for general questions, set `OPENAI_API_KEY` with an OpenAI API token. Without this the Ask bar only responds to built-in data queries.

Set `FLASK_SECRET_KEY` in your environment for session security. A default value is used if not provided.

## Running the app

```
python3 app/main.py
```
The script automatically adjusts the Python path so it can be executed from the
repository root without additional configuration.


Open `http://localhost:5000` in your browser. The app will automatically download the configured Google Sheet and redirect you to the dashboard. If fetching fails you can visit `/load` to retry. The server prints the resolved sheet ID and whether an API key is detected when it starts. Check these logs if live data does not appear.

### Connecting your Google Sheet

1. Open your workbook in the browser and copy the long ID from the URL (or save the full share link).
2. Export the ID or link in your shell before running the app:

   ```bash
   # Either provide the ID and optional API key
   export GOOGLE_SHEETS_ID="<YOUR_SHEET_ID>"
   export GOOGLE_API_KEY="<YOUR_API_KEY>"   # optional if the sheet is public
   # or pass the full share link
   # export GOOGLE_SHEET_URL="https://docs.google.com/..."
   export FLASK_SECRET_KEY="$(openssl rand -hex 16)"
   export OPENAI_API_KEY="<YOUR_OPENAI_KEY>"  # optional for GPT answers
   python3 app/main.py
   ```

The app will download the sheet on start. If you deploy to a service like Vercel, set these variables in the environment configuration so the same sheet is used.

## Dashboard features

The dashboard presents several visual reports and uses a dark theme:

- Number of merchants in each deal stage
- Merchants per region
- Live merchants per sales rep
- Live and lost counts by region
- Total merchants per sales rep
- Average cashback per region
- Average cashback across live merchants

Charts are rendered using Chart.js and an AI question bar lets you ask quick
queries such as "How many retailers does Lucy have live in the USA?".

If you only want to preview the design without running the Flask server, open
`index.html` in your browser. It links to a sample dashboard page with
placeholder data so you can verify the site deploys correctly before enabling
the back-end logic. These HTML files can also be deployed as a static site.
Deploying `index.html` and `dashboard.html` to a service such as Vercel will
give you a read-only preview of the interface without any back‑end.

For a live deployment, the repository provides a `vercel.json` file that tells
Vercel to run the Flask app with its Python runtime. When deployed this way the
app automatically downloads the configured Google Sheet and serves the
dashboard dynamically. If you only need the static demo remove or replace this
file.

The built-in Excel reader normalizes column headers by converting them to
lowercase and replacing spaces with underscores. Ensure your sheet includes
columns like `deal_stage`, `region`, `sales_rep`, and `cashback` so the stats can
be computed correctly.

## Limitations

A minimal Excel reader is included (`simple_xlsx.py`). It supports basic cell types but may not handle all Excel features. For large workbooks, performance may be limited.
