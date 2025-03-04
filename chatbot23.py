def simple_chatbot():
    print("Hello! I'm your friendly chatbot. Type 'exit' to end the conversation.")

    while True:
        user_input = input("You: ").strip().lower()

        if user_input == "exit":
            print("Chatbot: Goodbye! Have a great day!")
            break

        # Basic responses
        elif "hello" in user_input or "hi" in user_input:
            print("Chatbot: Hi there! How can I help you?")
        elif "how are you" in user_input:
            print("Chatbot: I'm just a bot, but I'm doing great! How about you?")
        elif "your name" in user_input:
            print("Chatbot: I'm a simple chatbot. You can call me Chatty!")
        elif "weather" in user_input:
            print("Chatbot: I'm not connected to the internet, but I hope it's sunny where you are!")
        elif "joke" in user_input:
            print("Chatbot: Why don’t scientists trust atoms? Because they make up everything!")
        else:
            print("Chatbot: I'm not sure how to respond to that. Can you ask me something else?")

# Run the chatbot
simple_chatbot()