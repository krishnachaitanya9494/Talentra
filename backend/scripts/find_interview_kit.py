import os
for root, dirs, files in os.walk("backend/app/routers"):
    for f in files:
        if f.endswith(".py"):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8") as fl:
                for idx, line in enumerate(fl, 1):
                    if "interview-kit" in line:
                        print(f"{p}:{idx}: {line.strip()}")
