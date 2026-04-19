import joblib

try:
    obj = joblib.load('../scientific_antibiotic_model.pkl')
    print("Type of obj:", type(obj))
    if isinstance(obj, dict):
        print("Keys:", obj.keys())
        for k in obj.keys():
            print(f"Key {k} type:", type(obj[k]))
except Exception as e:
    print("Error:", e)
