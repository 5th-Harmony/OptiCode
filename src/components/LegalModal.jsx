import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Scale, ExternalLink, Lock } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy'

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content legal-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="title-with-icon">
            <Scale size={20} className="icon-blue" />
            <h2>Legal Compliance & Governance</h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Legal Navigation Tabs */}
        <div className="legal-tabs">
          <button 
            className={`legal-tab ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText size={15} />
            <span>Terms of Use</span>
          </button>
          <button 
            className={`legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <ShieldCheck size={15} />
            <span>Privacy Policy (DPDP & GDPR)</span>
          </button>
        </div>

        {/* Scrollable Legal Document Body */}
        <div className="legal-document-body">
          {activeTab === 'terms' ? (
            <div className="legal-article">
              <h3>OptiCode Platform Terms of Use</h3>
              <p className="legal-meta">Effective Date: August 7, 2026 | Governing Laws: Indian IT Act 2000 & International Law</p>

              <h4>1. Acceptance of Terms</h4>
              <p>By accessing or utilizing the OptiCode AI Code Optimization platform, you acknowledge and agree to be bound by these Terms of Use and all applicable national and international cybersecurity laws, including the Indian Information Technology Act, 2000 and Section 43A data safety compliance rules.</p>

              <h4>2. Intellectual Property Rights</h4>
              <p>You retain 100% full ownership of all source code submitted to the OptiCode engine. OptiCode does not claim any copyright or IP ownership over original or AI-optimized code produced during your workspace sessions.</p>

              <h4>3. Acceptable Use Policy & Cyber Security Standards</h4>
              <p>Users must not submit malicious code, obfuscated malware, unauthorized zero-day exploit payloads, or illegal automated scrapers. Violations will be reported to CERT-In (Indian Computer Emergency Response Team) pursuant to Cyber Security Directions under Section 70B of the IT Act, 2000.</p>

              <h4>4. Limitation of Liability</h4>
              <p>OptiCode provides AI optimization suggestions on an "AS IS" basis. While our AST transformation engine ensures rigorous correctness, users are recommended to run full test suites before deploying optimized code to production environments.</p>

              <h4>5. Jurisdiction & Dispute Resolution</h4>
              <p>These terms shall be governed by and construed in accordance with the laws of the Republic of India. Disputes shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
            </div>
          ) : (
            <div className="legal-article">
              <h3>OptiCode Privacy & Data Protection Policy</h3>
              <p className="legal-meta">Compliance Standard: Digital Personal Data Protection Act 2023 (DPDP), GDPR (EU 2016/679) & CCPA</p>

              <h4>1. Data Fiduciary Notice (DPDP Act 2023)</h4>
              <p>OptiCode acts as a Data Fiduciary under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and Data Controller under EU GDPR. We collect only necessary telemetry (email, username, execution statistics) required to render IDE services.</p>

              <h4>2. Zero-Retention Code Processing Policy</h4>
              <p>Code snippets submitted for AI analysis are processed dynamically in isolated sandboxed workers. Source code is never retained on disk for third-party AI training sets or shared publicly without explicit consent.</p>

              <h4>3. Data Security & ISO/IEC 27001 Standards</h4>
              <p>All transmitted data is encrypted in transit using TLS 1.3 cryptographic protocols and at rest using AES-256 bit encryption in compliance with international ISO/IEC 27001 security controls.</p>

              <h4>4. User Rights (Right to Erasure & Correction)</h4>
              <p>Under the DPDP Act 2023 and GDPR Article 17, users possess the absolute right to request access, correction, or complete deletion of their account data and telemetry records by initiating an account closure request.</p>

              <h4>5. Contact Data Protection Officer (DPO)</h4>
              <p>For data privacy queries or compliance concerns, contact our designated Grievance Officer at <code>dpo@opticode.io</code> in compliance with Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules.</p>
            </div>
          )}
        </div>

        <div className="legal-modal-footer">
          <button className="btn-primary" onClick={onClose}>
            <span>I Understand & Agree</span>
          </button>
        </div>
      </div>
    </div>
  );
}
