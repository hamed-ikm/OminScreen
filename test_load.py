import pickle
import sys
sys.path.append('..')
import VotingClassifier
import sklearn

print(f"Sklearn version: {sklearn.__version__}")

try:
    with open('scientific_antibiotic_model.pkl', 'rb') as f:
        print("Loading object 1...")
        obj1 = pickle.load(f)
        print("Object 1 type:", type(obj1))
        
        print("Loading object 2...")
        obj2 = pickle.load(f)
        print("Object 2 type:", type(obj2))
        
        print("Loading object 3...")
        obj3 = pickle.load(f)
        print("Object 3 type:", type(obj3))
except Exception as e:
    import traceback
    traceback.print_exc()
