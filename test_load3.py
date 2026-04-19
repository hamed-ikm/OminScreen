import pickle
import sys
sys.path.append('..')
import sklearn.base
import VotingClassifier

def custom_setstate(self, state):
    if isinstance(state, tuple):
        self.__dict__.update(state[0])
    elif isinstance(state, dict):
        self.__dict__.update(state)
    else:
        pass

sklearn.base.BaseEstimator.__setstate__ = custom_setstate
import sklearn.tree
sklearn.tree.BaseDecisionTree.__setstate__ = custom_setstate

with open('../scientific_antibiotic_model.pkl', 'rb') as f:
    try:
        features_list = pickle.load(f)
        print("Loaded part 1:", type(features_list), "Length:", len(features_list) if isinstance(features_list, list) else 'N/A')
        print(features_list[:20] if isinstance(features_list, list) else features_list)

        part2 = pickle.load(f)
        print("Loaded part 2:", type(part2))

        part3 = pickle.load(f)
        print("Loaded part 3:", type(part3))
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()
