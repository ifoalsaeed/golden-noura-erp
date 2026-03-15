from fastapi import APIRouter
from api.endpoints import (
    auth_router, users_router, workers_router, clients_router, contracts_router,
    payroll_router, expenses_router,
    invoices_router, approvals_router
    # rbac_router
)
from api.endpoints import advanced_reports_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(workers_router, prefix="/workers", tags=["workers"])
api_router.include_router(clients_router, prefix="/clients", tags=["clients"])
api_router.include_router(contracts_router, prefix="/contracts", tags=["contracts"])
api_router.include_router(payroll_router, prefix="/payroll", tags=["payroll"])
api_router.include_router(expenses_router, prefix="/expenses", tags=["expenses"])
# reports disabled temporarily (pandas dependency)
# api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
# accounting disabled temporarily (pandas dependency)
# api_router.include_router(accounting_router, prefix="/accounting", tags=["accounting"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["invoices"])
api_router.include_router(approvals_router, prefix="/approvals", tags=["approvals"])
# api_router.include_router(rbac_router, prefix="/rbac", tags=["rbac"])
api_router.include_router(advanced_reports_router, prefix="/advanced-reports", tags=["advanced-reports"])
