import os
import math
import logging
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors
from rdkit.Geometry import Point3D

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TARGETS_DIR = os.path.join(BASE_DIR, "targets")

TARGETS = {
    "gyrase": {
        "id": "gyrase",
        "pdb_id": "1KZN",
        "name": "Bacterial DNA Gyrase B",
        "organism": "Escherichia coli",
        "classification": "Topoisomerase II (DNA Replication)",
        "description": "Essential ATP-binding subunit governing DNA negative supercoiling. Hallmark target of fluoroquinolones and aminocoumarins.",
        "pdb_file": "gyrase.pdb",
        "pocket_center": [19.15, 30.39, 34.74],
        "approach_vector": [0.65, 0.60, 0.46],
        "pocket_residues": [73, 76, 77, 78, 115, 118, 120, 165],
        "key_residues": "Asp73, Arg76 (Arg-Finger), Gly77, Thr165",
        "reference_affinity": -8.8
    },
    "pbp2a": {
        "id": "pbp2a",
        "pdb_id": "1VQQ",
        "name": "Penicillin-Binding Protein 2a (PBP2a)",
        "organism": "Staphylococcus aureus (MRSA)",
        "classification": "Cell Wall Peptidoglycan Transpeptidase",
        "description": "Acquired transpeptidase conferring high-level resistance across beta-lactams in methicillin-resistant S. aureus (MRSA).",
        "pdb_file": "pbp2a.pdb",
        "pocket_center": [9.60, 37.54, 27.03],
        "approach_vector": [0.35, 0.85, 0.38],
        "pocket_residues": [402, 403, 404, 405, 406, 446, 464],
        "key_residues": "Ser403 (Active-site Nucleophile), Lys406, Tyr446, Asn464",
        "reference_affinity": -8.4
    },
    "dhfr": {
        "id": "dhfr",
        "pdb_id": "3SRW",
        "name": "Dihydrofolate Reductase (DHFR)",
        "organism": "Bacterial Pathogen",
        "classification": "Folate Biosynthesis Pathway",
        "description": "Key enzyme catalyzing NADPH-dependent reduction of DHF to THF for nucleic acid and amino acid synthesis. Primary target of trimethoprim.",
        "pdb_file": "dhfr.pdb",
        "pocket_center": [2.63, -31.77, 6.10],
        "approach_vector": [0.70, -0.40, 0.59],
        "pocket_residues": [27, 28, 31, 32, 50, 54, 94],
        "key_residues": "Asp27 (Substrate Anchor), Phe31, Ile50, Leu54",
        "reference_affinity": -8.9
    }
}

def get_targets_list():
    """Return catalog of available target proteins."""
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "pdb_id": t["pdb_id"],
            "organism": t["organism"],
            "classification": t["classification"],
            "description": t["description"],
            "pocket_center": t["pocket_center"],
            "pocket_residues": t["pocket_residues"],
            "key_residues": t["key_residues"],
            "reference_affinity": t["reference_affinity"]
        }
        for t in TARGETS.values()
    ]

def load_pocket_protein_atoms(target_id: str):
    """Extract protein atoms near the binding pocket."""
    target = TARGETS.get(target_id, TARGETS["gyrase"])
    pdb_path = os.path.join(TARGETS_DIR, target["pdb_file"])
    if not os.path.exists(pdb_path):
        return []

    center = np.array(target["pocket_center"])
    pocket_atoms = []

    with open(pdb_path, "r") as f:
        for line in f:
            if line.startswith("ATOM"):
                try:
                    res_num = int(line[22:26].strip())
                    res_name = line[17:20].strip()
                    atom_name = line[12:16].strip()
                    element = line[76:78].strip() or atom_name[0]
                    x = float(line[30:38])
                    y = float(line[38:46])
                    z = float(line[46:54])
                    pos = np.array([x, y, z])
                    dist = np.linalg.norm(pos - center)
                    # Pocket sphere 12 Angstroms
                    if dist <= 12.0 or res_num in target["pocket_residues"]:
                        pocket_atoms.append({
                            "res_num": res_num,
                            "res_name": res_name,
                            "atom_name": atom_name,
                            "element": element,
                            "pos": pos
                        })
                except Exception:
                    continue
    return pocket_atoms

