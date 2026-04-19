import pickle
import sys
sys.path.append('..')
import VotingClassifier

try:
    with open('scientific_antibiotic_model.pkl', 'rb') as f:
        print("Loading part 1...")
        part1 = pickle.load(f)
        print("Type of part 1:", type(part1))
        
        print("Loading part 2...")
        part2 = pickle.load(f)
        print("Type of part 2:", type(part2))
        
        print("Loading part 3...")
        part3 = pickle.load(f)
        print("Type of part 3:", type(part3))
except Exception as e:
    print(f"Error: {e}")
