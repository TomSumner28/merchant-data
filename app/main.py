from flask import Flask, request, redirect, url_for, render_template, flash
from simple_xlsx import read_workbook

app = Flask(__name__)
app.secret_key = 'secret'

# Store uploaded data in memory
dashboard_data = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    global dashboard_data
    file = request.files.get('file')
    if not file or file.filename == '':
        flash('No file selected')
        return redirect(url_for('index'))
    path = '/tmp/upload.xlsx'
    file.save(path)
    try:
        dashboard_data = read_workbook(path)
    except Exception as e:
        flash(f'Failed to parse file: {e}')
        dashboard_data = {}
    return redirect(url_for('dashboard'))


def _compute_stats(rows):
    stats = {
        'total': len(rows),
        'deal_stage_counts': {},
        'region_counts': {},
        'lost_count': 0,
    }
    for row in rows:
        stage = row.get('deal_stage', 'Unknown')
        region = row.get('region', 'Unknown')
        stats['deal_stage_counts'][stage] = stats['deal_stage_counts'].get(stage, 0) + 1
        stats['region_counts'][region] = stats['region_counts'].get(region, 0) + 1
        if stage.lower() in {'lost', 'churn', 'churned'}:
            stats['lost_count'] += 1
    stats['lost_rate'] = (stats['lost_count'] / stats['total']) * 100 if stats['total'] else 0
    return stats


@app.route('/dashboard')
def dashboard():
    merchant_data = dashboard_data.get('merchant list', [])
    offs_data = dashboard_data.get('offs list', [])
    stats = _compute_stats(merchant_data)
    return render_template(
        'dashboard.html',
        merchant_data=merchant_data,
        offs_data=offs_data,
        stats=stats,
    )


@app.route('/ask', methods=['POST'])
def ask():
    merchant_data = dashboard_data.get('merchant list', [])
    question = request.form.get('question', '')
    answer = _answer_question(merchant_data, question)
    return {'answer': answer}


def _answer_question(rows, question: str) -> str:
    if not rows:
        return 'No data loaded.'
    q = question.lower()
    if 'live' in q:
        region = _extract_region(rows, q)
        count = sum(1 for r in rows if r.get('deal_stage', '').lower() == 'live' and (not region or r.get('region', '').lower() == region.lower()))
        return f'{count} retailers are live{f" in {region}" if region else ""}.'
    if 'lost' in q and '2024' in q:
        count = sum(1 for r in rows if r.get('deal_stage', '').lower() == 'lost' and '2024' in str(r.get('lost_date', '')))
        return f'{count} retailers lost in 2024.'
    return 'Question not recognized.'


def _extract_region(rows, text: str):
    regions = {r.get('region', '') for r in rows if r.get('region')}
    for region in regions:
        if region.lower() in text:
            return region
    return None


if __name__ == '__main__':
    app.run(debug=True)
