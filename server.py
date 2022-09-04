from flask_socketio import SocketIO, emit
from flask import Flask, request
from flask_cors import CORS
from random import gauss, random
from threading import Thread, Event
from time import sleep

from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler

import numpy as np
from PIL import Image
import base64
from io import BytesIO


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

socketio = SocketIO(app, cors_allowed_origins='*')
CORS(app)
# Server functionality for receiving and storing data from elsewhere, not related to the websocket
#Data Generator Thread
thread = Thread()
thread_stop_event = Event()
class DataThread(Thread):
    def __init__(self):
        self.delay = 0.5
        super(DataThread, self).__init__()
    def dataGenerator(self):
        print("Initialising")
        try:
            while not thread_stop_event.isSet():
                socketio.emit('responseMessage', {'temperature': round(random()*10, 3)})
                sleep(self.delay)
        except KeyboardInterrupt:
            # kill()
            print("Keyboard  Interrupt")
    def run(self):
        self.dataGenerator()

# Handle the webapp connecting to the websocket
@socketio.on('connect')
def test_connect():
    print('someone connected to websocket:', request.sid)
    emit('connect', {'data': 'Connected! ayy'})
    
@socketio.on('disconnect')
def test_connect():
    print(request.sid)
    print('someone disconnected to websocket')
    emit('disconnect', {'data': 'Disconnected! ayy'})

# Handle the webapp connecting to the websocket, including namespace for testing
@socketio.on('connect', namespace='/devices')
def test_connect2():
    print('someone connected to websocket!')
    emit('responseMessage', {'data': 'Connected devices! ayy'})


@socketio.on('gen_step')
def handle_message(message):
    # print(request.sid)
    # print('someone sent to the websocket', message)
    # print(message.keys())

    area_img = Image.open(BytesIO(base64.b64decode(message['area_img'].split(",",1)[1])))
    layer_img = Image.open(BytesIO(base64.b64decode(message['layer_img'].split(",",1)[1])))


    # for testing-gaussian
    gaussian = np.random.random((area_img.height, area_img.width, 1))*255
    gaussian4 = np.ones((area_img.height, area_img.width, 1))*255
    gaussian = np.concatenate((gaussian, gaussian, gaussian, gaussian4), axis = 2)
    result = np.array(gaussian, dtype = np.uint8)
    

    area_array = np.asarray(area_img)
    # print(area_array.shape, gaussian.shape)
    result[:,:,3] = area_array[:,:,3]

    result = Image.fromarray(result)
    # print('here?')
    buffered = BytesIO()
    result.save(buffered, format="PNG")
    result_img = base64.b64encode(buffered.getvalue()).decode("utf-8")

    emit('gen_done', {'data':message['area_img'].split(",",1)[0]+','+result_img, 'stroke_id': message['stroke_id']})


# Handle the webapp sending a message to the websocket, including namespace for testing
@socketio.on('message', namespace='/devices')
def handle_message2():
    print('someone sent to the websocket!')


@socketio.on_error_default  # handles all namespaces without an explicit error handler
def default_error_handler(e):
    print('An error occured:')
    print(e)

if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0', port=5001)
    print('run server...')
    # http_server = WSGIServer(('',5000), app, handler_class=WebSocketHandler)
    # http_server.serve_forever()
