import pickle
import sklearn.ensemble
import traceback

class DummyVotingClassifier(sklearn.ensemble.VotingClassifier):
    def __init__(self, *args, **kwargs):
        pass

class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'VotingClassifier' or name == 'VotingClassifier':
            return DummyVotingClassifier
        return super().find_class(module, name)

with open('test_unpickle.txt', 'w') as out:
    try:
        with open('scientific_antibiotic_model.pkl', 'rb') as f:
            # We know the first object is a numpy array of features
            features = CustomUnpickler(f).load()
            out.write(f'Features length: {len(features)}\n')
            
            # The second object is the actual model
            model = CustomUnpickler(f).load()
            out.write(f'Model type: {type(model)}\n')
            out.write(f'Model has predict_proba: {hasattr(model, "predict_proba")}\n')
            
    except Exception as e:
        out.write(str(e) + '\n')
        out.write(traceback.format_exc())
