from backend.routes import activities, contacts, dashboard, deals, delete_impact, organizations

ROUTERS = [
    organizations.router,
    contacts.router,
    deals.router,
    activities.router,
    dashboard.router,
    delete_impact.router,
]
