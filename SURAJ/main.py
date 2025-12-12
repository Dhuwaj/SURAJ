from flask import Flask, render_template, request, flash
import threading
import webbrowser
import time
import os

import sqliter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

sqliter.create_table()

app = Flask("SURAJ", 
            instance_path=BASE_DIR, 
            root_path=BASE_DIR, 
            template_folder=os.path.join(BASE_DIR, "templates"), 
            static_folder=os.path.join(BASE_DIR, "static")
)
app.secret_key = "SECRECT_KEY"

@app.route("/")
def home():
    return render_template("pages/home.html")

@app.route("/download")
def download():
    return render_template("pages/download.html")

@app.route("/support", methods=["GET", "POST"])
def support():
    if request.method == "GET":
        return render_template("pages/support.html")
    elif request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        message = request.form.get("message")

        sqliter.save_request(name, email, message)
        
        return render_template("pages/support.html", success=True)

def run_server():
    app.run()

if __name__ == "__main__":
    run_server()