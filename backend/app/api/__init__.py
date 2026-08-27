from fastapi import APIRouter
from app.api.speedtest import router as speedtest_router
from app.api.servers import router as servers_router
from app.api.network import router as network_router
from app.api.diagnostics import router as diagnostics_router
from app.api.tests_history import router as tests_router
from app.api.admin import router as admin_router

api_router = APIRouter(prefix="/api")

api_router.include_router(speedtest_router)
api_router.include_router(servers_router)
api_router.include_router(network_router)
api_router.include_router(diagnostics_router)
api_router.include_router(tests_router)
api_router.include_router(admin_router)
