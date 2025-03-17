import { NextResponse } from 'next/server';

// Type for a chat conversation
interface ChatConversation {
  id: string;
  title: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for chat history (temporary solution)
let chatHistory: ChatConversation[] = [];

export async function POST(request: Request) {
  try {
    const { messages, userId, title } = await request.json();

    // Generate a conversation ID based on the first few messages
    const conversationId = messages.length > 0 ? 
      `chat-${messages[0].content.slice(0, 20).replace(/[^a-z0-9]/gi, '')}-${Date.now()}` : 
      `chat-${Date.now()}`;

    // Check if this conversation exists
    const existingIndex = chatHistory.findIndex(conv => {
      // Compare first message content to identify the conversation
      return conv.messages[0]?.content === messages[0]?.content;
    });

    if (existingIndex !== -1) {
      // Update existing conversation with new messages
      chatHistory[existingIndex] = {
        ...chatHistory[existingIndex],
        messages: messages, // Update with all messages
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json({ 
        status: 'success',
        conversation: chatHistory[existingIndex]
      });
    }

    // Create new conversation
    const newConversation: ChatConversation = {
      id: conversationId,
      title: title || 'New Conversation',
      messages: messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to beginning of chat history
    chatHistory.unshift(newConversation);

    // Keep only the last 10 conversations
    chatHistory = chatHistory.slice(0, 10);

    return NextResponse.json({ 
      status: 'success',
      conversation: newConversation 
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Sort conversations by most recent first
    const sortedHistory = [...chatHistory].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ 
      status: 'success',
      conversations: sortedHistory 
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
} 