import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Scale, ExternalLink, Lock } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy'

  if (!isOpen) return null;

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header-row">
          <div className="title-with-icon">
            <Scale size={20} className="icon-blue" />
            <h2>Legal Compliance &amp; Governance</h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
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
            <span>Privacy Policy (DPDP &amp; GDPR)</span>
          </button>
        </div>

        {/* Scrollable Legal Document Body */}
        <div className="legal-document-body">
          {activeTab === 'terms' ? (
            <div className="legal-article">
              <h3>OptiCode Platform Terms of Use</h3>
              <p className="legal-meta">Effective Date: August 8, 2026 | Governing Laws: Indian IT Act 2000 &amp; International Cybersecurity Standards</p>

              <h4>1. Acceptance of Terms</h4>
              <p>By accessing or utilizing the OptiCode AI Code Optimization platform, you acknowledge and agree to be bound by these Terms of Use and all applicable national and international cybersecurity laws, including the Indian Information Technology Act, 2000 and Section 43A data safety compliance rules.</p>

              <h4>2. Intellectual Property Rights</h4>
              <p>You retain 100% full ownership of all source code submitted to the OptiCode engine. OptiCode does not claim any copyright or IP ownership over original or AI-optimized code produced during your workspace sessions.</p>

              <h4>3. Acceptable Use Policy &amp; Cyber Security Standards</h4>
              <p>Users must not submit malicious code, obfuscated malware, unauthorized zero-day exploit payloads, or illegal automated scrapers. Violations will be reported to CERT-In (Indian Computer Emergency Response Team) pursuant to Cyber Security Directions under Section 70B of the IT Act, 2000.</p>

              <h4>4. Limitation of Liability</h4>
              <p>OptiCode provides AI optimization suggestions on an "AS IS" basis. While our AST transformation engine ensures rigorous correctness, users are recommended to run full test suites before deploying optimized code to production environments.</p>

              <h4>5. Service Level Agreement &amp; Platform Availability</h4>
              <p>We strive to maintain 99.9% platform availability. Maintenance windows and engine updates are scheduled during off-peak hours with prior telemetry notifications.</p>

              <h4>6. User Account Governance</h4>
              <p>Users are responsible for maintaining the confidentiality of their credentials. Any unauthorized access resulting from credential sharing must be reported to support immediately.</p>

              <h4>7. Jurisdiction &amp; Dispute Resolution</h4>
              <p>These terms shall be governed by and construed in accordance with the laws of the Republic of India. Disputes shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
            </div>
          ) : (
            <div className="legal-article">
              <h3>OptiCode Privacy &amp; Data Protection Policy</h3>
              <p className="legal-meta">Compliance Standard: Digital Personal Data Protection Act 2023 (DPDP), GDPR (EU 2016/679) &amp; CCPA</p>

              <h4>1. Data Fiduciary Notice (DPDP Act 2023)</h4>
              <p>OptiCode acts as a Data Fiduciary under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and Data Controller under EU GDPR. We collect only necessary telemetry (email, username, execution statistics) required to render IDE services.</p>

              <h4>2. Zero-Retention Code Processing Policy</h4>
              <p>Code snippets submitted for AI analysis are processed dynamically in isolated sandboxed workers. Source code is never retained on disk for third-party AI training sets or shared publicly without explicit consent.</p>

              <h4>3. Data Security &amp; ISO/IEC 27001 Standards</h4>
              <p>All transmitted data is encrypted in transit using TLS 1.3 cryptographic protocols and at rest using AES-256 bit encryption in compliance with international ISO/IEC 27001 security controls.</p>

              <h4>4. Cookie &amp; Local Storage Usage</h4>
              <p>We utilize client-side localStorage exclusively for persisting user preferences, active workspace themes, and local editor state. No third-party tracking cookies or behavioral profile scripts are loaded.</p>

              <h4>5. User Rights (Right to Erasure &amp; Correction)</h4>
              <p>Under the DPDP Act 2023 and GDPR Article 17, users possess the absolute right to request access, correction, or complete deletion of their account data and telemetry records by initiating an account closure request.</p>

              <h4>6. International Data Transfer Protocols</h4>
              <p>Any cross-border data transfers required for distributed sandbox processing comply strictly with DPDP Chapter 3 guidelines and Standard Contractual Clauses (SCCs).</p>

              <h4>7. Contact Data Protection Officer (DPO)</h4>
              <p>For data privacy queries or compliance concerns, contact our designated Grievance Officer at <code>dpo@opticode.io</code> in compliance with Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="legal-modal-footer">
          <button className="btn-primary" onClick={onClose}>
            <span>I Understand &amp; Agree</span>
          </button>
        </div>
      </div>
    </div>
  );
}
