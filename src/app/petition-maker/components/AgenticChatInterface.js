'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Edit2, Download, Loader, Check, RefreshCw, FileText } from 'lucide-react';
import './AgenticChatInterface.css';
import PDFViewer from '../../components/PDFViewer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AgenticChatInterface({ formData, caseType, onClose, onPetitionUpdate }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 8 });
  const [petitionData, setPetitionData] = useState(null);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [pendingContent, setPendingContent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [canRevoke, setCanRevoke] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation
    startConversation();
  }, []);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/petition/agentic/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_type: caseType,
          plaintiff_name: formData.plaintiff?.name || 'Plaintiff',
          defendant_name: formData.defendant?.name || 'Defendant',
          marriage_date: formData.caseDetails?.marriageDate,
          marriage_place: formData.caseDetails?.marriagePlace,
          children: formData.caseDetails?.children,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setMessages([
        {
          role: 'assistant',
          content: data.first_question,
          timestamp: new Date().toISOString(),
        },
      ]);
      setProgress(data.progress);
      
      // Initialize petition data
      if (data.petition_data) {
        setPetitionData(data.petition_data);
        if (onPetitionUpdate) {
          onPetitionUpdate(data.petition_data);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([
        {
          role: 'assistant',
          content: 'नमस्ते! म तपाईंको फिरादपत्र तयार गर्न मद्दत गर्नेछु। पहिले, मुद्दाको मुख्य विषय के हो?',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || waitingForApproval) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/petition/agentic/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Check if waiting for approval
      if (data.waiting_for_approval) {
        setWaitingForApproval(true);
        setPendingContent({
          content: data.generated_content,
          section: data.section,
          citations: data.citations || [],
          pdf_metadata: data.pdf_metadata || [],
        });
        setEditedContent(data.generated_content);
      }

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          waitingForApproval: data.waiting_for_approval,
          generatedContent: data.generated_content,
          citations: data.citations || [],
          pdf_metadata: data.pdf_metadata || [],
        },
      ]);

      // Check if this is the "additional_details" question - show Next button
      if (data.response && data.response.includes('के तपाईं थप केही जानकारी दिन चाहनुहुन्छ?')) {
        setShowNextButton(true);
      }

      // Update progress
      if (data.progress) {
        setProgress(data.progress);
      }

      // Update petition data
      if (data.petition_data) {
        setPetitionData(data.petition_data);
        if (onPetitionUpdate) {
          onPetitionUpdate(data.petition_data);
        }
      }

      // If conversation is complete
      if (data.completed) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: '✓ फिरादपत्र तयार भयो! अब तपाईं साक्षीहरूको विवरण थप्न Step 5 मा जान सक्नुहुन्छ।',
            timestamp: new Date().toISOString(),
          },
        ]);
        
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'माफ गर्नुहोस्, केही गलत भयो। कृपया फेरि प्रयास गर्नुहोस्।',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptContent = async () => {
    if (!pendingContent) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/petition/agentic/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          content: editMode ? editedContent : pendingContent.content,
          section: pendingContent.section,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept content');
      }

      const data = await response.json();

      // Add system message
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: '✓ Content accepted and added to document',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Reset approval state
      setWaitingForApproval(false);
      setPendingContent(null);
      setEditMode(false);
      setEditedContent('');
      
      // Update can_revoke state
      if (data.can_revoke !== undefined) {
        setCanRevoke(data.can_revoke);
      }

      // Update progress and petition data
      if (data.progress) {
        setProgress(data.progress);
      }
      if (data.petition_data) {
        setPetitionData(data.petition_data);
        if (onPetitionUpdate) {
          // Send the full petition data to parent
          const updateData = { ...data.petition_data };
          
          // Add formatted grounds if available
          if (data.formatted_grounds) {
            console.log('AgenticChatInterface - Received formatted_grounds from backend:', data.formatted_grounds);
            updateData.formatted_grounds = data.formatted_grounds;
          }
          
          console.log('AgenticChatInterface - Calling onPetitionUpdate with:', updateData);
          onPetitionUpdate(updateData);
        }
      }
    } catch (error) {
      console.error('Error accepting content:', error);
      alert('Failed to accept content');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateContent = async (feedback = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/petition/agentic/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          feedback: feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate content');
      }

      const data = await response.json();

      // Update pending content
      setPendingContent({
        content: data.generated_content,
        section: data.section,
        citations: data.citations || [],
        pdf_metadata: data.pdf_metadata || [],
      });
      setEditedContent(data.generated_content);

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          waitingForApproval: true,
          generatedContent: data.generated_content,
          citations: data.citations || [],
          pdf_metadata: data.pdf_metadata || [],
        },
      ]);
    } catch (error) {
      console.error('Error regenerating content:', error);
      alert('Failed to regenerate content');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeContent = async () => {
    if (!canRevoke) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/petition/agentic/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: '', // Not used but required by endpoint
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke content');
      }

      const data = await response.json();

      // Update pending content
      setPendingContent({
        content: data.generated_content,
        section: data.section,
        citations: data.citations || [],
        pdf_metadata: data.pdf_metadata || [],
      });
      setEditedContent(data.generated_content);
      setWaitingForApproval(true);
      setCanRevoke(false);

      // Add messages
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: '↶ Last accepted content has been revoked',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          waitingForApproval: true,
          generatedContent: data.generated_content,
          citations: data.citations || [],
          pdf_metadata: data.pdf_metadata || [],
        },
      ]);

      // Update progress and petition data
      if (data.progress) {
        setProgress(data.progress);
      }
      if (data.petition_data) {
        setPetitionData(data.petition_data);
        if (onPetitionUpdate) {
          const updateData = { ...data.petition_data };
          if (data.formatted_grounds) {
            updateData.formatted_grounds = data.formatted_grounds;
          }
          onPetitionUpdate(updateData);
        }
      }
    } catch (error) {
      console.error('Error revoking content:', error);
      alert('Failed to revoke content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const downloadDocument = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/petition/agentic/export/${sessionId}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firadpatra_${sessionId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const openPdfViewer = (pdfMeta) => {
    setSelectedPdf(pdfMeta);
    setPdfViewerOpen(true);
  };

  const handleNextStep = async () => {
    // Send "no" as answer to skip additional details
    setShowNextButton(false);
    setInputValue('no');
    await sendMessage();
  };

  return (
    <div className="agentic-chat-container">
      {/* PDF Viewer Modal */}
      <PDFViewer
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrl={selectedPdf?.file_url}
        citation={selectedPdf?.law_title}
        highlightText={selectedPdf?.snippet}
        pageNumber={selectedPdf?.page || 1}
      />
      <div className="chat-header">
        <div className="header-left">
          <Sparkles size={20} />
          <h3>AI Petition Assistant</h3>
        </div>
        <div className="header-right">
          <div className="progress-indicator">
            <span>Progress: {progress.current}/{progress.total}</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
          {showNextButton && (
            <button
              onClick={handleNextStep}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--ka-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                marginRight: '0.5rem',
              }}
            >
              Next →
            </button>
          )}
          {canRevoke && !waitingForApproval && (
            <button 
              className="revoke-btn" 
              onClick={revokeContent}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--ka-warning)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
              }}
            >
              ↶ Revoke Last
            </button>
          )}
          {progress.current === progress.total && (
            <button className="download-btn" onClick={downloadDocument}>
              <Download size={16} />
              Download
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.role === 'assistant' && (
                <div className="message-icon">
                  <Sparkles size={16} />
                </div>
              )}
              <div className="message-text">
                {message.content}
                
                {/* Show citations if available */}
                {message.citations && message.citations.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--ka-bg)', borderRadius: '8px', border: '1px solid var(--ka-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--ka-primary)', fontWeight: '600' }}>
                      <FileText size={16} />
                      <span>Legal Citations:</span>
                    </div>
                    {message.pdf_metadata && message.pdf_metadata.map((pdf, idx) => (
                      <div
                        key={idx}
                        onClick={() => openPdfViewer(pdf)}
                        style={{
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          background: 'var(--ka-surface)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: '1px solid transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--ka-primary)';
                          e.currentTarget.style.background = 'var(--ka-primary-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.background = 'var(--ka-surface)';
                        }}
                      >
                        <div style={{ fontWeight: '600', color: 'var(--ka-primary)', fontSize: '0.875rem' }}>
                          📄 {pdf.law_title} {pdf.section && `- दफा ${pdf.section}`}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--ka-text-secondary)', marginTop: '0.25rem' }}>
                          {pdf.snippet?.substring(0, 100)}...
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ka-text-muted)', marginTop: '0.25rem' }}>
                          Click to view PDF (Page {pdf.page})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show approval buttons if waiting for approval */}
                {message.waitingForApproval && index === messages.length - 1 && (
                  <div style={{ marginTop: '1rem' }}>
                    {editMode ? (
                      <div>
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows="8"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'var(--ka-bg)',
                            border: '1px solid var(--ka-border)',
                            borderRadius: '8px',
                            color: 'var(--ka-text)',
                            fontFamily: 'Noto Sans Devanagari, sans-serif',
                            fontSize: '0.9375rem',
                            marginBottom: '0.75rem',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={acceptContent}
                            disabled={isLoading}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: 'var(--ka-success)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Save & Accept
                          </button>
                          <button
                            onClick={() => {
                              setEditMode(false);
                              setEditedContent(pendingContent?.content || '');
                            }}
                            style={{
                              padding: '0.75rem 1.5rem',
                              background: 'var(--ka-border)',
                              color: 'var(--ka-text)',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={acceptContent}
                          disabled={isLoading}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--ka-success)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Check size={16} />
                          Accept
                        </button>
                        <button
                          onClick={() => setEditMode(true)}
                          disabled={isLoading}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--ka-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => regenerateContent()}
                          disabled={isLoading}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--ka-warning)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <RefreshCw size={16} />
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="message-icon">
                <Loader size={16} className="spinning" />
              </div>
              <div className="message-text typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={waitingForApproval ? "Please accept, edit, or regenerate the content above..." : "Type your answer here..."}
          rows="2"
          disabled={isLoading || waitingForApproval}
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading || waitingForApproval}
          className="send-btn"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
