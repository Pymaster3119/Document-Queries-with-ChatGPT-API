//#region Deal w/Document
sections = [{"name":"Untitled", "description":"", "content":""}];
currentdocument = 0;

function createSections()
{
  const sectionContainer = document.getElementById("sectionList");
  sectionContainer.innerHTML = "";
  for (let i = 0; i < sections.length; i++) {
    const section = document.createElement("button");
    section.className = "list-group-item text-center";
    section.innerText = sections[i]["name"];
    section.addEventListener("click", function() {loadSection(i)});
    section.addEventListener("dblclick", function() {deleteSection(i)});
    sectionContainer.appendChild(section);
  }
  //Append section button
  const addSectionButton = document.createElement("button");
  addSectionButton.className = "list-group-item";
  addSectionButton.innerText = "Add Section";
  addSectionButton.addEventListener("click", addSection);
  sectionContainer.appendChild(addSectionButton);
}
createSections();

function saveFile()
{
  const documentName = document.getElementById("documentName").value;
  const documentContent = document.getElementById("documentContent").value;
  const documentDescription = document.getElementById("documentDescription").value;
  const section = {name: documentName, content: documentContent, description: documentDescription};
  sections[currentdocument] = section;
  createSections();
}

function addSection()
{
  sections.push({"name":"Untitled", "description":"", "content":""});
  currentdocument = sections.length - 1;
  createSections();
  document.getElementById("documentName").value = sections[currentdocument]["name"];
  document.getElementById("documentDescription").value = sections[currentdocument]["description"];
  document.getElementById("documentContent").value = sections[currentdocument]["content"];
}

function loadSection(index)
{
  currentdocument = index;
  document.getElementById("documentName").value = sections[currentdocument]["name"];
  document.getElementById("documentDescription").value = sections[currentdocument]["description"];
  document.getElementById("documentContent").value = sections[currentdocument]["content"];
}

function deleteSection(index)
{
  sections.splice(index, 1);
  if (currentdocument >= sections.length) {
    currentdocument = sections.length - 1;
  }
  createSections();
}

//#endregion

//#region Deal w/ChatGPT
function askGPT() {
  console.log(window.getSelection().toString());
  document.getElementById("ChatGPT-interface").style.display = "block";
  createChatGPTChat();
}

messages = [{ role: "system", content: "" }, { role: "assistant", content: "How can I help you?" }];

function createChatGPTChat() {
  //#region Create the ChatGPT chat interface
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
  textInput.id = "textInput";
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
  //#endregion

  //For real this time, deal with ChatGPT
  sendIcon.addEventListener("click", sendMessage);
}

function sendMessage()
{
  //System text
  documentName = document.getElementById("grandDocumentName").value;
  systemtext = "You are a helpful assistant made to answer questions about " + documentName + ". You are to directly cite documentName in your responses. Keep the conversation on questions about " + documentName + ". You will not be provided with the document as a whole, but will rather be provided a table of contents. \nIn order to answer a question, first identify the required section of " + documentName + " to use. This part can include any text, but must include: 'Therefore, the relevant section is: {section number}'. Afterwords, you will be given the text in this section of the document, and you will have to answer the question asked. \n Keep your responses short and conscise. WHen choosing the document to inspect, include some logic explaining why you looked at the document you chose to inspect. The table of contents is as follows:";
  for (let i = 0; i < sections.length; i++) {
    systemtext += "\n" + i + ": " + sections[i]["name"] + " - " + sections[i]["description"];
  }
  console.log(systemtext);

  messages[0]["content"] = systemtext;
  messages.push({role: "user", content: document.getElementById("textInput").value});
  fetch(`/apiKey`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      apiKey = data.apiKey;
      

      // Message 1: ask about the TOC and which section to visit
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
          documentChoice = data.choices[0].message.content;
          messagesTemp = messages;
          messagesTemp.push({ role: "Assistant", content: documentChoice });
          console.log(documentChoice);
          const regex = /relevant section is:\s*(\d+)/i;
          const match = documentChoice.match(regex);
          if (match) {
            const sectionNumber = Number(match[1]);
            messagesTemp.push({ role: "User", content: sections[sectionNumber]["content"] });
            // Message 2: ask about the content of the section
            fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                 "Authorization": "Bearer " + apiKey
              },
              body: JSON.stringify({
                  model: "gpt-4o-mini",
                  messages: messagesTemp
              })
            })
            .then(response => response.json())
            .then(data => {
              messages.push({role: "assistant", content: data.choices[0].message.content});
              createChatGPTChat();
            })
          } else {
            console.error("Section number not found in the response.");
          }
        })
    })
}

//#endregion