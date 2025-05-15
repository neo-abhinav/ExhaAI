from app import socketio, app

if __name__ == '__main__':
    print("Starting server on http://0.0.0.0:8080")
    print("WARNING: Server is accessible to all network interfaces!")
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)
