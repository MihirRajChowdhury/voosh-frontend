# RAG Chatbot Frontend

A React + SCSS frontend for the RAG-powered news chatbot.

## Features
- **Chat Interface**: Clean, responsive UI for chatting with the bot.
- **Session Management**: Persists session ID in local storage.
- **History**: Loads past conversation on refresh.
- **Sources**: Displays source links for the news used in the answer.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Configuration
The API URL is set to `http://localhost:3000/api` in `src/components/Chat.jsx`. Update it if your backend runs on a different port.
