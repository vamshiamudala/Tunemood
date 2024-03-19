from __future__ import division, print_function
#import sys
import os
import cv2
#import re
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from flask import Flask, request, render_template
from werkzeug.utils import secure_filename
import statistics as st
from flask import send_from_directory, jsonify
from datetime import datetime


app = Flask(__name__)

# Hardcoded credentials
USERNAME = "admin"
PASSWORD = "password"

emotion_records = []

@app.route("/")
def home():
     return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    if username == USERNAME and password == PASSWORD:
        return render_template('camera.html')

    else:
        return "Login Failed", 401
    
@app.route('/logout', methods=['POST'])
def logout():
    return render_template('login.html')

    
    
@app.route('/camera', methods = ['GET', 'POST'])
def camera():
    i=0

    GR_dict={0:(0,255,0),1:(0,0,255)}
    model = tf.keras.models.load_model('final_model.h5')
    face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
    output=[]
    cap = cv2.VideoCapture(0)
    while (i<=30):
        ret, img = cap.read()
        faces = face_cascade.detectMultiScale(img,1.05,5)

        for x,y,w,h in faces:

            face_img = img[y:y+h,x:x+w] 

            resized = cv2.resize(face_img,(224,224))
            reshaped=resized.reshape(1, 224,224,3)/255
            predictions = model.predict(reshaped)

            max_index = np.argmax(predictions[0])

            emotions = ('angry', 'disgust', 'fear', 'happy', 'sad', 'neutral', 'surprise')
            predicted_emotion = emotions[max_index]
            output.append(predicted_emotion)
            
            
            
            cv2.rectangle(img,(x,y),(x+w,y+h),GR_dict[1],2)
            cv2.rectangle(img,(x,y-40),(x+w,y),GR_dict[1],-1)
            cv2.putText(img, predicted_emotion, (x, y-10),cv2.FONT_HERSHEY_SIMPLEX,0.8,(255,255,255),2)
        i = i+1

        cv2.imshow('LIVE', img)
        key = cv2.waitKey(1)
        if key == 27: 
            cap.release()
            cv2.destroyAllWindows()
            break
    print(output)
    cap.release()
    cv2.destroyAllWindows()
    final_output1 = st.mode(output)
    return render_template("player.html",final_output=final_output1)


@app.route('/templates/player', methods = ['GET','POST'])
def buttons():
    return render_template("player.html")

@app.route('/songs/<emotion>')
def get_songs(emotion):
    songs_dir = os.path.join('static', 'songs', emotion)
    try:
        songs = os.listdir(songs_dir)  # List all files in the directory
        songs = [song for song in songs if song.endswith('.mp3')]  # Filter for mp3 files
        return jsonify(songs)
    except FileNotFoundError:
        return jsonify([]), 404
    
@app.route('/record_emotion', methods=['POST'])
def record_emotion():
    emotion = request.form['emotion']
    timestamp = datetime.utcnow()
    emotion_record = {'emotion': emotion, 'timestamp': timestamp.isoformat()}
    emotion_records.append(emotion_record)
    print('Recorded emotion:', emotion_record)
    return jsonify(success=True), 200


@app.route('/evolution')
def evolution():
    return render_template('evolution.html')

@app.route('/get_emotion_data')
def get_emotion_data():
    print("Sending emotion records:", emotion_records)
    return jsonify(emotion_records)

    
if __name__ == "__main__":
    app.run(debug=True)