import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# LangChain and RAG Imports
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain

# --- NEW: Google Gemini Imports ---
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
# Set your Google Gemini API Key here
os.environ["GOOGLE_API_KEY"] = "AIzaSyCi5htLl3Hrn4LuVcBlj5McyK2rLggLzu8"

UPLOAD_FOLDER = 'uploads'
VECTOR_DB_DIR = 'chroma_db' 

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- RAG INITIALIZATION (GEMINI) ---
# 1. Initialize the embedding model (converts text to numbers using Google's model)
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

# 2. Initialize the Vector Database
vector_store = Chroma(persist_directory=VECTOR_DB_DIR, embedding_function=embeddings)

# 3. Initialize the Language Model (gemini-1.5-flash is extremely fast and free)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

# 4. Create the AI's persona/prompt
system_prompt = (
    "You are a friendly, helpful AI Campus Assistant for MES MSPS College. "
    "Use the following pieces of retrieved context to answer the student's question. "
    "If the answer is not in the context, politely say that you don't know and "
    "advise them to contact the administration. Keep your answers clear, humanized, and concise."
    "\n\n"
    "Context:\n{context}"
)
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])


# --- HELPER FUNCTION: PROCESS DOCUMENTS ---
def process_and_store_document(filepath, filename):
    try:
        if filename.endswith('.pdf'):
            loader = PyPDFLoader(filepath)
        elif filename.endswith('.txt'):
            loader = TextLoader(filepath)
        else:
            return False, "Unsupported file format. Use PDF or TXT."
        
        docs = loader.load()

        # Split the document
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)

        # Store in ChromaDB
        vector_store.add_documents(splits)
        return True, "Document processed and stored in AI knowledge base."
    except Exception as e:
        return False, str(e)


# --- 1. UPLOAD ENDPOINT ---
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename) 
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        success, msg = process_and_store_document(filepath, filename)
        
        if success:
            return jsonify({"message": f"{filename} uploaded and learned by AI!", "filename": filename}), 200
        else:
            return jsonify({"error": f"Uploaded, but AI processing failed: {msg}"}), 500


# --- 2. CHAT ENDPOINT ---
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_question = data.get("question", "")

    if not user_question:
        return jsonify({"error": "No question provided"}), 400

    try:
        retriever = vector_store.as_retriever(search_kwargs={"k": 3}) 
        
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)

        response = rag_chain.invoke({"input": user_question})
        
        return jsonify({"answer": response["answer"]}), 200
    except Exception as e:
        print(f"Error during chat generation: {e}")
        return jsonify({"answer": "I'm sorry, I encountered an error connecting to my brain."}), 500


# --- 3. GET ALL FILES ENDPOINT ---
@app.route('/files', methods=['GET'])
def list_files():
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    file_data = [{"id": f, "name": f, "url": f"http://127.0.0.1:5000/uploads/{f}"} for f in files]
    return jsonify(file_data), 200


# --- 4. SERVE FILES ENDPOINT ---
@app.route('/uploads/<filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# --- 5. DELETE ENDPOINT ---
@app.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
    if os.path.exists(filepath):
        os.remove(filepath) 
        return jsonify({"message": f"{filename} deleted from file system"}), 200
    return jsonify({"error": "File not found"}), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)