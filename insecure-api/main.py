from fastapi import FastAPI, HTTPException, Header, Request
from typing import Optional
from models import VideoGame, User
from database import video_games, users
import sqlite3
import os

app = FastAPI()

# Initialize the SQLite database
def init_db():
    if not os.path.exists('videogames.db'):
        conn = sqlite3.connect('videogames.db')
        cursor = conn.cursor()
        # Create table
        cursor.execute('''
            CREATE TABLE video_games (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                developer TEXT NOT NULL,
                publisher TEXT NOT NULL,
                year_published INTEGER NOT NULL,
                sales INTEGER NOT NULL
            )
        ''')
        # Insert data
        for game in video_games:
            cursor.execute('''
                INSERT INTO video_games (id, title, developer, publisher, year_published, sales)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (game.id, game.title, game.developer, game.publisher, game.year_published, game.sales))
        conn.commit()
        conn.close()

# Call the init_db function when the app starts
@app.on_event("startup")
def startup_event():
    init_db()

# Public endpoint to get basic video game info
@app.get("/games")
def get_games():
    return video_games

# Vulnerable endpoint: No authentication required to get sensitive sales data
@app.get("/games/{game_id}/sales")
def get_game_sales(game_id: int):
    # Vulnerability: No authentication or authorization checks (API1:2019 - Broken Object Level Authorization)
    for game in video_games:
        if game.id == game_id:
            return {"title": game.title, "sales": game.sales}
    raise HTTPException(status_code=404, detail="Game not found")

# Vulnerable endpoint: Weak authentication and improper authorization
@app.post("/games")
def add_game(game: VideoGame, token: Optional[str] = Header(None)):
    # Vulnerability: Token sent in header without proper validation (API2:2019 - Broken Authentication)
    if not token:
        raise HTTPException(status_code=401, detail="Token required")

    # Vulnerability: Insecure token handling and authorization (API5:2019 - Broken Function Level Authorization)
    for user in users:
        if user.token == token:
            if user.is_admin:
                video_games.append(game)
                return {"message": "Game added"}
            else:
                raise HTTPException(status_code=403, detail="Not authorized")
    raise HTTPException(status_code=401, detail="Invalid token")

# Vulnerable endpoint: Exposes sensitive user data
@app.get("/users")
def get_users():
    # Vulnerability: Exposes tokens and admin status (API3:2019 - Excessive Data Exposure)
    return users

# Additional vulnerable endpoint: No rate limiting implemented
@app.post("/login")
def login(username: str):
    # Vulnerability: No rate limiting allows brute-force attacks (API4:2019 - Lack of Resources & Rate Limiting)
    for user in users:
        if user.username == username:
            return {"token": user.token}
    raise HTTPException(status_code=404, detail="User not found")

# Additional vulnerable endpoint: Mass assignment
@app.put("/games/{game_id}")
def update_game(game_id: int, updated_game: VideoGame):
    # Vulnerability: Mass assignment allows overwriting of unintended fields (API6:2019 - Mass Assignment)
    for i, game in enumerate(video_games):
        if game.id == game_id:
            video_games[i] = updated_game
            return {"message": "Game updated"}
    raise HTTPException(status_code=404, detail="Game not found")

# Additional vulnerable endpoint: SQL Injection
@app.get("/search")
def search_games(query: str):
    # Vulnerability: User input is not sanitized (API8:2019 - Injection)
    # This allows SQL injection attacks
    conn = sqlite3.connect('videogames.db')
    cursor = conn.cursor()
    # BAD: Directly inserting user input into SQL query without sanitization
    sql_query = "SELECT * FROM video_games WHERE title LIKE ?"
    cursor.execute(sql_query, ('%{0}%'.format(query), ))
    rows = cursor.fetchall()
    conn.close()
    # Convert rows to list of dictionaries
    results = []
    for row in rows:
        results.append({
            "id": row[0],
            "title": row[1],
            "developer": row[2],
            "publisher": row[3],
            "year_published": row[4],
            "sales": row[5],
        })
    return results

# Additional vulnerable endpoint: Improper assets management
@app.get("/.env")
def get_env():
    # Vulnerability: Sensitive files are exposed (API9:2019 - Improper Assets Management)
    return {"SECRET_KEY": "supersecretkey"}

# Additional vulnerable endpoint: Insufficient logging and monitoring
@app.post("/admin/delete_game")
def delete_game(game_id: int, token: Optional[str] = Header(None)):
    # Vulnerability: Actions are not logged (API10:2019 - Insufficient Logging & Monitoring)
    if not token:
        raise HTTPException(status_code=401, detail="Token required")

    for user in users:
        if user.token == token and user.is_admin:
            for i, game in enumerate(video_games):
                if game.id == game_id:
                    deleted_game = video_games.pop(i)
                    # No logging of the deletion action
                    return {"message": f"Game '{deleted_game.title}' deleted"}
            raise HTTPException(status_code=404, detail="Game not found")
    raise HTTPException(status_code=403, detail="Not authorized")
