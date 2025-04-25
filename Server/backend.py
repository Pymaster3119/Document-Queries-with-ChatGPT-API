from flask import Flask, render_template, send_from_directory

app = Flask(__name__)
app.static_folder = '/Users/aditya/Desktop/InProgress/Heat Timer/simple query/Server/templates'
@app.route('/simple.html')
def sendSimpleHTML():
    return render_template('simple.html')

@app.route('/simple.js')
def sendSimpleJS():
    return render_template('simple.js')

@app.route('/simple.css')
def sendSimpleCSS():
    return send_from_directory(app.static_folder, 'simple.css')

@app.route('/complex.html')
def sendComplexHTML():
    return render_template('complex.html')

@app.route('/complex.js')
def sendComplexJS():
    return render_template('complex.js')

@app.route('/complex.css')
def sendComplexCSS():
    return send_from_directory(app.static_folder, 'complex.css')

@app.route('/apiKey')
def sendAPIKey():
    print("Here")
    with open('key.txt', 'r') as txt:
        print("Hehehehe")
        api_key = txt.read()
    return {"apiKey":api_key}, 200

print(app.static_folder)
if __name__ == '__main__':
    app.run(debug=True, port=8080)