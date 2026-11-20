import os
import importlib

for r in ["comparison", "matching", "repository", "sourcing", "intelligence"]:
    try:
        mod = importlib.import_module(f"backend.app.routers.{r}")
        router = getattr(mod, "router", None)
        if router:
            print(f"=== {r} ===")
            for route in router.routes:
                print(f"  {route.methods} {route.path}")
    except Exception as e:
        print(f"Error in {r}: {e}")
