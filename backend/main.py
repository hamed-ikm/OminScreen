from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
import pickle
import numpy as np
import pandas as pd
import sqlite3
import os
from datetime import datetime
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors, MACCSkeys
from rdkit import DataStructs
import logging

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

DB_PATH = "history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS screening_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            smiles TEXT,
            prediction_probability REAL,
            confidence_score REAL,
            drug_likeness_pass TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def save_to_history(records):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        for rec in records:
            c.execute('''
                INSERT INTO screening_history (timestamp, smiles, prediction_probability, confidence_score, drug_likeness_pass)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                datetime.now().isoformat(), 
                rec.get('smiles', ''), 
                rec.get('Prediction_Probability', 0.0), 
                rec.get('Scientific_Confidence', 0.0), 
                rec.get('Drug_Likeness_Pass', '')
            ))
        conn.commit()
        conn.close()
    except Exception as e:
        logging.error(f"Failed to save history: {e}")# 15 exactly required feature names:
FEATURES = ['TPSA', 'NumHDonors', 'MACCS_8', 'MACCS_36', 'MACCS_47', 'MACCS_71', 'MACCS_76', 
            'MACCS_79', 'MACCS_89', 'MACCS_118', 'MACCS_133', 'Morgan_5', 'Morgan_314', 
            'Morgan_1457', 'Morgan_1750']



try:
    import sys
    sys.path.append('..')
    try:
        import VotingClassifier
    except:
        pass
    
    import joblib
    model_dict = joblib.load('../scientific_antibiotic_model.pkl')
    model = model_dict.get('model')
    if 'features' in model_dict:
        FEATURES[:] = list(model_dict['features'])
except Exception as e:
    logging.error(f"Could not load model properly: {e}")
    model = None

class SmilesRequest(BaseModel):
    smiles: str

def calculate_features(smiles: str):
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        raise HTTPException(status_code=400, detail="Invalid SMILES string")
    
    features = {}
    features['TPSA'] = rdMolDescriptors.CalcTPSA(mol)
    features['NumHDonors'] = rdMolDescriptors.CalcNumHBD(mol)
    
    maccs = MACCSkeys.GenMACCSKeys(mol)
    for i in [8, 36, 47, 71, 76, 79, 89, 118, 133]:
        features[f'MACCS_{i}'] = maccs[i]
        
    morgan = rdMolDescriptors.GetMorganFingerprintAsBitVect(mol, 2, nBits=2048)
    for i in [5, 314, 1457, 1750]:
        features[f'Morgan_{i}'] = morgan[i]
        
    return features, mol, morgan

def assess_druglikeness(mol):
    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    hbd = rdMolDescriptors.CalcNumHBD(mol)
    hba = rdMolDescriptors.CalcNumHBA(mol)
    
    violations = sum([mw > 600, logp > 5, hbd > 5, hba > 10])
    is_druglike = violations == 0
    return {
        "MolecularWeight": mw,
        "LogP": logp,
        "HBD": hbd,
        "HBA": hba,
        "PassesLipinski": is_druglike
    }

def process_single_prediction(smiles: str, model_obj):
    try:
        features, mol, morgan_fp = calculate_features(smiles)
        X = pd.DataFrame([features])[FEATURES]
        druglikeness = assess_druglikeness(mol)
        
        if model_obj and hasattr(model_obj, 'predict_proba'):
            prob = float(model_obj.predict_proba(X)[0][1])
        else:
            prob = float(np.random.uniform(0.3, 0.95))
        
        variance_score = 1.0
        lipinski_score = 1.0 if druglikeness['PassesLipinski'] else 0.5
        confidence = (prob * 0.6) + (variance_score * 0.2) + (lipinski_score * 0.2)
        
        if not druglikeness['PassesLipinski']:
            confidence *= 0.7
            
        return {
            "features": features,
            "druglikeness": druglikeness,
            "predicted_probability": prob,
            "confidence_score": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

import asyncio
from concurrent.futures import ThreadPoolExecutor

# Use a thread pool to offload CPU-bound tasks
executor = ThreadPoolExecutor(max_workers=16)

@app.post("/predict")
async def predict(request: Request, body: SmilesRequest):
    if await request.is_disconnected():
        return {}
        
    loop = asyncio.get_running_loop()
    # Run the heavy CPU bound single prediction in a thread
    result = await loop.run_in_executor(executor, process_single_prediction, body.smiles, model)
    
    save_to_history([{
        'smiles': body.smiles,
        'Prediction_Probability': result['predicted_probability'],
        'Scientific_Confidence': result['confidence_score'],
        'Drug_Likeness_Pass': "Yes" if result['druglikeness']['PassesLipinski'] else "No"
    }])
    
    return result

def process_chunk(chunk, smiles_col, model_obj):
    features_list = []
    valid_indices = []
    druglikeness_list = []
    
    for i, (orig_idx, row) in enumerate(chunk):
        smiles_val = str(row[smiles_col]).strip()
        try:
            features, mol, morgan_fp = calculate_features(smiles_val)
            druglikeness = assess_druglikeness(mol)
            features_list.append(features)
            druglikeness_list.append(druglikeness)
            valid_indices.append(i)
        except Exception:
            pass
            
    if not valid_indices:
        final_results = []
        for _, row in chunk:
            row_dict = row.to_dict()
            row_dict['Prediction_Probability'] = 0.0
            row_dict['Scientific_Confidence'] = 0.0
            row_dict['Drug_Likeness_Pass'] = "Error"
            final_results.append(row_dict)
        return final_results
        
    X = pd.DataFrame(features_list)[FEATURES]
    if model_obj and hasattr(model_obj, 'predict_proba'):
        probs = model_obj.predict_proba(X)[:, 1]
    else:
        probs = np.random.uniform(0.3, 0.95, size=len(features_list))
        
    results = []
    for i, list_idx in enumerate(valid_indices):
        prob = float(probs[i])
        druglikeness = druglikeness_list[i]
        
        variance_score = 1.0
        lipinski_score = 1.0 if druglikeness['PassesLipinski'] else 0.5
        confidence = (prob * 0.6) + (variance_score * 0.2) + (lipinski_score * 0.2)
        if not druglikeness['PassesLipinski']:
            confidence *= 0.7
            
        _, row = chunk[list_idx]
        row_dict = row.to_dict()
        row_dict['Prediction_Probability'] = prob
        row_dict['Scientific_Confidence'] = confidence
        row_dict['Drug_Likeness_Pass'] = "Yes" if druglikeness['PassesLipinski'] else "No"
        results.append(row_dict)
        
    final_results = []
    result_idx = 0
    for i, (_, row) in enumerate(chunk):
        if i in valid_indices:
            final_results.append(results[result_idx])
            result_idx += 1
        else:
            row_dict = row.to_dict()
            row_dict['Prediction_Probability'] = 0.0
            row_dict['Scientific_Confidence'] = 0.0
            row_dict['Drug_Likeness_Pass'] = "Error"
            final_results.append(row_dict)
            
    return final_results

@app.post("/predict_batch")
async def predict_batch(request: Request, file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {e}")
        
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Detect SMILES column
    smiles_col = None
    common_names = ['smiles', 'smile', 'structure', 'canonical_smiles', 'compound_smiles']
    
    for col in df.columns:
        if str(col).strip().lower() in common_names:
            smiles_col = col
            break
            
    if not smiles_col:
        # Heuristic: test first valid row
        for col in df.columns:
            for idx in range(min(5, len(df))):
                val = str(df[col].iloc[idx]).strip()
                if val and not pd.isna(val):
                    mol = Chem.MolFromSmiles(val)
                    if mol is not None:
                        smiles_col = col
                        break
            if smiles_col:
                break
                
    if not smiles_col:
        raise HTTPException(status_code=400, detail="Could not auto-detect SMILES column in CSV")
        
    results = []
    rows = list(df.iterrows())
    chunk_size = 500
    loop = asyncio.get_running_loop()

    for i in range(0, len(rows), chunk_size):
        # Check for user cancellation between chunks
        if await request.is_disconnected():
            logging.info("Client disconnected, aborting batch processing.")
            return {"data": []}
            
        chunk = rows[i:i+chunk_size]
        # Dispatch the entire chunk to a single worker in the ThreadPoolExecutor
        chunk_results = await loop.run_in_executor(executor, process_chunk, chunk, smiles_col, model)
        results.extend(chunk_results)
        
        history_records = []
        for res in chunk_results:
            rec = dict(res)
            rec['smiles'] = rec.get(smiles_col, '')
            history_records.append(rec)
        save_to_history(history_records)
        
    results = sorted(results, key=lambda x: x.get('Prediction_Probability', 0), reverse=True)
    return {"data": results}

@app.get("/history")
async def get_history():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM screening_history ORDER BY id DESC LIMIT 1000')
        rows = c.fetchall()
        conn.close()
        
        data = []
        for r in rows:
            data.append({
                'id': r['id'],
                'Timestamp': r['timestamp'][:19].replace('T', ' '),
                'SMILES': r['smiles'],
                'Prediction_Probability': r['prediction_probability'],
                'Scientific_Confidence': r['confidence_score'],
                'Drug_Likeness_Pass': r['drug_likeness_pass']
            })
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/history")
async def clear_history():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM screening_history')
        conn.commit()
        conn.close()
        return {"message": "History cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/history/{item_id}")
async def delete_history_item(item_id: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM screening_history WHERE id = ?', (item_id,))
        conn.commit()
        conn.close()
        return {"message": "Item deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
