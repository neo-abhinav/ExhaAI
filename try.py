import requests

BASE_URL = "https://ai-abhinav.onrender.com"  # Replace with your actual domain if different
API_URL = f"{BASE_URL}/api"
DEFAULT_MODEL = "reka-core"

def create_new_chat():
    response = requests.post(f"{API_URL}/chat/new")
    response.raise_for_status()
    data = response.json()
    return data['chat_id']

def chat_with_id(chat_id, message, model=DEFAULT_MODEL):
    payload = {
        "id": chat_id,
        "msg": message,
        "model": model  # set default model here
    }
    response = requests.post(f"{API_URL}/chat", json=payload)
    response.raise_for_status()
    data = response.json()
    return data['response']

def main():
    print("Creating a new chat session...")
    chat_id = create_new_chat()
    print(f"Chat ID: {chat_id}")

    print("Your chat URL to view history:")
    print(f"{BASE_URL}/chat/history?id={chat_id}")

    # Chat loop
    while True:
        user_input = input("Enter message (or 'exit' to quit): ")
        if user_input.lower() == 'exit':
            break
        print("Sending message to chat with model 'reka-core'...")
        reply = chat_with_id(chat_id, user_input, model="reka-core")
        print("AI:", reply)

if __name__ == "__main__":
    main()
