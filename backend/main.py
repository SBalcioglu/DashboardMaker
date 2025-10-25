from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_file(file_content: bytes, filename: str) -> Dict[str, Any]:
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file_content))
        elif filename.endswith('.xml'):
            df = pd.read_xml(io.BytesIO(file_content))
        elif filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format")

        df = df.fillna('')

        return {
            "columns": df.columns.tolist(),
            "data": df.to_dict('records'),
            "shape": {"rows": len(df), "columns": len(df.columns)}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    result = process_file(content, file.filename)
    return result

@app.get("/api/mock-data")
async def get_mock_data():
    data = {
        "columns": ["Month", "Sales", "Revenue", "Customers", "Region", "Product"],
        "data": [
            {"Month": "Jan", "Sales": 245, "Revenue": 12500, "Customers": 89, "Region": "North", "Product": "A"},
            {"Month": "Feb", "Sales": 312, "Revenue": 15800, "Customers": 124, "Region": "South", "Product": "B"},
            {"Month": "Mar", "Sales": 289, "Revenue": 14200, "Customers": 102, "Region": "East", "Product": "A"},
            {"Month": "Apr", "Sales": 401, "Revenue": 19300, "Customers": 156, "Region": "West", "Product": "C"},
            {"Month": "May", "Sales": 378, "Revenue": 18100, "Customers": 145, "Region": "North", "Product": "B"},
            {"Month": "Jun", "Sales": 456, "Revenue": 22400, "Customers": 178, "Region": "South", "Product": "A"},
            {"Month": "Jul", "Sales": 423, "Revenue": 20900, "Customers": 167, "Region": "East", "Product": "C"},
            {"Month": "Aug", "Sales": 398, "Revenue": 19600, "Customers": 152, "Region": "West", "Product": "B"},
            {"Month": "Sep", "Sales": 441, "Revenue": 21700, "Customers": 172, "Region": "North", "Product": "A"},
            {"Month": "Oct", "Sales": 467, "Revenue": 23200, "Customers": 189, "Region": "South", "Product": "C"},
            {"Month": "Nov", "Sales": 512, "Revenue": 25800, "Customers": 201, "Region": "East", "Product": "B"},
            {"Month": "Dec", "Sales": 589, "Revenue": 29100, "Customers": 234, "Region": "West", "Product": "A"}
        ],
        "shape": {"rows": 12, "columns": 6}
    }
    return data

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
