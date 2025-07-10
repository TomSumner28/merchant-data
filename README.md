# merchant-data

This repository contains a simple Flask dashboard for viewing merchant data. By default it downloads the merchant workbook directly from a public Google Sheet, but you can also upload an Excel file if desired. The workbook should contain two sheets named **"merchant list"** and **"offs list"**. Statistics are calculated from the merchant list sheet.

## Requirements

The project relies only on the Python standard library and `flask`. If `flask` is not available in your environment, install it locally.

Set `FLASK_SECRET_KEY` in your environment for session security. A default value is used if not provided.

## Running the app

```
python3 app/main.py
```
The script automatically adjusts the Python path so it can be executed from the
repository root without additional configuration.

Then open `http://localhost:5000` in your browser. Click “Load data from Google Sheets” to fetch the workbook and view the dashboard, or upload your own file.
The upload form includes a basic CSRF token for protection.

If you only want to preview the design without running the Flask server, open
`static/index.html` in your browser. It links to a sample dashboard page with
placeholder data so you can verify the site deploys correctly before enabling
the back-end logic.

## Limitations

A minimal Excel reader is included (`simple_xlsx.py`). It supports basic cell types but may not handle all Excel features. For large workbooks, performance may be limited.
