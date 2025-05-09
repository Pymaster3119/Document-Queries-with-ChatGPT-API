//#region Deal w/Document

let sections = []
let currentdocument = 0

//Fetch the mpc lit
fetch('/sections')
  .then(r => r.json())
  .then(data => {
    console.log('raw sections.json →', data)
    sections = data.map(item => ({
      name:    item.name,
      imageData: item.path
        ? `/files/${item.path.replace(/^files\//, '')}`
        : null,
      content: item.content || ''
    }))

    const inlinePromises = sections.map((sec, idx) => {
      if (!sec.imageData) return Promise.resolve()
      console.log(`inlining section#${idx}`, sec.imageData)
      return fetch(sec.imageData)
        .then(res  => res.arrayBuffer())
        .then(buf  => {
          const b64  = btoa(
            new Uint8Array(buf)
              .reduce((s, byte) => s + String.fromCharCode(byte), '')
          )
          const mime = sec.imageData.endsWith('.pdf')
                     ? 'application/pdf'
                     : 'image/png'
          sections[idx].imageData = `data:${mime};base64,${b64}`
        })
    })

    Promise.all(inlinePromises)
      .then(() => createSections())
      .catch(err => {
        console.error('error inlining:', err)
        createSections()
      })
  })
  .catch(err => {
    console.error('loading sections failed:', err)
    sections = [{ name:'Untitled', imageData:null, content:'' }]
    createSections()
  })


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
  const imageData = document.getElementById("imagePreview").src;
  
  const currentImageData = (imageData && imageData.startsWith('data:')) ? imageData : sections[currentdocument].imageData;

  const section = {name: documentName, imageData: currentImageData};
  sections[currentdocument] = section;
  createSections();
}

function addSection()
{
  sections.push({"name":"Untitled", "imageData":null, "content":""});
  currentdocument = sections.length - 1;
  createSections();
  document.getElementById("documentName").value = sections[currentdocument]["name"];
  // Clear image preview
  const dropZoneElement = document.getElementById("imageDropZone");
  const thumbElement = document.getElementById("imagePreview");
  thumbElement.src = "";
  thumbElement.removeAttribute("alt");
  dropZoneElement.classList.remove("drop-zone--filled");

  document.getElementById("documentContent").value = sections[currentdocument]["content"];
}

function loadSection(index)
{
  currentdocument = index;
  document.getElementById("documentName").value = sections[currentdocument]["name"];
  // Load image data into preview
  const imageData = sections[currentdocument]["imageData"];
  const dropZoneElement = document.getElementById("imageDropZone");
  const thumbElement = document.getElementById("imagePreview");

  if (imageData) {
      thumbElement.src = imageData;
      thumbElement.alt = sections[currentdocument]["name"] + " preview";
      dropZoneElement.classList.add("drop-zone--filled");
  } else {
      thumbElement.src = "";
      thumbElement.removeAttribute("alt");
      dropZoneElement.classList.remove("drop-zone--filled");
  }
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

//#region Drag and Drop Logic
const dropZoneElement = document.getElementById("imageDropZone");
const inputElement = document.getElementById("imageFileInput");
const thumbElement = document.getElementById("imagePreview");

// Handle click to select file
dropZoneElement.addEventListener("click", (e) => {
  inputElement.click();
});

inputElement.addEventListener("change", (e) => {
  if (inputElement.files.length) {
    updateThumbnail(dropZoneElement, inputElement.files[0]);
  }
});

dropZoneElement.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZoneElement.classList.add("drop-zone--over");
});

["dragleave", "dragend"].forEach((type) => {
  dropZoneElement.addEventListener(type, (e) => {
    dropZoneElement.classList.remove("drop-zone--over");
  });
});

dropZoneElement.addEventListener("drop", (e) => {
  e.preventDefault();

  if (e.dataTransfer.files.length) {
    const file = e.dataTransfer.files[0];
    // Basic check for image type (can be expanded) or PDF
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
        inputElement.files = e.dataTransfer.files; // Assign dropped file to input
        updateThumbnail(dropZoneElement, file);
    } else {
        alert("Please drop an image or PDF file.");
    }
  }

  dropZoneElement.classList.remove("drop-zone--over");
});

/**
 * Updates the thumbnail on a drop zone element.
 * @param {HTMLElement} dropZoneElement The drop zone element.
 * @param {File} file The file selected.
 */
