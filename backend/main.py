from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(
    title="Project Backend API",
    description="FastAPI backend connected to React frontend",
    version="1.0.0",
)

# Configure CORS so React (Vite default port 5173) can talk to FastAPI
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    id: int
    name: str
    description: str

items_db: List[Item] = [
    Item(id=1, name="Sample Item 1", description="This is fetched from the FastAPI backend"),
    Item(id=2, name="Sample Item 2", description="Built with React & FastAPI"),
]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the FastAPI Backend API!",
        "docs": "/docs",
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "backend"}

@app.get("/api/message")
def get_message():
    return {"message": "Hello from FastAPI Backend!"}

@app.get("/api/items", response_model=List[Item])
def get_items():
    return items_db

@app.post("/api/items", response_model=Item)
def create_item(item: Item):
    items_db.append(item)
    return item

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
