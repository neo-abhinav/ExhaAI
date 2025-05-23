# ExhaAI

ExhaAI is a real-time chat application that leverages AI capabilities to provide dynamic interactions. It is built using Node.js and Express, with Socket.IO for real-time communication.

## Key Features

### Express Server Setup
- The application uses Express to serve static files and handle HTTP requests.
- It listens on a specified port (default is 8080).

### Socket.IO Integration
- Real-time communication is facilitated through Socket.IO, allowing for instant message exchange between the client and server.

### Chat Session Management
- The application manages chat sessions using cookies. A unique `chat_id` is generated for each session, which is stored in a Set to track active sessions.

### Dynamic Chat Session Creation
- When a user accesses the root URL (`/`), the server checks for an existing `chat_id`. If none exists, it creates a new chat session by calling an external API.

### Message Handling
- The server listens for `send_message` events from the client. It validates the message and the selected AI model before processing.
- If the message starts with `image:`, it generates an image URL based on the prompt and sends it back to the client.

### AI Interaction
- The server sends the user's message to an external API (`API_BASE_URL`) for processing and retrieves a response.
- The response is parsed using the `marked` library to convert Markdown to HTML before sending it back to the client.

### Error Handling
- The server includes error handling for both chat session creation and message processing, emitting error messages back to the client when necessary.

### Image Generation
- The server can handle image generation requests through a `generate_image` event, reusing the logic for image prompts.

## Example Usage

### Starting the Server
- The server can be started by running the Node.js application, which will listen for incoming connections on the specified port.

### Chat Interface
- Users can interact with the chat interface, sending messages and receiving responses from the AI in real-time.

### Image Generation
- Users can request images by sending prompts prefixed with `image:`, and the server will respond with the generated image.

## Conclusion
This code provides a robust foundation for a real-time chat application that leverages AI capabilities. It can be further enhanced with additional features such as user authentication, message history, and improved error handling.