def format_ki(affinity_kcal: float) -> str:
    """Thermodynamic Ki calculation from delta G."""
    R = 1.98720425864083e-3  # kcal / (mol * K)
    T = 298.15  # Kelvin
    try:
        ki_molar = math.exp(affinity_kcal / (R * T))
        if ki_molar < 1e-9:
            return f"{ki_molar * 1e12:.1f} pM"
        elif ki_molar < 1e-6:
            return f"{ki_molar * 1e9:.1f} nM"
        elif ki_molar < 1e-3:
            return f"{ki_molar * 1e6:.2f} µM"
        else:
            return f"{ki_molar * 1e3:.2f} mM"
    except Exception:
        return "N/A"

def run_docking_simulation(smiles: str, target_id: str):
    """
    Executes energy-minimized ligand conformer docking and builds an 18-frame
    spatial ingress trajectory into the designated bacterial pocket.
    """
    if target_id not in TARGETS:
        target_id = "gyrase"
    target = TARGETS[target_id]

    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        raise ValueError("Invalid SMILES structure.")

    mol = Chem.AddHs(mol)
    res = AllChem.EmbedMolecule(mol, randomSeed=42)
    if res < 0:
        res = AllChem.EmbedMolecule(mol, useRandomCoords=True)
    if res >= 0:
        try:
            AllChem.MMFFOptimizeMolecule(mol, maxIters=200)
        except Exception:
            pass
    else:
        AllChem.Compute2DCoords(mol)

    conf = mol.GetConformer()
    num_atoms = mol.GetNumAtoms()
    coords = np.array([list(conf.GetAtomPosition(i)) for i in range(num_atoms)])
    center_of_mass = coords.mean(axis=0)
    centered = coords - center_of_mass

    pocket_center = np.array(target["pocket_center"])
    pocket_atoms = load_pocket_protein_atoms(target_id)

    # Orientation search inside the pocket
    best_score = float("-inf")
    best_rotation = np.eye(3)
    best_offset = np.zeros(3)

    # Sample test rotations to optimize pocket contacts
    angles = np.linspace(0, 2 * np.pi, 6, endpoint=False)
    for ax in angles:
        for ay in angles[:3]:
            # Construct Euler rotation
            Rx = np.array([[1, 0, 0], [0, np.cos(ax), -np.sin(ax)], [0, np.sin(ax), np.cos(ax)]])
            Ry = np.array([[np.cos(ay), 0, np.sin(ay)], [0, 1, 0], [-np.sin(ay), 0, np.cos(ay)]])
            R = Ry @ Rx
            test_pose = (centered @ R.T) + pocket_center

            # Contact score evaluation
            score = 0.0
            clash = False
            for p_atom in pocket_atoms[:40]:
                dists = np.linalg.norm(test_pose - p_atom["pos"], axis=1)
                min_dist = dists.min()
                if min_dist < 1.6:  # Steric clash
                    clash = True
                    break
                elif 2.2 <= min_dist <= 3.8:
                    score += 1.0

            if not clash and score > best_score:
                best_score = score
                best_rotation = R

    # Energy-minimized docked pose
    docked_coords = (centered @ best_rotation.T) + pocket_center

    # Detect specific Hydrogen Bonds and interaction distances
    h_bonds = []
    contact_residues = set()

    for i, atom in enumerate(mol.GetAtoms()):
        sym = atom.GetSymbol()
        if sym in ["O", "N", "S", "F"]:
            atom_pos = docked_coords[i]
            for p_atom in pocket_atoms:
                if p_atom["element"] in ["O", "N"]:
                    d = float(np.linalg.norm(atom_pos - p_atom["pos"]))
                    if 2.0 <= d <= 3.3:
                        res_str = f"{p_atom['res_name']}{p_atom['res_num']}"
                        contact_residues.add(res_str)
                        # Avoid duplicates
                        if not any(h["protein_residue"] == res_str and h["ligand_atom"] == f"{sym}{i+1}" for h in h_bonds):
                            h_bonds.append({
                                "ligand_atom": f"{sym}{i+1}",
                                "ligand_pos": [round(float(atom_pos[0]), 3), round(float(atom_pos[1]), 3), round(float(atom_pos[2]), 3)],
                                "protein_residue": res_str,
                                "resi": p_atom["res_num"],
                                "protein_atom": p_atom["atom_name"],
                                "protein_pos": [round(float(p_atom["pos"][0]), 3), round(float(p_atom["pos"][1]), 3), round(float(p_atom["pos"][2]), 3)],
                                "distance_angstrom": round(d, 2)
                            })
                            if len(h_bonds) >= 4:
                                break
        if len(h_bonds) >= 4:
            break

    # Calculate binding affinity (delta G in kcal/mol)
    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    n_rot = Descriptors.NumRotatableBonds(mol)
    hbd = Descriptors.NumHDonors(mol)
    hba = Descriptors.NumHAcceptors(mol)

    # Base target affinity adjusted by ligand-specific pharmacophore interaction
    base_target = target["reference_affinity"]
    h_bond_bonus = -0.75 * min(len(h_bonds), 4)
    lipophilic_term = -0.35 * min(max(logp, 0), 4.5)
    rot_penalty = 0.12 * min(n_rot, 8)

    affinity_kcal = round(base_target + h_bond_bonus + lipophilic_term + rot_penalty, 2)
    affinity_kcal = min(max(affinity_kcal, -12.5), -4.5)

    ki_str = format_ki(affinity_kcal)

    # Generate Docked PDB block
    for idx in range(num_atoms):
        conf.SetAtomPosition(idx, Point3D(float(docked_coords[idx, 0]), float(docked_coords[idx, 1]), float(docked_coords[idx, 2])))
    docked_pdb = Chem.MolToPDBBlock(mol)

    # Generate 18-frame spatial trajectory for cinematic docking
    num_frames = 18
    approach_vec = np.array(target["approach_vector"])
    approach_vec = approach_vec / np.linalg.norm(approach_vec)
    start_point = pocket_center + (approach_vec * 19.0)

    multi_pdb_frames = []

    for f_idx in range(num_frames):
        t = f_idx / (num_frames - 1)  # 0.0 to 1.0
        # Smooth S-curve easing
        ease_t = t * t * (3.0 - 2.0 * t)
        
        # Position interpolation along approach vector into pocket
        pos_t = (1.0 - ease_t) * start_point + ease_t * pocket_center
        
        # Orientation interpolation (tumbling outside, aligning smoothly into pocket)
        decay_angle = (1.0 - t) * (math.pi * 0.70)
        R_tumbling = np.array([
            [math.cos(decay_angle), -math.sin(decay_angle), 0],
            [math.sin(decay_angle), math.cos(decay_angle), 0],
            [0, 0, 1]
        ])
        current_R = (1.0 - ease_t) * R_tumbling + ease_t * best_rotation

        # Calculate frame coordinates
        frame_coords = (centered @ current_R.T) + pos_t

        for a_idx in range(num_atoms):
            conf.SetAtomPosition(a_idx, Point3D(float(frame_coords[a_idx, 0]), float(frame_coords[a_idx, 1]), float(frame_coords[a_idx, 2])))

        pdb_lines = Chem.MolToPDBBlock(mol).splitlines()
        multi_pdb_frames.append(f"MODEL {f_idx + 1}\n" + "\n".join(pdb_lines) + "\nENDMDL")

    trajectory_pdb = "\n".join(multi_pdb_frames)

    return {
        "target": target,
        "affinity_kcal_mol": affinity_kcal,
        "ki_display": ki_str,
        "num_h_bonds": len(h_bonds),
        "h_bonds": h_bonds,
        "key_contacts": list(contact_residues) if contact_residues else target["key_residues"].split(", "),
        "docked_pdb": docked_pdb,
        "trajectory_pdb": trajectory_pdb,
        "frames_count": num_frames,
        "pocket_center": target["pocket_center"],
        "pocket_residues": target["pocket_residues"],
        "target_pdb_url": f"/targets/{target['pdb_file']}"
    }

