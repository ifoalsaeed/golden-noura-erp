from fastapi import APIRouter
from api.endpoints import auth, workers, clients, contracts, payroll, expenses, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(workers.router, prefix="/workers", tags=["workers"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(payroll.router, prefix="/payroll", tags=["payroll"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
