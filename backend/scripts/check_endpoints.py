import httpx

try:
    r = httpx.get("http://127.0.0.1:5173/jds")
    print("Frontend status:", r.status_code)
except Exception as e:
    print("Frontend error:", e)

try:
    r = httpx.get("http://127.0.0.1:8001/api/v1/jds?page=1&page_size=50")
    print("Backend JDs status:", r.status_code)
    data = r.json()
    print("Total JDs:", data.get("total"))
    for item in data.get("items", []):
        print(f"  [{item['id']}] {item['req_code']} - {item['title']}")
except Exception as e:
    print("Backend JDs error:", e)
