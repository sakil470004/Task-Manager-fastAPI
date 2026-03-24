from fastapi import FastAPI
from .database import Base, engine
from .routers import auth, tasks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API")

app.include_router(auth.router, prefix="/auth")
app.include_router(tasks.router, prefix="/tasks")


@app.get("/")
def root():
    return {"message": "Task Manager API is running"}