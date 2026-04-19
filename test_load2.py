import pickle
import sys
sys.path.append('..')

try:
    import VotingClassifier
except Exception as e:
    print("VotingClassifier import error:", e)

with open('../scientific_antibiotic_model.pkl', 'rb') as f:
    try:
        features = pickle.load(f)
        print("Loaded features:", type(features))
    except Exception as e:
        print("Error loading features:", e)
    
    try:
        model = pickle.load(f)
        print("Loaded model:", type(model))
        print("Has predict_proba?", hasattr(model, 'predict_proba'))
    except Exception as e:
        print("Error loading model:", e)
        import traceback
        traceback.print_exc()

    try:
        obj3 = pickle.load(f)
        print("Loaded object 3:", type(obj3))
    except Exception as e:
        print("Error loading object 3:", e)
