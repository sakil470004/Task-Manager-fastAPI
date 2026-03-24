run:
	source venv/bin/activate && uvicorn app.main:app --reload

install:
	source venv/bin/activate && pip install -r requirements.txt