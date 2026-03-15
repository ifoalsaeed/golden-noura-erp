from starlette.applications import Starlette
from starlette.responses import Response, PlainTextResponse
from starlette.routing import Route
import datetime

def _make_simple_pdf(title: str, subtitle: str, sections: list) -> bytes:
    lines = []
    lines.append("%PDF-1.4\n")
    xref = []
    def add_object(obj_str: str):
        offset = sum(len(s.encode('latin-1')) for s in lines)
        xref.append(offset)
        lines.append(obj_str)
    add_object("1 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    content = []
    content.append("BT\n/F1 16 Tf 50 780 Td (%s) Tj\n" % title.replace("(", "\\(").replace(")", "\\)"))
    content.append("0 -24 Td /F1 12 Tf (%s) Tj\n" % subtitle.replace("(", "\\(").replace(")", "\\)"))
    content.append("0 -18 Td /F1 11 Tf (-----------------------------------------------) Tj\n")
    for sec_title, items in sections:
        content.append("0 -22 Td /F1 12 Tf (%s) Tj\n" % sec_title.replace("(", "\\(").replace(")", "\\)"))
        for name, amount in items:
            safe = name.replace("(", "\\(").replace(")", "\\)")
            content.append("0 -16 Td /F1 10 Tf (%s) Tj\n" % f"{safe}: {amount:,.2f}")
        content.append("0 -10 Td /F1 10 Tf ( ) Tj\n")
    content.append("ET\n")
    content_bytes = "".join(content).encode("latin-1", errors="ignore")
    add_object(f"3 0 obj\n<< /Length {len(content_bytes)} >>\nstream\n".encode("latin-1").decode("latin-1"))
    lines.append(content_bytes.decode("latin-1"))
    lines.append("endstream\nendobj\n")
    add_object("4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 1 0 R >> >> /Contents 3 0 R >>\nendobj\n")
    add_object("2 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n")
    add_object("5 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    xref_start = sum(len(s.encode('latin-1')) for s in lines)
    lines.append("xref\n0 %d\n" % (len(xref)+1))
    lines.append("0000000000 65535 f \n")
    for off in xref:
        lines.append(f"{off:010} 00000 n \n")
    lines.append("trailer\n<< /Size %d /Root 5 0 R >>\n" % (len(xref)+1))
    lines.append("startxref\n%d\n%%%%EOF" % xref_start)
    return "".join(lines).encode("latin-1", errors="ignore")

async def bs_pdf(request):
    year = int(request.query_params.get("year", datetime.datetime.utcnow().year))
    title = f"Balance Sheet {year}"
    subtitle = f"Generated {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    sections = [
        ("Assets", [("Cash on Hand", 10000), ("Bank", 40000), ("Accounts Receivable", 15000), ("Prepaid Expenses", 5000), ("Total Assets", 70000)]),
        ("Liabilities", [("Accounts Payable", 12000), ("Salaries Payable", 8000), ("VAT Payable", 5000), ("Total Liabilities", 25000)]),
        ("Equity", [("Capital", 30000), ("Retained Earnings", 15000), ("Total Equity", 45000), ("Liabilities + Equity", 70000)])
    ]
    pdf = _make_simple_pdf(title, subtitle, sections)
    return Response(pdf, media_type="application/pdf")

async def root(request):
    return PlainTextResponse("Minimal PDF server is running")

routes = [
    Route("/", endpoint=root),
    Route("/api/v1/accounting/balance-sheet/pdf", endpoint=bs_pdf),
]

app = Starlette(routes=routes)

