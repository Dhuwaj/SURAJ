from flask import Flask, render_template
import threading
import webbrowser
import time
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask("SURAJ App", 
            instance_path=BASE_DIR, 
            root_path=BASE_DIR, 
            template_folder=os.path.join(BASE_DIR, "templates"), 
            static_folder=os.path.join(BASE_DIR, "static")
)
app.secret_key = "SECRECT_KEY"

@app.route("/")
def dashboard():
    return render_template("dashboard.html")

def run_server():
    app.run()

if __name__ == "__main__":
    threading.Thread(target=run_server).start()
    time.sleep(1)
    webbrowser.open("http://127.0.0.1:5000/")