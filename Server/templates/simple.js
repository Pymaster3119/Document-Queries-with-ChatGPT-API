//Deal with ChatGPT
function askGPT() {
  console.log(window.getSelection().toString());
  document.getElementById("ChatGPT-interface").style.display = "block";
  createChatGPTChat();
}

messages = [{ role: "system", content: "" }, { role: "assistant", content: "How can I help you?" }];

function createChatGPTChat() {
  const chatgptdiv = document.getElementById("ChatGPT-interface");
  chatgptdiv.innerHTML = "";
  for (let i = 0; i < messages.length; i++) {
    if (messages[i]["role"] === "system") {
      continue;
    }
    const textcontent = messages[i]["content"];
    const messageWrapper = document.createElement("div");
    messageWrapper.className = `message-wrapper ${messages[i]["role"] === "assistant" ? "" : "right"}`;
    
    const messageHeader = document.createElement("div");
    messageHeader.className = "message-header";
    
    const speakerName = document.createElement("span");
    speakerName.textContent = i % 2 === 0 ? "ChatGPT" : "User";
    messageHeader.appendChild(speakerName);
    messageWrapper.appendChild(messageHeader);

    const bubble = document.createElement("div");
    bubble.className = `bubble bubble-${messages[i]["role"] === "assistant" ? "left" : "right"}`;
    bubble.innerHTML = textcontent;
    messageWrapper.appendChild(bubble);

    chatgptdiv.appendChild(messageWrapper);
  }

  // Create the input bubble
  const speakerName = document.createElement("span");
  speakerName.textContent = "User";

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "message-wrapper right input-message";

  const inputBubble = document.createElement("div");
  inputBubble.className = "bubble bubble-right";
  inputBubble.style.maxWidth = "80%";
  inputBubble.style.minWidth = "70%";

  const textInput = document.createElement("textarea");
  textInput.placeholder = "Type your message...";
  textInput.className = "con-input-text";
  textInput.style.backgroundColor = "rgba(255, 255, 255, 0)";
  textInput.style.color = "#ffffff";
  textInput.style.border = "none";
  textInput.style.minWidth = "90%";
  textInput.style.maxWidth = "90%";
  
  const sendIcon = document.createElement("i");
  sendIcon.className = "fas fa-paper-plane";
  inputBubble.appendChild(textInput);
  inputBubble.appendChild(sendIcon);
  inputWrapper.appendChild(speakerName);
  inputWrapper.appendChild(inputBubble);
  chatgptdiv.appendChild(inputWrapper);
  
  // Add the event listener for the input
  sendIcon.addEventListener("click", function() {
    const documentName = document.getElementById("documentName").value;
    const systemtext = "You are a helpful assistant made to answer questions about "+documentName+". You are to directly cite "+documentName+" in your responses. Keep the conversation on questions about "+documentName+", which contains the following text:\n" + document.getElementById("documentContent").value;
    console.log(systemtext);

    messages[0]["content"] = systemtext;
    messages.push({ role: "user", content: textInput.value });
    fetch(`/apiKey`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        apiKey = data.apiKey;
        fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
               "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: messages
            })
          })
          .then(response => response.json())
          .then(data => {
            messages.push({ role: "assistant", content: data.choices[0].message.content });
            createChatGPTChat();
          })
      })
    });
    
}
    