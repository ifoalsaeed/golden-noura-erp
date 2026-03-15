from .auth import router as auth_router
from .users import router as users_router
from .workers import router as workers_router
from .clients import router as clients_router
from .contracts import router as contracts_router
from .payroll import router as payroll_router
# Optional: enhanced payroll endpoints require heavy dependencies (e.g., pandas)
# from .payroll_enhanced import router as payroll_enhanced_router
from .expenses import router as expenses_router
from .reports import router as reports_router
# from .accounting import router as accounting_router
from .invoices import router as invoices_router
from .approvals import router as approvals_router
from .advanced_reports import router as advanced_reports_router
# from .rbac import router as rbac_router

__all__ = [
    "auth_router",
    "users_router",
    "workers_router", 
    "clients_router",
    "contracts_router",
    "payroll_router",
    # "payroll_enhanced_router",
    "expenses_router",
    "reports_router",
    # "accounting_router",
    "invoices_router",
    "approvals_router",
    "advanced_reports_router",
    # "rbac_router"
]
