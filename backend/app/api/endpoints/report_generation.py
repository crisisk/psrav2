from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from typing import Literal
from weasyprint import HTML
from datetime import datetime
import os

app = FastAPI()

class CertificateDetails(BaseModel):
    certificate_id: str
    company_name: str
    logo_url: str
    evaluation_results: dict
    applied_rules: list[str]
    rvc_calculation: dict
    materials: list[dict]
    signature: str

class ReportRequest(BaseModel):
    template: Literal['standard', 'detailed', 'summary']
    certificate: CertificateDetails

def generate_html_template(template: str, data: CertificateDetails) -> str:
    """Generate HTML content based on the selected template"""
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    if template == 'standard':
        return f"""
        <html>
            <head><title>Certificate Report</title></head>
            <body style="font-family: Arial, sans-serif;">
                <header style="display: flex; justify-content: space-between; align-items: center;">
                    <img src="{data.logo_url}" alt="Company Logo" style="height: 50px;">
                    <p>Date: {date_str}</p>
                </header>
                <h1>Certificate Report</h1>
                <h2>Certificate ID: {data.certificate_id}</h2>
                <h3>Evaluation Results:</h3>
                <pre>{data.evaluation_results}</pre>
                <footer style="margin-top: 50px;">
                    <p>Signature: {data.signature}</p>
                </footer>
            </body>
        </html>
        """
    elif template == 'detailed':
        return f"""
        <html>
            <head><title>Detailed Certificate Report</title></head>
            <body style="font-family: Arial, sans-serif;">
                <header style="display: flex; justify-content: space-between; align-items: center;">
                    <img src="{data.logo_url}" alt="Company Logo" style="height: 50px;">
                    <p>Date: {date_str}</p>
                </header>
                <h1>Detailed Certificate Report</h1>
                <h2>Certificate ID: {data.certificate_id}</h2>
                <h3>Evaluation Results:</h3>
                <pre>{data.evaluation_results}</pre>
                <h3>Applied Rules:</h3>
                <ul>
                    {"".join(f"<li>{rule}</li>" for rule in data.applied_rules)}
                </ul>
                <h3>RVC Calculation:</h3>
                <pre>{data.rvc_calculation}</pre>
                <h3>Materials:</h3>
                <table border="1" cellpadding="5" cellspacing="0">
                    <tr>
                        <th>Material</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                    </tr>
                    {"".join(
                        f"<tr><td>{m['name']}</td><td>{m['quantity']}</td><td>{m['unit']}</td></tr>"
                        for m in data.materials
                    )}
                </table>
                <footer style="margin-top: 50px;">
                    <p>Signature: {data.signature}</p>
                </footer>
            </body>
        </html>
        """
    elif template == 'summary':
        return f"""
        <html>
            <head><title>Summary Report</title></head>
            <body style="font-family: Arial, sans-serif;">
                <header style="display: flex; justify-content: space-between; align-items: center;">
                    <img src="{data.logo_url}" alt="Company Logo" style="height: 50px;">
                    <p>Date: {date_str}</p>
                </header>
                <h1>Summary Report</h1>
                <h2>Certificate ID: {data.certificate_id}</h2>
                <h3>Evaluation Results:</h3>
                <pre>{data.evaluation_results}</pre>
                <h3>Materials Count:</h3>
                <p>{len(data.materials)} materials</p>
                <footer style="margin-top: 50px;">
                    <p>Signature: {data.signature}</p>
                </footer>
            </body>
        </html>
        """
    else:
        raise ValueError("Invalid template type")

@app.post("/reports/generate")
async def generate_report(request: ReportRequest):
    try:
        # Generate HTML content
        html_content = generate_html_template(request.template, request.certificate)
        
        # Create PDF using WeasyPrint
        pdf = HTML(string=html_content).write_pdf()
        
        # Return PDF as response
        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{request.certificate.certificate_id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For running locally
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)