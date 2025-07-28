from flask import Flask, render_template
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def homepage():
    return render_template('homepage.html')

@app.route('/diagnosis1')
def diagnosis1():
    return render_template('diagnosis1.html')

@app.route('/diagnosis2')
def diagnosis2():
    return render_template('diagnosis2.html')

@app.route('/diagnosis3')
def diagnosis3():
    return render_template('diagnosis3.html')

@app.route('/feedbackpage')
def feedbackpage():
    return render_template('feedbackpage.html')

@app.route('/aboutus')
def aboutus():
    return render_template('aboutus.html')

@app.route('/idpage')
def idpage():
    return render_template('idpage.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))  # Render sets PORT env variable
    app.run(host='0.0.0.0', port=port, debug=True)
