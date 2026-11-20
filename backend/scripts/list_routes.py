from backend.app.routers.documents import router

for route in router.routes:
    print(route.methods, route.path)
