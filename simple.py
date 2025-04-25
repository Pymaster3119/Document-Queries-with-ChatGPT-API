import QueryGPT
import tkinter
import tkinter.filedialog

# Initialize tkinter variables
main = tkinter.Tk()
frame = tkinter.Frame(main)
frame.pack()
documentnamevar = tkinter.StringVar()


# Initialize the system text
with open("systemtext.txt", "r") as file:
    system_text = file.read()

def initializeDocument(filename, documentname):
    global system_text
    with open(filename, 'r') as file:
        document = file.read()

    # Format the system text
    system_text = system_text.replace("<DOCUMENTNAME>", documentname)
    system_text += document
    print("Document initialized with name:", documentname)

def pick_file():
    filepath = tkinter.filedialog.askopenfilename(
        title="Select a file",
        filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")]
    )
    if filepath:
        documentname = documentnamevar.get()
        initializeDocument(filepath, documentname)
        print("File selected:", filepath)
        # Transition GUI to the next step
        initializeChat()

#Backend to create the chatgpt interaction
messages = [{"role": "system", "content": system_text}, {"role": "assistant", "content": "Hello, how can I assist you today?"}]
def send_message(text):
    global messages
    assistant_response = QueryGPT.run_query("gpt-4o-mini", system_text, text, messages)
    messages.append({"role": "assistant", "content": assistant_response})
    initializeChat()

#Create GUI
tkinter.Entry(frame, textvariable=documentnamevar).grid(row=0, column=1)
tkinter.Button(frame, text="Select File", command=pick_file).grid(row=0, column=0)

def initializeChat():
    #Clear the frame
    for widget in frame.winfo_children():
        widget.destroy()
    
    #Create thte chat interface
    chat_label = tkinter.Label(frame, text="Chat with the assistant:")
    chat_label.grid(row=0, column=0)
    chat_frame = tkinter.Frame(frame)
    chat_frame.grid(row=1, column=0)

    #Add chat elements
    for i in range(len(messages)):
        if messages[i]["role"] == "assistant":
            chat_label = tkinter.Label(chat_frame, text="Assistant: " + messages[i]["content"])
            chat_label.grid(row=i, column=0)
        elif messages[i]["role"] == "user":
            chat_label = tkinter.Label(chat_frame, text="User: " + messages[i]["content"])
            chat_label.grid(row=i, column=1)
    #Add input field
    if messages[len(messages) - 1]['role'] == "assistant":
        user_input = tkinter.Entry(chat_frame)
        user_input.grid(row=len(messages), column=1)
        user_input.bind("<Return>", lambda event: send_message(user_input.get()))

main.mainloop()