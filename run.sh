#!/bin/bash
source venv/bin/activate
which python
uvicorn app.main:app --reload
