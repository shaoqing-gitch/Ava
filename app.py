from flask import Flask, jsonify, send_file, request, render_template
import os
import requests
from PIL import Image
import io
import json
import logging
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)
DEFAULT_USERNAME = "default_user"

# 初始化全局字典
user_preferences = {}
user_feedback_history = {}

# 定义请求头
HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {os.getenv("PERFX_API_KEY")}'
}

@app.route('/')
def index():
    """渲染首页模板"""
    return render_template('index.html')

@app.route('/generate_image', methods=['POST'])
def generate_image():
    """处理图像生成请求"""
    data = request.json
    logging.info(f"Received data: {data}")
    style = data.get('style')
    prompt = data.get('prompt')
    negative_prompt = data.get('negative_prompt', "")  # 设置默认值为空字符串
    seed = data.get('seed', 4)

    url = os.getenv("API_URL")
    payload = {
        "model": "StableDiffusion",
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "steps": 10,
        "seed": seed,
        "width": 512,
        "height": 512,
        "batch_size": 1,
        "n_iter": 1
    }

    response = requests.post(url, headers=HEADERS, json=payload)
    logging.info(f"API response: {response.status_code}, {response.text}")
    if response.status_code == 200:
        data = response.json()
        logging.info(f"JSON response: {data}")
        images = data.get('images')
        if images:
            image_url = images[0]
            return jsonify({'image_url': image_url})
        else:
            return jsonify({'error': 'No image URLs found in response.'}), 500
    else:
        return jsonify({'error': 'Failed to generate image.'}), response.status_code

@app.route('/reset_preferences', methods=['POST'])
def reset_preferences():
    """重置用户偏好和反馈历史"""
    user_preferences[DEFAULT_USERNAME] = {'like_count': 0, 'dislike_count': 0}
    user_feedback_history[DEFAULT_USERNAME] = []
    return jsonify({'message': 'Preferences reset'}), 200

@app.route('/feedback', methods=['POST'])
def handle_feedback():
    """处理用户反馈"""
    data = request.json
    user_id = data['user_id']
    feedback = data.get('feedback', 'default_feedback')

    if DEFAULT_USERNAME not in user_preferences:
        user_preferences[DEFAULT_USERNAME] = {'like_count': 0, 'dislike_count': 0}
    if DEFAULT_USERNAME not in user_feedback_history:
        user_feedback_history[DEFAULT_USERNAME] = []
        logging.info(f"Received feedback: {feedback}")

    if feedback == 'like':
        user_preferences[user_id]['like_count'] += 1
    else:
        user_preferences[user_id]['dislike_count'] += 1

    user_feedback_history[user_id].append(feedback)
    adjust_generation_algorithm(user_id, feedback)
    return jsonify({'message': 'Feedback received'})

def adjust_generation_algorithm(user_id, feedback):
    """根据用户反馈调整生成算法"""
    total_feedback = user_preferences[user_id]['like_count'] + user_preferences[user_id]['dislike_count']
    if total_feedback > 0:
        like_ratio = user_preferences[user_id]['like_count'] / total_feedback
        logging.info(f"User {user_id} likes ratio: {like_ratio}")
        # 拓展：这里添加根据 like_ratio 调整算法的逻辑

if __name__ == '__main__':
    app.run(debug=True)
logging.info("API URL:" + os.getenv("API_URL"))
logging.info("API Key:" + os.getenv("PERFX_API_KEY"))