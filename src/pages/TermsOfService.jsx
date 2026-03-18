import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

const EFFECTIVE_DATE = 'March 17, 2026';
const COMPANY = 'Amethyst.gg';
const DOMAIN = 'amethyst.gg';
const SUPPORT = `support@amethyst.gg`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.tos-root {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  background: #03000d;
  color: #d4cfe8;
  padding: 0 0 80px;
}

.tos-hero {
  position: relative;
  padding: 60px 24px 48px;
  text-align: center;
  overflow: hidden;
  border-bottom: 1px solid rgba(245,200,66,.1);
}
.tos-hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.tos-hero-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(32px, 6vw, 52px);
  font-weight: 700;
  letter-spacing: .06em;
  background: linear-gradient(135deg, #f5c842 0%, #e8a800 40%, #c084fc 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
}
.tos-hero-sub {
  font-size: 13px;
  color: rgba(245,200,66,.45);
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  position: relative;
  z-index: 2;
}
.tos-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 20px;
  background: rgba(245,200,66,.07);
  border: 1px solid rgba(245,200,66,.18);
  font-size: 11px;
  font-weight: 700;
  color: rgba(245,200,66,.7);
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}
.tos-body {
  max-width: 820px;
  margin: 0 auto;
  padding: 40px 24px 0;
}
.tos-warning {
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(255,78,106,.06);
  border: 1px solid rgba(255,78,106,.2);
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,180,180,.8);
  line-height: 1.7;
}
.tos-warning strong { color: #ff8fa3; font-weight: 800; }
.tos-info {
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(245,200,66,.05);
  border: 1px solid rgba(245,200,66,.15);
  margin-bottom: 32px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(245,200,66,.7);
  line-height: 1.7;
}
.tos-info strong { color: #f5c842; font-weight: 800; }
.tos-section {
  margin-bottom: 8px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.02);
  transition: border-color .2s;
}
.tos-section:hover { border-color: rgba(245,200,66,.12); }
.tos-section-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  gap: 12px;
}
.tos-section-num {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: rgba(245,200,66,.4);
  letter-spacing: .1em;
  min-width: 28px;
}
.tos-section-title {
  flex: 1;
  font-size: 14px;
  font-weight: 800;
  color: #f0eaff;
  letter-spacing: .02em;
}
.tos-section-icon {
  color: rgba(245,200,66,.3);
  transition: color .2s;
  flex-shrink: 0;
}
.tos-section.open .tos-section-icon { color: rgba(245,200,66,.7); }
.tos-section-body {
  padding: 0 20px 20px 60px;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(212,207,232,.7);
}
.tos-section-body p { margin-bottom: 10px; }
.tos-section-body p:last-child { margin-bottom: 0; }
.tos-section-body ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 10px 0;
}
.tos-section-body ul li { padding-left: 16px; position: relative; }
.tos-section-body ul li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: rgba(245,200,66,.35);
  font-weight: 700;
}
.tos-section-body strong { color: #f0eaff; font-weight: 800; }
.tos-section-body .highlight { color: #f5c842; font-weight: 700; }
.tos-section-body .danger { color: #ff8fa3; font-weight: 700; }
.tos-footer {
  max-width: 820px;
  margin: 40px auto 0;
  padding: 24px;
  border-radius: 14px;
  background: rgba(245,200,66,.04);
  border: 1px solid rgba(245,200,66,.1);
  text-align: center;
}
.tos-footer p {
  font-size: 12px;
  color: rgba(240,234,255,.25);
  font-weight: 600;
  line-height: 1.7;
}
.tos-footer strong { color: rgba(245,200,66,.5); }
@keyframes tos-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.4; }
  95% { opacity:.4; }
  100%{ top:100%; opacity:0; }
}
.tos-scan {
  position:absolute; left:0; right:0; height:1px; z-index:3;
  background:linear-gradient(90deg,transparent,rgba(245,200,66,.15),transparent);
  animation:tos-scan 10s linear infinite; pointer-events:none;
}
`;

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: (
      <>
        <p>By accessing, registering on, or using <strong>{COMPANY}</strong> (the "Platform"), including participating in its case openings, games, and contests (each a "Contest"), you: (i) acknowledge that you have read and agree to be bound by these Terms of Service ("Terms"); (ii) accept all obligations, rules, and systems for each Contest in which you participate; and (iii) represent and warrant that you are authorized to accept these Terms.</p>
        <p>{COMPANY} may issue additional terms, rules, and conditions for specific Contests or features, which are incorporated into these Terms by reference. If you do not wish to be bound by these Terms, you must not access or use the Platform.</p>
        <p>{COMPANY} reserves the right to change these Terms at any time without prior notice. Changes are effective upon posting. If we make material changes, we will post a prominent notice on the Platform or notify you by email. <strong>Your continued use of the Platform after changes constitutes acceptance.</strong> If you do not agree to any changes, your sole remedy is to cease using the Platform. Any breach of these Terms immediately terminates your authorization to use the Platform.</p>
      </>
    ),
  },
  {
    title: 'Eligibility & Age Restrictions',
    content: (
      <>
        <p>No individual under the age of <strong>18</strong>, or under the age of majority in their jurisdiction (whichever is higher), may use the Platform regardless of any parental or guardian consent.</p>
        <p>By using the Platform, you represent and warrant that:</p>
        <ul>
          <li>You are at least 18 years of age or the age of majority in your jurisdiction</li>
          <li>Your use of the Platform is lawful in your jurisdiction</li>
          <li>You are the lawful owner of any payment method or cryptocurrency wallet used to make deposits on the Platform</li>
        </ul>
        <p>You are subject to the laws of the jurisdiction in which you reside and from which you access the Platform. <span className="danger">Void where prohibited or restricted by law.</span> {COMPANY} makes no representations that the Platform is appropriate or available for use in your jurisdiction. If you choose to access the Platform, you do so at your own risk and {COMPANY} cannot be held liable if laws applicable to you restrict or prohibit your participation.</p>
        <p>To verify eligibility, {COMPANY} may require additional documentation or identity verification at any time. {COMPANY} reserves the right to deny access to the Platform to anyone at its sole discretion.</p>
      </>
    ),
  },
  {
    title: 'Accounts',
    content: (
      <>
        <p>Only <strong>one (1) Account</strong> is permitted per person. If {COMPANY} determines that you have registered more than one Account, {COMPANY} reserves the right to suspend or terminate all associated Accounts, refuse any future use of the Platform, and withhold or revoke any prizes or balances.</p>
        <p>You are solely responsible for maintaining the confidentiality of your login credentials. It is a violation of these Terms to allow any other person to use your Account. If you believe your Account has been compromised, contact us immediately at <span className="highlight">{SUPPORT}</span>. {COMPANY} will not be responsible for any loss resulting from your failure to notify us of unauthorized use.</p>
        <p>You must provide accurate and complete registration information and keep it current. {COMPANY} reserves the right to suspend or terminate Accounts that have been inactive for <strong>180 days</strong> or longer. Upon account termination or cancellation, you will have no further access to your Account or anything associated with it, including any Virtual Currency or item balances.</p>
      </>
    ),
  },
  {
    title: 'No Account Transfer',
    content: (
      <>
        <p>Your Account is non-transferable. You may not allow any other person, including any person under the age of 18, to use or access your Account. You accept full responsibility for any unauthorized use of the Platform through your Account.</p>
        <p>{COMPANY} will not be liable for any loss incurred as a result of someone else using your Account, with or without your knowledge, unless you have previously notified {COMPANY} that your credentials have been compromised. Any person found to have violated this section may be reported to relevant authorities and will forfeit their Account and all associated balances.</p>
      </>
    ),
  },
  {
    title: 'Virtual Currency & Wallet',
    content: (
      <>
        <p>By depositing cryptocurrency or receiving credits on the Platform ("Wallet"), you acknowledge and agree that:</p>
        <ul>
          <li>Virtual Currency (displayed by the coin icon on the Platform) is not real money and has no real-world monetary value outside of the Platform</li>
          <li>Virtual Currency is a limited, non-transferable license to use certain Platform features and is not your property — it belongs to {COMPANY} at all times</li>
          <li>Virtual Currency cannot be transferred between users and cannot be exchanged for real currency except where explicitly provided by the Platform's withdrawal features</li>
          <li>Virtual Currency balances may be modified, reduced, or eliminated by {COMPANY} at any time at its sole discretion, subject to applicable withdrawal rights</li>
          <li>The Platform is not a banking institution and does not hold funds in trust</li>
        </ul>
        <p>You may receive free credits through promotional features such as rain bonuses, faucets, or free daily cases, subject to eligibility requirements and these Terms. Free credits are provided at {COMPANY}'s sole discretion and may be modified or discontinued at any time.</p>
      </>
    ),
  },
  {
    title: 'Cryptocurrency Deposits & Payments',
    content: (
      <>
        <p>The Platform accepts cryptocurrency as the sole payment method for purchasing Virtual Currency. By making any deposit, you agree that:</p>
        <ul>
          <li>You are the lawful owner of any cryptocurrency deposited and represent that all funds originate from legitimate, lawful sources</li>
          <li>Cryptocurrency transactions are <span className="danger">irreversible by nature</span> — once confirmed on the blockchain, deposits cannot be recalled or reversed by any party</li>
          <li>You are solely responsible for all blockchain transaction fees, network fees, and gas fees</li>
          <li>Exchange rate fluctuations between cryptocurrency and any reference currency are entirely your responsibility</li>
          <li>Minimum deposit limits apply as displayed on the Platform and are subject to change at any time</li>
          <li>Deposits that cannot be verified, appear suspicious, or are flagged for compliance review may be held, delayed, or refused at {COMPANY}'s sole discretion</li>
        </ul>
        <p>{COMPANY} is not a financial institution, money services business, or cryptocurrency exchange. Deposits are payments for entertainment services only.</p>
      </>
    ),
  },
  {
    title: 'No Refund Policy',
    content: (
      <>
        <p><strong>ALL CRYPTOCURRENCY DEPOSITS, PURCHASES OF VIRTUAL CURRENCY, AND TRANSACTIONS ON THE PLATFORM ARE FINAL. NO REFUNDS WILL BE ISSUED UNDER ANY CIRCUMSTANCES.</strong></p>
        <ul>
          <li>All purchases of Virtual Currency and access to Platform features are non-refundable once confirmed</li>
          <li>No refunds will be issued due to dissatisfaction with outcomes, account suspension, termination, or Platform changes</li>
          <li>No refunds will be issued for unused Virtual Currency balances at the time of account closure or termination</li>
          <li>The irreversible nature of cryptocurrency transactions means {COMPANY} is technically unable to return funds in any circumstance</li>
        </ul>
        <p>Attempting to reverse, dispute, or fraudulently recover any cryptocurrency payment constitutes a material breach of these Terms and will result in immediate permanent account termination, forfeiture of all balances, and may result in legal action.</p>
      </>
    ),
  },
  {
    title: 'Withdrawals & Limits',
    content: (
      <>
        <p>Withdrawal of any redeemable cryptocurrency balance is subject to the following:</p>
        <ul>
          <li>Minimum and maximum withdrawal limits apply as displayed on the Platform and are subject to change at any time without notice</li>
          <li>Withdrawals are processed to the cryptocurrency wallet address you provide — {COMPANY} bears no responsibility for funds sent to incorrect or invalid addresses</li>
          <li>Processing times vary based on blockchain network conditions and are not guaranteed</li>
          <li>{COMPANY} reserves the right to delay, hold, or deny any withdrawal request under review for compliance, suspected fraud, or potential Terms violation</li>
          <li>Withdrawals may require identity or source-of-funds verification before processing</li>
          <li>Any Virtual Currency balance that has not been legitimately earned through Platform activities is not eligible for withdrawal</li>
        </ul>
        <p>Withdrawal eligibility is a privilege and may be suspended or revoked at {COMPANY}'s sole discretion without notice or liability.</p>
      </>
    ),
  },
  {
    title: 'Contests, Case Openings & Features',
    content: (
      <>
        <p>The Platform offers case openings, contests, and other chance-based entertainment features. By participating, you acknowledge that:</p>
        <ul>
          <li>All outcomes are determined by a provably fair random number generation ("RNG") system — past results have no influence on future outcomes</li>
          <li>Displayed odds and drop rates are accurate at the time of display but are subject to change at any time without notice</li>
          <li>The Platform does not guarantee any specific outcome, item, or result</li>
          <li>There is no guaranteed strategy or method to predict or influence outcomes</li>
          <li>Contest rules may change from time to time at {COMPANY}'s sole discretion — it is your responsibility to review current rules before participating</li>
        </ul>
        <p>{COMPANY} reserves the right to modify, cancel, or suspend any contest or feature at any time without notice. Results and winners are determined by {COMPANY} at its sole discretion and such determinations are final and binding. Any decision by {COMPANY} regarding contest outcomes, prize awards, or result adjustments shall stand as final.</p>
        <p>{COMPANY} also reserves the right to invalidate any contest result or disqualify any participant to prevent abusive, unfair, or potentially unlawful activity.</p>
      </>
    ),
  },
  {
    title: 'Items, Icons & Third-Party IP',
    content: (
      <>
        <p>The Platform displays visual representations of items and icons that may reference assets associated with third-party games and platforms including but not limited to Valve Corporation (CS:GO/CS2), Roblox Corporation, and others. You expressly acknowledge and agree that:</p>
        <ul>
          <li><strong>{COMPANY} is in no way affiliated with, endorsed by, sponsored by, or partnered with</strong> any third-party IP holder whose content may be referenced on the Platform</li>
          <li>All third-party brand names, trademarks, logos, and item names are the sole property of their respective owners</li>
          <li>Third-party item imagery is used solely as a visual reference to indicate relative value tiers within the Platform</li>
          <li><span className="danger">No actual third-party items, game assets, accounts, skins, or digital goods are delivered, transferred, or redeemed</span> through the Platform under any circumstances — users receive Virtual Currency value only</li>
          <li>The use of third-party imagery does not constitute any claim of ownership, authorization, or endorsement by the respective IP holders</li>
          <li>{COMPANY} will comply promptly with valid takedown requests from legitimate IP holders</li>
        </ul>
        <p>If you are a representative of a third-party IP holder with concerns regarding content on the Platform, please contact us at <span className="highlight">{SUPPORT}</span>.</p>
      </>
    ),
  },
  {
    title: 'UI & Interface Errors',
    content: (
      <>
        <p>Interface glitches, visual errors, or display manipulation do not in any way entitle any user to a specific item, outcome, or prize. All outcomes are generated exclusively by the Platform's provably fair RNG system and awarded accordingly.</p>
        <p>You agree that the outcome will be determined solely by the RNG system result and that any user interface errors, display discrepancies, or visual anomalies do not entitle you to any item or value not confirmed by the underlying system. {COMPANY} reserves the right to correct any erroneously credited items or balances at any time.</p>
        <p>Any items or Virtual Currency mistakenly credited to your Account remain {COMPANY}'s property and will be deducted upon confirmation of the error. Any erroneously credited amounts already withdrawn constitute a debt owed to {COMPANY}.</p>
      </>
    ),
  },
  {
    title: 'Responsible Gaming & Self-Exclusion',
    content: (
      <>
        <p>{COMPANY} is committed to promoting responsible use of the Platform. You acknowledge that:</p>
        <ul>
          <li>You should only deposit amounts you can afford to spend entirely without financial hardship</li>
          <li>The Platform is for entertainment purposes only — do not treat it as a source of income or financial investment</li>
          <li>Past results do not predict or guarantee future outcomes</li>
          <li>You are solely responsible for monitoring and controlling your own spending on the Platform</li>
        </ul>
        <p><strong>Self-Exclusion:</strong> If you wish to take a break or limit your activity, contact us at <span className="highlight">{SUPPORT}</span> to request account cooling-off periods or self-exclusion. Self-exclusion requests will be processed within 48 hours. Creating new accounts to circumvent a self-exclusion constitutes a material breach of these Terms.</p>
        <p>Deposit limits may be applied at your request. If you or someone you know may have a problem with compulsive spending behavior, we encourage seeking help from the <strong>National Council on Problem Gambling</strong> at <strong>ncpgambling.org</strong> or by calling <strong>1-800-522-4700</strong>.</p>
      </>
    ),
  },
  {
    title: 'Account Suspension & Termination',
    content: (
      <>
        <p><strong>{COMPANY} may terminate or suspend access to the Platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.</strong></p>
        <p>Without limiting the foregoing, accounts may be terminated for:</p>
        <ul>
          <li>Any violation of these Terms</li>
          <li>Suspected fraud, cheating, bot usage, or exploitation of Platform systems</li>
          <li>Money laundering or use of funds from illegitimate sources</li>
          <li>Chargebacks, payment disputes, or fraudulent payment activity</li>
          <li>Abusive, threatening, or harassing behavior toward other users or staff</li>
          <li>Creating multiple accounts to circumvent bans or restrictions</li>
          <li>Account inactivity of 180 days or longer</li>
          <li>Any conduct {COMPANY} determines, in its sole discretion, to be harmful to the Platform or its users</li>
        </ul>
        <p>Upon termination, <span className="danger">all Virtual Currency, non-withdrawable items, and account data are permanently forfeited</span> with no obligation to compensate. Any withdrawable balance under investigation at the time of termination may be held or forfeited depending on the circumstances. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
        <p>If you wish to terminate your account voluntarily, contact us at <span className="highlight">{SUPPORT}</span>.</p>
      </>
    ),
  },
  {
    title: 'Prohibited Conduct',
    content: (
      <>
        <p>As a condition of your use of the Platform, you agree not to:</p>
        <ul>
          <li>Falsify personal information required to open an account, make a deposit, or claim a prize</li>
          <li>Use bots, scripts, automation tools, scrapers, spiders, or any unauthorized software</li>
          <li>Exploit bugs, glitches, or unintended features for personal gain</li>
          <li>Attempt to probe, scan, hack, reverse-engineer, or interfere with the Platform or its systems</li>
          <li>Create more than one Account or create accounts to circumvent bans or restrictions</li>
          <li>Use a VPN, proxy, or any method to circumvent geographic restrictions</li>
          <li>Sell, transfer, or share your Account or any associated attributes</li>
          <li>Engage in any form of money laundering, financial fraud, or use of illegitimate funds</li>
          <li>Provide payment information or cryptocurrency belonging to a third party</li>
          <li>Impersonate {COMPANY} staff or any other person or entity</li>
          <li>Post or transmit harmful, abusive, obscene, illegal, or spam content</li>
          <li>Engage in any conduct that {COMPANY} determines to be contrary to the spirit or intent of these Terms</li>
          <li>Farm or stack free rewards contrary to their intended purpose</li>
        </ul>
        <p>Violations may result in immediate account termination, forfeiture of all balances, and legal action. {COMPANY} reserves the right to report violations to relevant authorities and pursue civil or criminal proceedings.</p>
      </>
    ),
  },
  {
    title: 'Anti-Money Laundering & Source of Funds',
    content: (
      <>
        <p>You represent and warrant that all funds deposited on the Platform originate exclusively from legitimate, lawful sources. You agree that:</p>
        <ul>
          <li>You will not use the Platform to launder money or conceal proceeds of any criminal activity</li>
          <li>{COMPANY} reserves the right to request documentation verifying the source of your funds at any time</li>
          <li>Failure to provide requested documentation may result in account suspension and withholding of funds pending investigation</li>
          <li>{COMPANY} may report suspicious activity to relevant authorities as required by applicable law</li>
          <li>Accounts suspected of financial misconduct will be frozen pending investigation with no obligation to release funds during that period</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Geographic Restrictions',
    content: (
      <>
        <p>The Platform is not available in all jurisdictions. By using the Platform, you represent that your participation is lawful in your jurisdiction. You are solely responsible for determining whether use of the Platform complies with your local laws.</p>
        <p>Use of a VPN, proxy, or any other method to circumvent geographic restrictions constitutes a material breach of these Terms and will result in immediate account termination and permanent forfeiture of all balances.</p>
        <p>{COMPANY} reserves the right to restrict or block access from any region at any time without notice.</p>
      </>
    ),
  },
  {
    title: 'Links to Third-Party Services',
    content: (
      <>
        <p>The Platform may contain links to third-party websites or services not owned or controlled by {COMPANY}. {COMPANY} has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>
        <p>You acknowledge that {COMPANY} shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with your use of or reliance on any third-party content, goods, or services. We strongly advise you to read the terms and privacy policies of any third-party sites you visit.</p>
      </>
    ),
  },
  {
    title: 'Disclaimer of Warranties',
    content: (
      <>
        <p><strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. YOUR USE OF THE PLATFORM IS ENTIRELY AT YOUR OWN RISK.</strong></p>
        <p>To the fullest extent permitted by applicable law, {COMPANY} disclaims all warranties including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. {COMPANY} does not warrant that the Platform will be uninterrupted, error-free, secure, or free from viruses or other harmful components.</p>
        <p>{COMPANY} makes no representations regarding the accuracy, reliability, or completeness of any content on the Platform, nor any warranty regarding the profitability or outcome of any Platform activity.</p>
      </>
    ),
  },
  {
    title: 'Limitation of Liability',
    content: (
      <>
        <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</strong> arising out of or related to your use of the Platform, including loss of cryptocurrency, Virtual Currency, data, profits, or any other tangible or intangible losses.</p>
        <p>In no event shall {COMPANY}'s total aggregate liability to you for any direct damages exceed the <span className="highlight">total amount of cryptocurrency you deposited in the 30 days preceding the event giving rise to the claim</span>.</p>
        <p>{COMPANY} is not liable for losses arising from cryptocurrency market fluctuations, blockchain network failures, incorrect wallet addresses provided by you, unauthorized account access resulting from your failure to secure credentials, or Platform downtime.</p>
        <p>In jurisdictions that do not allow certain limitations of liability, the above limitations apply to the fullest extent permitted by law.</p>
      </>
    ),
  },
  {
    title: 'Service & Maintenance',
    content: (
      <>
        <p>{COMPANY} conducts maintenance on its systems periodically to ensure security and integrity. Some or all features may be unavailable during maintenance. While we will attempt to provide advance notice, you agree that {COMPANY} may perform updates with or without notifying you.</p>
        <p>{COMPANY} reserves the right to modify or discontinue any aspect of the Platform at any time, including the availability of specific features, contests, or content, with or without notice and without liability to you or any third party. All issues with the Platform can be reported to <span className="highlight">{SUPPORT}</span>.</p>
      </>
    ),
  },
  {
    title: 'Intellectual Property & Limited License',
    content: (
      <>
        <p>All original content on the Platform — including Platform design, software, original graphics, logos, and user interface — is the exclusive property of {COMPANY} and protected by applicable intellectual property laws. {COMPANY} does not claim ownership of intellectual property owned by third parties.</p>
        <p>You are granted a limited, non-exclusive, non-transferable, revocable personal license to access and use the Platform for private, non-commercial entertainment purposes only. You may not:</p>
        <ul>
          <li>Copy, reproduce, modify, or create derivative works from any Platform content</li>
          <li>Reverse engineer, decompile, or attempt to access the source code of the Platform</li>
          <li>Remove, alter, or obscure any trademark, copyright, or proprietary notices</li>
          <li>Sell, sublicense, assign, or distribute any Platform features or content to any third party</li>
          <li>Use the Platform in any manner prohibited by applicable law</li>
        </ul>
        <p>By participating in the Platform, you agree to the use by {COMPANY} of your username and activity for promotional purposes worldwide, in perpetuity, in any form of media, without compensation, except where prohibited by law.</p>
        <p>All feedback, suggestions, or ideas you submit to {COMPANY} become the exclusive property of {COMPANY} and may be used without restriction or compensation to you.</p>
      </>
    ),
  },
  {
    title: 'Privacy & Data',
    content: (
      <>
        <p>Your use of the Platform is governed by our Privacy Policy, incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your information as described therein.</p>
        <p>{COMPANY} collects and processes personal data including email addresses, usage data, transaction records, and cryptocurrency wallet addresses solely for the purposes of operating the Platform, processing transactions, and complying with applicable law. We may share data with service providers necessary for Platform operation and with law enforcement as required by law. We do not sell your personal data to unrelated third parties for marketing purposes.</p>
        <p>No one under age 13 may provide any personal information to the Platform. If we learn we have collected information from a child under 13 without parental consent, we will delete that information immediately. Contact us at <span className="highlight">{SUPPORT}</span> if you believe we may have such information.</p>
      </>
    ),
  },
  {
    title: 'Governing Law & Dispute Resolution',
    content: (
      <>
        <p>These Terms shall be governed by and construed in accordance with the laws of the <strong>State of Delaware</strong>, without regard to its conflict of law provisions. You agree that Delaware law governs all matters relating to your use of the Platform, regardless of where you reside or access the Platform from.</p>
        <p><strong>BINDING ARBITRATION:</strong> Any dispute arising out of or relating to these Terms or your use of the Platform shall be resolved exclusively by binding individual arbitration. You waive your right to a jury trial and your right to participate in any class action lawsuit or class-wide arbitration.</p>
        <p>The parties will first attempt to resolve any dispute in good faith within 30 days of written notice. If no resolution is reached, arbitration shall proceed under the rules of the American Arbitration Association (AAA), seated in the State of Delaware.</p>
        <p>If the class action waiver is found unenforceable, the arbitration clause shall be null and void in its entirety and disputes shall be resolved exclusively in the state or federal courts located in the <strong>State of Delaware</strong>, and you hereby consent to the personal jurisdiction of such courts. {COMPANY} retains the right to seek injunctive relief in any court of competent jurisdiction to protect its intellectual property or prevent irreparable harm.</p>
      </>
    ),
  },
  {
    title: 'Indemnification',
    content: (
      <>
        <p>You agree to defend, indemnify, and hold harmless {COMPANY}, its officers, directors, employees, contractors, and agents from and against any and all claims, liabilities, damages, judgments, losses, costs, and fees (including reasonable attorneys' fees) arising out of or relating to:</p>
        <ul>
          <li>Your violation of these Terms</li>
          <li>Your use or misuse of the Platform</li>
          <li>Your violation of any third-party rights</li>
          <li>Any content you submit or transmit through the Platform</li>
          <li>Any fraudulent, illegal, or unauthorized activity conducted through your Account</li>
          <li>Any cryptocurrency transactions you initiate through the Platform</li>
        </ul>
        <p>{COMPANY} reserves the right, at your expense, to assume exclusive defense of any matter for which you are required to indemnify {COMPANY}. You agree to cooperate with {COMPANY}'s defense of such claims. The provisions of this section survive termination of your Account.</p>
      </>
    ),
  },
  {
    title: 'General Provisions',
    content: (
      <>
        <p><strong>Force Majeure:</strong> {COMPANY} shall not be liable for any delay or failure to perform resulting from causes outside its reasonable control, including acts of God, war, terrorism, riots, fire, floods, network infrastructure failures, or other force majeure events.</p>
        <p><strong>No Joint Venture:</strong> No joint venture, partnership, employment, or agency relationship exists between you and {COMPANY} as a result of these Terms or your use of the Platform.</p>
        <p><strong>Assignment:</strong> {COMPANY} may assign its rights and obligations under these Terms at any time without your consent. You may not assign any rights or obligations under these Terms without {COMPANY}'s prior written consent.</p>
        <p><strong>Waiver & Severability:</strong> No failure by {COMPANY} to exercise any right under these Terms shall constitute a waiver. If any provision is found unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall remain in full force and effect.</p>
        <p><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and {COMPANY} regarding your use of the Platform and supersede all prior agreements. Any waiver must be in writing and signed by {COMPANY}.</p>
        <p><strong>Supplemental Policies:</strong> {COMPANY} may publish additional policies for specific features or promotions. Your use of such features is subject to those policies and these Terms.</p>
      </>
    ),
  },
  {
    title: 'Contact Information',
    content: (
      <>
        <p>For any questions, concerns, or requests regarding these Terms:</p>
        <ul>
          <li><strong>Operator:</strong> {COMPANY}</li>
          <li><strong>Website:</strong> {DOMAIN}</li>
          <li><strong>Support:</strong> {SUPPORT}</li>
          <li><strong>Responsible Gaming:</strong> {SUPPORT}</li>
          <li><strong>IP / Takedown Requests:</strong> {SUPPORT}</li>
        </ul>
        <p>These Terms were last updated on <strong>{EFFECTIVE_DATE}</strong>. The most current version always governs your use of the Platform.</p>
      </>
    ),
  },
];

export default function TermsOfService() {
  const [openIdx, setOpenIdx] = useState(null);
  const toggle = (i) => setOpenIdx(prev => prev === i ? null : i);

  return (
    <div className="tos-root">
      <style>{CSS}</style>

      <div className="tos-hero">
        <div className="tos-scan" />
        <div className="tos-hero-orb" style={{ width: 500, height: 500, top: '-30%', left: '-10%', background: 'radial-gradient(circle,rgba(157,111,255,.1) 0%,transparent 70%)' }} />
        <div className="tos-hero-orb" style={{ width: 400, height: 400, bottom: '-20%', right: '-5%', background: 'radial-gradient(circle,rgba(245,200,66,.08) 0%,transparent 70%)' }} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
          <div className="tos-badge">
            <Shield style={{ width: 11, height: 11 }} />
            Legal Agreement
          </div>
        </motion.div>
        <motion.h1 className="tos-hero-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, delay: .1 }}>
          Terms of Service
        </motion.h1>
        <motion.p className="tos-hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>
          {COMPANY} · Effective {EFFECTIVE_DATE}
        </motion.p>
      </div>

      <div className="tos-body">
        <motion.div className="tos-warning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
          <strong>PLEASE READ THESE TERMS CAREFULLY.</strong> By accessing or using {COMPANY}, you agree to be legally bound by these Terms in their entirety. These Terms contain critical provisions including a no-refund policy on cryptocurrency deposits, limitations of liability, a binding arbitration clause, and geographic restrictions. If you do not agree, do not use this Platform.
        </motion.div>

        <motion.div className="tos-info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }}>
          <strong>NOTICE:</strong> {COMPANY} is an entertainment platform. Cryptocurrency deposited is payment for entertainment features. Only deposit what you can afford to spend. For responsible gaming support contact {SUPPORT} or call <strong>1-800-522-4700</strong>.
        </motion.div>

        {SECTIONS.map((s, i) => (
          <motion.div
            key={i}
            className={`tos-section${openIdx === i ? ' open' : ''}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .37 + i * .02 }}
          >
            <button className="tos-section-header" onClick={() => toggle(i)}>
              <span className="tos-section-num">§{String(i + 1).padStart(2, '0')}</span>
              <span className="tos-section-title">{s.title}</span>
              <span className="tos-section-icon">
                {openIdx === i ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
              </span>
            </button>
            {openIdx === i && (
              <motion.div className="tos-section-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .18 }}>
                {s.content}
              </motion.div>
            )}
          </motion.div>
        ))}

        <motion.div className="tos-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .9 }}>
          <p>
            These Terms constitute the entire agreement between you and <strong>{COMPANY}</strong> regarding your use of the Platform.<br />
            If any provision is found unenforceable, the remaining provisions remain in full force.<br />
            Your continued use of the Platform constitutes acceptance of these Terms.<br /><br />
            <strong>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</strong>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
