import threading
import time
import cv2
import json

class Camera:
    def __init__(self, camIndex):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.thread = None
        self.current_frame = None
        self.faces = []  # Initialized to prevent AttributeError
        self.is_running = False
        self.lock = threading.Lock()  # Added lock for thread safety
        
        self.camera = cv2.VideoCapture(camIndex)
        if not self.camera.isOpened():
            raise Exception("Could not open video device")
            
        self.frame_width = self.camera.get(cv2.CAP_PROP_FRAME_WIDTH) or 640
        self.frame_height = self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480

    def __del__(self):
        if self.camera.isOpened():
            self.camera.release()

    def start(self):
        if self.thread is None:
            self.is_running = True
            self.thread = threading.Thread(target=self._capture, daemon=True)
            self.thread.start()

    def get_frame(self):
        with self.lock:
            return self.current_frame

    def get_faces(self):
        with self.lock:
            return self.faces

    def stop(self):
        self.is_running = False
        if self.thread is not None:
            self.thread.join()
            self.thread = None
        with self.lock:
            self.current_frame = None
            self.faces = []

    def _capture(self):
        while self.is_running:
            time.sleep(0.04)
            ret, frame = self.camera.read()
            if ret:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                abs_faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
                
                rel_faces = []
                for index, (x, y, w, h) in enumerate(abs_faces, start=1):
                    face = {
                        'id': index,
                        'x': x / self.frame_width,
                        'y': y / self.frame_height,
                        'w': w / self.frame_width,
                        'h': h / self.frame_height
                    }
                    rel_faces.append(face)
                
                with self.lock:
                    self.current_frame = frame
                    self.faces = rel_faces
            else:
                print("Failed to capture frame")
        
        print("Camera thread stopped")
        with self.lock:
            self.thread = None
            self.is_running = False
            self.current_frame = None
            self.faces = []