function updateThumbnail(dropZoneElement, file) {
  // First time - remove the prompt
  dropZoneElement.classList.add("drop-zone--filled");

  // Show thumbnail for image files
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      thumbElement.src = reader.result;
      thumbElement.alt = file.name; // Set alt text to file name
    };
  } else if (file.type === "application/pdf") {
      // For PDF, maybe show a generic PDF icon or just the file name
      thumbElement.src = ""; // Or path to a generic PDF icon
      thumbElement.alt = `PDF: ${file.name}`;
      const reader = new FileReader();
      reader.readAsDataURL(file); // Read PDF as data URL
      reader.onload = () => {
          thumbElement.src = reader.result; // This won't display PDF but stores the data
          thumbElement.alt = `PDF: ${file.name}`;
      };

  } else {
    dropZoneElement.classList.remove("drop-zone--filled"); // Revert state
    thumbElement.src = "";
    thumbElement.removeAttribute("alt");
    alert("File must be an image or PDF.");
  }
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

  //#region For real this time, deal with ChatGPT
  sendIcon.addEventListener("click", sendMessage);
}

function sendMessage()
{
  //System text
  documentName = document.getElementById("grandDocumentName").value;
  systemtext = "You are a helpful assistant made to answer questions about " + documentName + ". You are to directly cite documentName in your responses. Keep the conversation on questions about " + documentName + ". You will not be provided with the document as a whole, but will rather be provided a table of contents. \nIn order to answer a question, first identify the required section of " + documentName + " to use. This part can include any text, but must include: 'Therefore, the relevant section is: {section number}'. Afterwords, you will be given the text in this section of the document, and you will have to answer the question asked. \n Keep your responses short and conscise. WHen choosing the document to inspect, include some logic explaining why you looked at the document you chose to inspect. The table of contents is as follows:";
  for (let i = 0; i < sections.length; i++) {
    systemtext += "\n" + i + ": " + sections[i]["name"] + (sections[i]["imageData"] ? " (Has associated image/PDF)" : "");
  }
  console.log(systemtext);

  messages[0]["content"] = systemtext;
  const userMessageContent = document.getElementById("textInput").value;
  // Clear the input field visually after getting the value
  document.getElementById("textInput").value = '';
  messages.push({role: "user", content: userMessageContent});

  // --- Removed fetch('/apiKey') block ---

  // Message 1: ask about the TOC and which section to visit
  // Call your backend proxy instead of OpenAI directly
  fetch("/ask-openai", { // Changed URL
      method: "POST",
      headers: {
          "Content-Type": "application/json",
         // "Authorization": "Bearer " + apiKey // Removed Authorization header
      },
      body: JSON.stringify({ // Send messages and model in the body
          model: "gpt-4o-mini",
          messages: messages
      })
    })
    .then(response => {
        if (!response.ok) {
            // Handle HTTP errors (like 4xx, 5xx)
            return response.json().then(err => { throw new Error(err.error || `HTTP error! status: ${response.status}`) });
        }
        return response.json();
    })
    .then(data => {
      if (data.error) {
          throw new Error(data.error);
      }
      const documentChoice = data.content; // Adjusted to access content
      let messagesTemp = [...messages];
      messagesTemp.push({ role: "assistant", content: documentChoice });
      console.log(documentChoice);
      const regex = /relevant section is:\s*(\d+)/i;
      const match = documentChoice.match(regex);
      if (match) {
        const sectionNumber = Number(match[1]);
        if (sectionNumber >= 0 && sectionNumber < sections.length) {
            const imageData = sections[sectionNumber]["imageData"];
            console.log("Image Data being sent:", imageData);
            if (imageData) {
              messagesTemp.push({
                role: "user",
                content: [
                  { type: "text", text: "Here is the document image you should use to answer my question." },
                  { type: "image_url", image_url: { url: imageData } }
                ]
              });
            } else {
              messagesTemp.push({
                role: "user",
                content: "There is no image or PDF associated with the relevant section."
              });
            }
            // Message 2: ask about the content of the section
            fetch("/ask-openai", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  model: "gpt-4o-mini", 
                  messages: messagesTemp
              })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || `HTTP error! status: ${response.status}`) });
                }
                return response.json();
            })
            .then(data => {
              if (data.error) {
                  throw new Error(data.error);
              }
              messages.push({role: "assistant", content: data.content});
              createChatGPTChat();
            })
            .catch(error => { 
                console.error("Error fetching final answer:", error);
                messages.push({role: "assistant", content: `Sorry, I encountered an error: ${error.message}`});
                createChatGPTChat();
            });
        } else {
             console.error("Invalid section number received:", sectionNumber);
             messages.push({ role: "assistant", content: `Sorry, I received an invalid section number (${sectionNumber}). Please try again.` });
             createChatGPTChat();
        }
      } else {
        console.error("Section number not found in the response.");
        messages.push({ role: "assistant", content: documentChoice });
        messages.push({ role: "assistant", content: "I couldn't identify the section number. Please clarify or try rephrasing." });
        createChatGPTChat();
      }
    })
    .catch(error => {
        console.error("Error fetching section choice:", error);
        messages.push({role: "assistant", content: `Sorry, I encountered an error: ${error.message}`});
        createChatGPTChat();
    });
    //#endregion
}

//#endregion