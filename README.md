# merchant-data

This repository contains a simple Flask dashboard for viewing merchant data from an uploaded Excel workbook. The workbook should contain two sheets named **"merchant list"** and **"offs list"**. Statistics are calculated from the merchant list sheet.

## Requirements

The project relies only on the Python standard library and `flask`. If `flask` is not available in your environment, install it locally.
Set a `FLASK_SECRET_KEY` environment variable to secure session data.

## Running the app

```
python3 app/main.py
```

Then open `http://localhost:5000` in your browser to upload a workbook and view the dashboard.

## Limitations

A minimal Excel reader is included (`simple_xlsx.py`). It supports basic cell types but may not handle all Excel features. For large workbooks, performance may be limited.
