# AI Explanation Feature Setup

This app uses LangChain with Google's Gemini API to provide AI-powered explanations for API requests and responses.

## Setup Instructions

### 1. Install Dependencies

Make sure you have the required packages installed:

```bash
npm install @langchain/core @langchain/google-genai langchain
```

### 2. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey) or [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy your API key

### 3. Configure Environment Variables

Create a `.env` file in the `callsensei` directory (same level as `package.json`) with:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Replace `your_gemini_api_key_here` with your actual API key.

### 4. Important Notes

⚠️ **Security Warning**: Since this is a frontend-only implementation, your API key will be exposed in the client-side code. This is a trade-off for not having a backend. Consider:

- Using API key restrictions in Google Cloud Console
- Setting up domain restrictions
- Monitoring API usage
- For production apps, consider using a backend proxy

### 5. How It Works

- **Endpoint Explanation**: When you send a request, the AI analyzes the HTTP method, URL, headers, and body to explain what the request does.

- **Response Explanation**: After receiving a response, the AI analyzes the status code, headers, and body to provide insights about the response.

The explanations appear in the "AI Explanation" section below the response viewer.

### 6. Troubleshooting

If you see errors:
- Make sure your `.env` file is in the correct location
- Restart your dev server after adding the `.env` file
- Check that your API key is valid and has proper permissions
- Ensure you've installed all required dependencies

### 7. API Usage

The AI service uses:
- **Model**: `gemini-pro`
- **Temperature**: 0.7 (for balanced creativity and accuracy)
- **Rate Limits**: Be aware of Gemini API rate limits and quotas

