with open("frontend/src/components/documents/JobWorkspace.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "filteredJds.map" in line:
        start = max(0, i - 2)
        end = min(len(lines), i + 85)
        for j in range(start, end):
            print(f"{j+1}: {repr(lines[j])}")
        break
