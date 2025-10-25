# Dashboard Application
Data visualization dashboard maker
<img width="1909" height="917" alt="image" src="https://github.com/user-attachments/assets/31628085-ee0f-4920-8666-507a9888f5a8" />
## Features

- Import CSV, Excel, XML, and JSON files
- Load mock data for testing
- Multiple visualization types (Line, Bar, Area, Pie, Scatter)
- Interactive filtering with dropdown checkboxes
- Dark/Light mode toggle
- Add unlimited visualizations

## Quick Start

```bash
cd dashboard
./start.sh
```

The application will be available at http://localhost:3000

## Requirements

- Python 3.8+
- Node.js 16+
- npm

## Manual Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Import a data file or load mock data
2. View dataset statistics
3. Add visualizations using the "Add Visualization" button
4. Customize each chart by selecting axes and chart type
5. Apply filters using the filter button
