import joblib
import sys
sys.path.append('..')
import VotingClassifier

try:
    obj = joblib.load('../scientific_antibiotic_model.pkl')
    print("Loaded with joblib! Type:", type(obj))
except Exception as e:
    print("Joblib Error:", e)
    import traceback
    traceback.print_exc()

import pickle
try:
    with open('../scientific_antibiotic_model.pkl', 'rb') as f:
        print(joblib.load(f))
except Exception as e:
    print("Error 2:", e)
