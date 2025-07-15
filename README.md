# Merchant Dashboard with AI Search

This project provides a small Flask application that lets you upload a workbook and view key metrics in a dashboard. An AI powered search box lets you ask natural-language questions about your data.

## Requirements

Install Flask (and optionally pycurl for HTTPS performance) using the provided requirements file:

```bash
pip install -r requirements.txt
```

Set the following environment variables:

- `OPENAI_API_KEY` – required for the AI question feature
- `FLASK_SECRET_KEY` – secret used for session cookies

Then start the app:

```bash
python3 app/main.py
```

Visit `http://localhost:5000` to upload your workbook (`.xlsx`). After uploading you will be redirected to the dashboard.

### Deployment

The repository includes a `vercel.json` file so the Flask app can be deployed to Vercel. Configure the environment variables mentioned above in your Vercel project and deploy normally. All HTTP requests will be routed to the Flask application via `api/index.py`.
