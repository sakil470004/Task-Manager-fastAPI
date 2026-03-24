from fastapi import FastAPI
from .database import Base, engine
from .routers import auth, tasks
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API")
# adding cors middleware to allow requests from any origin (for development purposes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/auth")
app.include_router(tasks.router, prefix="/tasks")


@app.get("/")
def root():
    return {"message": "Task Manager API is running"}