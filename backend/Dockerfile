FROM continuumio/miniconda3

WORKDIR /app

COPY requirements-pip.txt /app/requirements-pip.txt
COPY main.py /app/main.py
COPY ../scientific_antibiotic_model.pkl /app/scientific_antibiotic_model.pkl

RUN conda install -y -c conda-forge python=3.12 rdkit pandas scikit-learn && \
    pip install --no-cache-dir -r requirements-pip.txt && \
    conda clean -afy

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
