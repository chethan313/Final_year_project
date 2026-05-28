# 🎓 AI Campus Assistant (RAG-Based)

## 📌 Overview

AI Campus Assistant is a web-based application developed to simplify access to academic information within educational institutions. The system helps students and administrative staff by providing a centralized platform to retrieve, understand, and manage university-related documents efficiently, replacing time-consuming manual communication methods.

The application uses **Retrieval-Augmented Generation (RAG)** technology to generate accurate and context-aware responses from uploaded academic documents such as:

* Fee Structures
* Syllabi
* Admission Guidelines
* Examination Rules
* Academic Notices

The platform supports multilingual interaction, conversational memory, voice-based queries, and secure document management for administrators.

---

# 🚀 Features

* 📄 Document-Based Question Answering
* 🔍 Semantic Search using Vector Database
* 🌐 Multilingual Response Generation
* 🎤 Voice-to-Query Support
* 💬 Conversational Chat Memory
* 🔐 Secure Admin Document Management
* ⚡ Fast and Accurate Information Retrieval
* 🤖 AI-Powered Response Generation

---

# 🛠️ Technologies Used

## Backend

* Python 3.10+
* LangChain
* FAISS / ChromaDB
* PyPDF2
* SpeechRecognition Library
* Google Gemini API / Mistral AI

## Frontend

* HTML
* CSS
* JavaScript

---

# 🧩 System Architecture

The system consists of multiple modules working together to provide intelligent academic assistance.

## Modules

### 1. Admin Dashboard & Document Management Module

* Upload and manage academic documents
* Maintain centralized document storage
* Secure access for administrators

### 2. Document Loader Module

* Extracts text from uploaded PDF and academic documents using PyPDF2

### 3. Vector Database Module

* Converts extracted text into embeddings
* Stores embeddings using FAISS / ChromaDB for semantic search

### 4. Query Processing Module

* Receives and processes user questions

### 5. Retrieval Module

* Finds the most relevant document sections related to user queries

### 6. LLM Integration Module

* Generates intelligent responses using AI models such as Gemini or Mistral AI

### 7. Multilingual Translation Module

* Supports communication in multiple languages

### 8. Chat History Memory Module

* Maintains conversational context for better interaction

### 9. Voice-to-Query Module

* Converts voice input into text queries using SpeechRecognition

### 10. Student Dashboard Module

* Provides students with easy access to academic information and chatbot interaction

---

# 📷 System Interface

## Student Dashboard and Documents Module

![Student Dashboard](https://github.com/user-attachments/assets/ff625af9-30aa-4dcc-89e5-1b58335f23e8)

---

# ⚙️ Workflow

1. Admin uploads academic documents
2. Documents are processed and converted into embeddings
3. Embeddings are stored in the vector database
4. User submits a text or voice query
5. Retrieval module searches relevant document chunks
6. AI model generates accurate context-aware responses
7. Response is displayed to the user through the web interface

---

# 🎯 Advantages

* Reduces manual communication effort
* Provides instant academic information access
* Improves student support services
* Enables context-aware AI responses
* Supports multilingual and voice interactions
* Enhances campus communication efficiency

---

# 📌 Future Enhancements

* Mobile application integration
* Real-time campus notifications
* Student authentication system
* Advanced analytics dashboard
* OCR support for scanned documents
* Integration with college ERP systems

---

# ✅ Conclusion

The **AI Campus Assistant (RAG-Based)** provides an intelligent and efficient solution for improving access to academic information within educational institutions. By combining Retrieval-Augmented Generation (RAG) technology with artificial intelligence, the system enables students to obtain accurate, context-based responses from official campus documents in a fast and reliable manner.

The application overcomes the limitations of traditional information retrieval methods by reducing manual searching, improving accessibility, and delivering instant responses to user queries.

With features such as:

* Document-based question answering
* Semantic search
* Multilingual interaction
* Voice-based query handling
* Conversational memory

the system becomes highly interactive, scalable, and user-friendly.

The centralized document management system enables administrators to maintain academic records efficiently, while the vector database and retrieval modules ensure accurate and relevant response generation.

Overall, the project enhances communication between students and institutions by providing quick and intelligent access to information related to admissions, syllabus, fees, examinations, and campus activities.

---

# 👨‍💻 Author

**Chethan P S**

---

