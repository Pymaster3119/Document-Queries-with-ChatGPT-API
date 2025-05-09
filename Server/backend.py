from flask import Flask, render_template, send_from_directory, request, jsonify
import os
import base64
from pdf2image import convert_from_bytes
import io
import traceback
import json
import requests

app = Flask(__name__)
app.static_folder = '/Users/aditya/Desktop/InProgress/Heat Timer/simple query/Server/templates'
FILES_DIR = os.path.join(os.path.abspath(os.path.join(os.path.join(app.static_folder, '..'), '..')),'files')
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

# --- New Route for OpenAI Proxy ---
@app.route('/ask-openai', methods=['POST'])
def ask_openai_proxy():
    try:
        # Load API key and parce the messages
        key_file = 'key.txt'
        if not os.path.exists(key_file):
            return jsonify({"error": "API key not found on server."}), 500
        with open(key_file, 'r') as f:
            api_key = f.read().strip()
        data = request.get_json() or {}
        messages = data.get('messages', [])
        model = 'gpt-4o-mini'
        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        # PDF -> data uri conversion
        processed_messages = []
        for msg in messages:
            new_msg = msg.copy()
            if msg.get("role") == "user" and isinstance(msg.get("content"), list):
                new_content = []
                for item in msg["content"]:
                    url = item.get("image_url", {}).get("url", "")
                    if item.get("type") == "image_url" and url.startswith("data:application/pdf;base64,"):
                        b64 = url.split(';base64,',1)[1]
                        pdf_bytes  = base64.b64decode(b64)
                        images = convert_from_bytes(pdf_bytes, fmt='png', thread_count=4)
                        for i, img in enumerate(images):
                            buf = io.BytesIO()
                            img.save(buf, format="PNG")
                            b64_png = base64.b64encode(buf.getvalue()).decode('ascii')
                            new_content.append({
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{b64_png}"
                                }
                            })
                            new_content.append({
                                "type": "text",
                                "text": f"Attached PDF page {i+1}."
                            })
                    else:
                        new_content.append(item)
                new_msg["content"] = new_content
            processed_messages.append(new_msg)

        final_messages = processed_messages

        # Send to OpenAI
        payload = {
            "model": model,
            "messages": final_messages
        }
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=payload
        )
        if not resp.ok:
            err = resp.json().get("error", {})
            return jsonify({"error": err.get("message", "OpenAI API error")}), resp.status_code
        content = resp.json()["choices"][0]["message"]["content"]
        return jsonify({"content": content})

    except Exception as e:
        print(f"ask_openai_proxy error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500

import json, os
from flask import send_from_directory, jsonify

@app.route('/files/<path:filename>')
def serve_files(filename):
    return send_from_directory(FILES_DIR, filename)

@app.route('/sections', methods=['GET'])
def get_sections():
    try:
        fp = "files/files.json"
        with open(fp, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        app.logger.error(f"could not load sections.json: {e}")
        return jsonify({"error": "could not load sections"}), 500

print(app.static_folder)
if __name__ == '__main__':
    app.run(debug=True, port=8080)