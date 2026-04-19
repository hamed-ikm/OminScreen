import joblib
import sys
sys.path.append('..')
import VotingClassifier

model_dict = joblib.load('../scientific_antibiotic_model.pkl')
model = model_dict['model']
print("Model type:", type(model))
print("VotingClassifier estimators:", model.estimators_)
