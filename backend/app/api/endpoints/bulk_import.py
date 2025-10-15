from fastapi import FastAPI, File, UploadFile, HTTPException, status
from pydantic import BaseModel, ValidationError
from typing import List, Optional
import pandas as pd
import json
import io

app = FastAPI()

class Certificate(BaseModel):
    productSku: str
    hsCode: str
    origin: str
    destination: str
    agreement: str
    exWorksValue: float
    materials: List[str]

@app.post("/certificates/bulk-import")
async def bulk_import_certificates(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a CSV")

    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode('utf-8')))

    if len(df) > 1000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum of 1000 rows allowed")

    success_count = 0
    errors = []

    for index, row in df.iterrows():
        try:
            # Convert materials from JSON string to list
            materials = json.loads(row['materials'])
            certificate = Certificate(
                productSku=row['productSku'],
                hsCode=row['hsCode'],
                origin=row['origin'],
                destination=row['destination'],
                agreement=row['agreement'],
                exWorksValue=row['exWorksValue'],
                materials=materials
            )
            success_count += 1
        except (ValidationError, json.JSONDecodeError) as e:
            errors.append({"row": index + 1, "error": str(e)})

    return {
        "success_count": success_count,
        "error_count": len(errors),
        "errors": errors
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)