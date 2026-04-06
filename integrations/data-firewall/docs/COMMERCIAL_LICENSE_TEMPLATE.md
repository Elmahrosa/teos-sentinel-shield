# COMMERCIAL LICENSE AGREEMENT  
## Safe Ingestion Engine  

**Agreement Date**: [DATE]  
**Effective Date**: [EFFECTIVE DATE]  

---

## 🤝 Parties

**Licensor**:  
Elmahrosa International  
Represented by: Ayman Seif  
Email: ayman@teosegypt.com  
Address: [Alexandria, Egypt]  

**Licensee**:  
[COMPANY NAME]  
Represented by: [CONTACT NAME, TITLE]  
Email: [CONTACT EMAIL]  
Address: [COMPANY ADDRESS]  

*(Collectively, the "Parties")*

---

## 1. Definitions

| Term | Meaning |
|------|---------|
| **Software** | The "Safe Ingestion Engine" codebase, documentation, Docker configs, and related artifacts as of the Effective Date, hosted at https://github.com/Elmahrosa/safe-ingestion-engine |
| **Licensed Tier** | The specific license tier selected by Licensee: ☐ Starter ☐ Professional ☐ Enterprise ☐ Acquisition (see Section 3) |
| **Environment** | A distinct deployment context (e.g., development, staging, production) |
| **Support Period** | The duration during which Licensor provides updates, patches, or assistance per Section 5 |

---

## 2. Grant of License

### 2.1 License Rights
Subject to payment and compliance with this Agreement, Licensor grants Licensee a **non-exclusive, non-transferable, non-sublicensable** license to:

- Install, execute, and use the Software in [NUMBER] Environment(s)
- Modify the Software solely for Licensee's internal use and bug fixes
- Deploy the Software as part of Licensee's internal AI/RAG pipelines or customer-facing services *[check if allowed per tier]*

### 2.2 Restrictions
Licensee shall **not**, without prior written consent:

- Distribute, sublicense, lease, rent, or resell the Software (except as explicitly permitted in Acquisition tier)
- Remove proprietary notices, license headers, or attribution from source files
- Use the Software to provide a competing ingestion-as-a-service offering
- Reverse engineer or decompile compiled artifacts (where applicable)
- Share credentials, access tokens, or licensed binaries with third parties

### 2.3 Evaluation vs. Production
If this agreement follows an evaluation period, Licensee confirms that all evaluation-use restrictions (e.g., no production deployment) have been satisfied, and production use is now authorized per the Licensed Tier.

---

## 3. Licensed Tier & Fees

☐ **Starter License** — $990/year  
- ☐ 1 Environment (dev OR production)  
- ☐ ≤10,000 ingestion requests/month  
- ☐ Email support (48h response)  

☐ **Professional License** — $2,500/year  
- ☐ Unlimited Environments  
- ☐ ≤100,000 requests/month  
- ☐ Priority support (24h response) + 2h onboarding call  

☐ **Enterprise License** — $6,000/year  
- ☐ Unlimited Environments & requests  
- ☐ SLA-backed support (4h critical response)  
- ☐ Custom policy templates + quarterly security updates  

☐ **Acquisition / One-Time License** — $[AMOUNT] (one-time)  
- ☐ Full source code transfer + GitHub repo ownership transfer  
- ☐ Perpetual rights to version [VERSION] as of Effective Date  
- ☐ [30/60/90]-day transition support window  
- ☐ ☐ White-label rights (remove Elmahrosa branding)  
- ☐ ☐ Resale/embedding rights (specify scope): [DESCRIPTION]  

**Payment Terms**:  
- Invoiced in [USD/EGP], payable within [15/30] days of invoice date  
- Late payments incur 1.5% monthly interest  
- All fees exclude applicable VAT/taxes; Licensee responsible for withholding taxes if required  

**Renewal** (for annual tiers):  
- Auto-renews at then-current rates unless either party provides 30 days' written notice of non-renewal  
- Price increases capped at 15% year-over-year with 60 days' notice  

---

## 4. Intellectual Property

4.1 **Ownership**: Licensor retains all right, title, and interest in the Software, including all IP rights. No ownership is transferred except in a written Acquisition agreement specifying asset transfer.

4.2 **Licensee Modifications**: Any modifications made by Licensee to the Software:  
- ☐ Remain Licensee's property but licensed back to Licensor for maintenance purposes *(select if applicable)*  
- ☐ Must retain original license headers and attribution  
- ☐ May not be distributed externally without separate agreement  

