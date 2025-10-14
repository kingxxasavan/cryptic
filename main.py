import streamlit as st
from components.sidebar import sidebar_ui
from components.chat_ui import chat_ui
from components.pdf_handler import handle_pdf_upload
from core.explainer import explain_concept
from core.summarizer import summarize_text
from core.quizzer import generate_quiz

st.set_page_config(page_title="StudyBuddy", page_icon="🧠", layout="wide")

# Sidebar
selected_mode = sidebar_ui()

# Header
st.title("🧠 StudyBuddy - Your Smart Study Assistant")

# PDF Handler (optional upload)
st.markdown("### 📚 Upload a PDF (Optional)")
pdf_text = handle_pdf_upload()

# Main chat interface
st.divider()
chat_ui(selected_mode)

# Optional function preview
if pdf_text:
    st.divider()
    st.markdown("### ⚡ Try Quick Action on Uploaded PDF")
    if selected_mode == "Explainer":
        st.write(explain_concept(pdf_text[:1000]))
    elif selected_mode == "Summarizer":
        st.write(summarize_text(pdf_text[:1500]))
    elif selected_mode == "Quizzer":
        st.write(generate_quiz(pdf_text[:1000]))
