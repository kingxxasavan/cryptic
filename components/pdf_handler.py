import streamlit as st
from PyPDF2 import PdfReader

def handle_pdf_upload():
    """Handles PDF upload and returns extracted text."""
    uploaded_file = st.file_uploader("📚 Upload your study material (PDF)", type=["pdf"])
    pdf_text = ""

    if uploaded_file:
        with st.spinner("Extracting text from PDF..."):
            reader = PdfReader(uploaded_file)
            for page in reader.pages:
                pdf_text += page.extract_text() or ""
        st.success("✅ PDF processed successfully!")
        st.text_area("Extracted Text:", pdf_text[:2000], height=200)
    return pdf_text
