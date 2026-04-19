import pickle

class DummyClass:
    def __init__(self, *args, **kwargs):
        pass
    def __setstate__(self, state):
        with open('state.txt', 'w') as f:
            f.write(str(type(state)) + '\n')
            f.write(repr(state)[:1000] + '\n')

class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'VotingClassifier':
            return DummyClass
        return super().find_class(module, name)

try:
    with open('scientific_antibiotic_model.pkl', 'rb') as f:
        pickle.load(f) # features
        CustomUnpickler(f).load() # model
except Exception as e:
    print(e)
