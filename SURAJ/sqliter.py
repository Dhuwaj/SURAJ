import sqlite3

def connector():
    conn = sqlite3.connect("Suraj.db")
    c = conn.cursor()
    return conn, c

def create_table():
    conn, c = connector()
    
    c.execute('''
              CREATE TABLE IF NOT EXISTS requests
                (id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                message TEXT)
                ''')
    
    conn.commit()
    conn.close()

def save_request(name, email, message):
    conn, c = connector()
    
    c.execute("INSERT INTO requests (name, email, message) VALUES (?, ?, ?)",
                (name, email, message))
    
    conn.commit()
    conn.close()