4.3 **Feedback**: Licensee grants Licensor a non-exclusive, royalty-free license to use feedback, feature requests, or bug reports to improve the Software.

---

## 5. Support & Maintenance

| Tier | Response Time | Coverage | Updates Included |
|------|--------------|----------|-----------------|
| Starter | 48 business hours | Email only | Critical security patches |
| Professional | 24 business hours | Email + scheduled call | Patches + minor version updates |
| Enterprise | 4 hours (critical) | Email + Slack/Teams + monthly check-in | All patches + minor/major version updates during term |
| Acquisition | [AGREED] | [AGREED] | [AGREED — e.g., 90-day transition window] |

- Support excludes: custom development, third-party integration debugging, or issues caused by Licensee modifications
- Emergency support outside agreed hours: available at $[RATE]/hour (pre-approved)

---

## 6. Confidentiality

6.1 Both Parties agree to treat the terms of this Agreement, pricing, technical architecture, and any non-public information exchanged as **Confidential Information**.

6.2 Confidential Information may be disclosed only to employees/contractors with a need to know, bound by similar confidentiality obligations.

6.3 This obligation survives termination for [3] years.

*(Optional: Attach mutual NDA as Exhibit A)*

---

## 7. Disclaimer & Limitation of Liability

7.1 **No Warranty**: THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. LICENSOR DOES NOT WARRANT THAT THE SOFTWARE WILL MEET LICENSEE'S COMPLIANCE REQUIREMENTS (E.G., GDPR, HIPAA); LICENSEE IS RESPONSIBLE FOR VALIDATING REGULATORY FITNESS.

7.2 **Limitation of Liability**: TO THE MAXIMUM EXTENT PERMITTED BY LAW, LICENSOR'S TOTAL LIABILITY ARISING FROM THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID BY LICENSEE IN THE [12] MONTHS PRECEDING THE CLAIM. IN NO EVENT SHALL LICENSOR BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.

7.3 **Compliance Disclaimer**: While the Software implements security-forward patterns (SSRF protection, PII scrubbing, robots.txt enforcement), Licensee acknowledges that compliance depends on configuration, usage context, and evolving legal standards.

---

## 8. Term & Termination

8.1 **Term**: This Agreement commences on the Effective Date and continues for:  
- ☐ One (1) year (annual tiers), auto-renewing per Section 3  
- ☐ Perpetual (Acquisition tier, for the licensed version)  

8.2 **Termination for Cause**: Either Party may terminate with 30 days' written notice for material breach if uncured.

8.3 **Effect of Termination**:  
- Licensee shall cease all use of the Software and destroy/delete all copies  
- Licensor will provide a [30]-day wind-down period for production migrations (Professional/Enterprise tiers)  
- Sections 4 (IP), 6 (Confidentiality), 7 (Disclaimer), and 9 (General) survive termination  

---

## 9. General Provisions

9.1 **Governing Law**: This Agreement shall be governed by the laws of the Arab Republic of Egypt, without regard to conflict of law principles. Disputes shall be resolved exclusively in courts located in Alexandria, Egypt.

9.2 **Notices**: All notices shall be sent via email to the addresses above, with confirmation of receipt.

9.3 **Assignment**: Licensee may not assign this Agreement without Licensor's prior written consent. Licensor may assign in connection with a merger, acquisition, or sale of assets.

9.4 **Entire Agreement**: This document (including any attached Exhibits) constitutes the entire agreement between the Parties regarding the Software and supersedes all prior discussions.

9.5 **Amendments**: Any modifications must be in writing and signed by both Parties.

9.6 **Counterparts**: This Agreement may be executed in counterparts (including electronic signatures), each deemed an original.

---

## ✍️ Signatures

**Licensor**: Elmahrosa International  
Name: Ayman Seif  
Title: Founder & Steward  
Signature: _________________________  
Date: _________________________  

**Licensee**: [COMPANY NAME]  
Name: [CONTACT NAME]  
Title: [TITLE]  
Signature: _________________________  
Date: _________________________  

---

## 📎 Exhibits (Attach as Needed)

- **Exhibit A**: Mutual NDA (if executed separately)  
- **Exhibit B**: Technical Scope & Deployment Checklist  
- **Exhibit C**: Support SLA Details (response times, escalation path)  
- **Exhibit D**: Asset Transfer List (for Acquisition tier: repos, docs, credentials)  

> ℹ️ **Implementation Note**: After signing, Licensor will:  
> 1. Grant Licensee access to the licensed repository branch/tag  
> 2. Provide deployment runbook and support contacts  
> 3. Issue invoice and receipt upon payment confirmation  
