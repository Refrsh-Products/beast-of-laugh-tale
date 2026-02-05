# FRESHR - User Stories & Requirements

## AI-Powered Learning Platform

**Version:** 1.0 - Production Ready  
**Last Updated:** January 2026  
**Document Status:** Final - Ready for Development

---

## Table of Contents

1. [Students](#students)
2. [Admin](#admin)
3. [Free vs Paid Plan Comparison](#free-vs-paid-plan-comparison)
4. [Technical Specifications](#technical-specifications)
5. [Phase Roadmap](#phase-roadmap)

---

## Students

### **Account Security**

- As a student, I want to be able to reset my password via email if I forget it, so I can regain access to my account.
- As a student, I want to receive a secure password reset link that expires after 24 hours, so unauthorized users cannot access my account.
- As a student, I want to be required to create a strong password (minimum 8 characters, including uppercase, lowercase, and numbers), so my account remains secure.
- As a student, I want to enable two-factor authentication (2FA) on my account, so I have an additional layer of security.
- As a student, I want to receive email notifications when my password is changed, so I'm alerted to unauthorized access attempts.
- As a student, I want to be automatically logged out after 7 days of inactivity for security, so my account isn't compromised on shared devices.

---

### **Account Management**

- As a student, I want to be able to create an account in FRESHR using my email address, so I can access the platform.
- As a student, I want to verify my email address during signup, so FRESHR knows my email is valid.
- As a student, I want to be able to log in using my credentials in FRESHR, so I can access my learning materials.
- As a student, I want to be able to log out of FRESHR, so I can secure my account when I'm done.
- As a student, I want to be able to update my profile information (name, email, phone), so my account details stay current.
- As a student, I want to be able to change my email address with verification, so I can update my contact information.

---

### **Onboarding & First-Time Experience**

- As a new student, I want to see a welcome tutorial on first login explaining key features (notebooks, quizzes, presentations, chat), so I understand how to use FRESHR.
- As a new student, I want to be guided through creating my first notebook, so I can get started quickly.
- As a new student, I want to see sample content or templates, so I can try features without uploading my own files first.
- As a new student, I want the option to skip the tutorial, so I can explore on my own if I prefer.
- As a new student starting a free trial, I want to see clearly which features are trial-only vs. permanently free, so I know what to expect after the trial ends.

---

### **Notebooks & File Management**

#### Notebook Creation & Organization

- As a student, I want to be able to create a notebook in FRESHR with a custom name, so I can organize materials by course or subject.
- As a student on the free plan, I want to be limited to 2 notebooks, so the platform can manage resource usage while I evaluate the service.
- As a student on paid plans, I want to create unlimited notebooks, so I can organize all my courses without restrictions.
- As a student, I want to be able to rename my notebooks, so I can update names as my courses change.
- As a student, I want to be able to delete a notebook, so I can remove courses I'm no longer taking.
- As a student, I want to receive a warning before deleting a notebook, explaining that all associated quizzes, presentations, flashcards, and chat history will be permanently deleted.
- As a student, I want to be able to archive notebooks instead of deleting them, so I can preserve past course materials without cluttering my active workspace.
- As a student, I want to see notebooks organized by last modified date or custom sorting, so I can quickly find what I need.

#### File Storage & Management

- As a student, I want to be able to store files inside a notebook, so all my course materials are in one place.
- As a student on the free plan, I want to be limited to 5 files per notebook, so I understand storage constraints while evaluating the platform.
- As a student on paid plans, I want to upload unlimited files per notebook, so I can store all my learning materials.
- As a student, I want to be able to delete files imported in my notebook, so I can remove outdated or incorrect materials.
- As a student, I want to receive confirmation before deleting a file, so I don't accidentally remove important content.
- As a student, I want to see a list of all files in my notebook with file names, types, sizes, and upload dates, so I can manage my content.

---

### **File Upload & Management**

#### Supported Formats & Validation

- As a student, I want to see a clear error message if my file exceeds the 50MB upload limit, with the actual file size shown, so I know why the upload failed.
- As a student, I want to be able to upload the following file formats to my notebook:
  > - PDF documents (.pdf)
  > - Word documents (.docx, .doc)
  > - PowerPoint files (.pptx) - for reference only, not for editing
  > - Text files (.txt)
  > - Images (.jpg, .jpeg, .png) for OCR text extraction
  > - Audio files (.mp3, .wav) for transcription **(Phase 2)**
- As a student, I want to see the file size and type before uploading, so I can verify it meets requirements.
- As a student, I want to see a progress bar during file upload, so I know the upload is working.
- As a student, I want to receive an error message if I try to upload an unsupported file type, with a list of supported formats, so I know what to use.

#### File Organization

- As a student, I want to be able to rename files in my notebook, so I can keep my materials organized with clear names.
- As a student, I want to be able to move files between notebooks, so I can reorganize my content as my courses evolve.
- As a student, I want to be able to add tags or labels to files (e.g., "Midterm," "Final," "Chapter 3"), so I can filter and find content easily.
- As a student, I want to be able to preview text content from uploaded files (first 500 characters), so I can verify I uploaded the right file.

---

### **Storage Quota Management**

- As a student on the free plan, I want to have 500MB of total storage space across all notebooks, so I can store essential learning materials.
- As a student on the monthly pro plan, I want to have 5GB of total storage space, so I can store more comprehensive materials.
- As a student on the yearly pro plan, I want to have 10GB of total storage space, so I have ample room for all my courses.
- As a student, I want to see my current storage usage and remaining quota prominently displayed in my account settings and on the upload screen, so I always know my storage status.
- As a student, I want to receive an email notification when I reach 80% and 95% of my storage quota, so I can manage my files proactively or upgrade.
- As a student, I want to see which files are taking up the most storage, so I can delete large unnecessary files if needed.
- As a student, I want to be prevented from uploading files when I'm at 100% capacity, with a clear message to upgrade or delete files, so I understand my options.
- As a student, I want to be able to purchase additional storage in 5GB increments **(Phase 2)**, so I can expand beyond my plan limits if needed without upgrading my entire plan.

---

### **Quiz Feature**

#### Quiz Generation & Configuration

- As a student, I want to be able to generate quizzes for a specific topic using the notes I've uploaded to my notebook, so I can test my knowledge.
- As a student on the free plan, I want to generate up to 5 quizzes per day, so I can try the feature without committing to a paid plan.
- As a student on paid plans, I want unlimited quiz generation, so I can study as much as I need.
- As a student, I want to be able to specify the number of questions in my quiz (5, 10, 15, or 20 questions), so I can control the quiz length based on my study time.
- As a student, I want to be able to select the difficulty level (Easy, Medium, Hard, or Mixed), so I can challenge myself appropriately at different learning stages.
  > - **Easy:** Basic recall questions focusing on definitions and simple facts
  > - **Medium:** Application questions requiring understanding and connecting concepts
  > - **Hard:** Analysis and synthesis questions requiring deep comprehension
  > - **Mixed:** Combination of all difficulty levels
- As a student, I want to be able to quickly select a specific topic from my auto-generated syllabus for the quiz, so I can focus on areas I'm currently studying.
- As a student, I want quizzes to be in multiple-choice format (4 answer options per question) in the MVP, with plans to add true/false and short answer in future updates.

#### Content Quality & Relevance

- As a student, I want to see a warning message if my uploaded notes are less than 500 words, indicating that quiz quality may be limited, so I have realistic expectations.
- As a student with limited notes, I want to be asked if I'd like to supplement my notes with verified online sources from educational websites, so I can still generate a meaningful quiz.
- As a student, I want to clearly see which quiz questions were generated from my notes vs. supplemental web sources (marked with icons), so I know the origin of the content.
- As a student, I want to see a relevance confidence score (0-100%) when generating quizzes on a specific topic, so I know if my notes match the requested subject well.
- As a student, I want to be warned if my requested quiz topic doesn't match my uploaded notes content (below 70% relevance match), with suggestions to either adjust my topic or upload relevant materials, so I don't waste quiz generation attempts.
- As a student, I want the system to automatically identify and suggest quiz topics based on the content of my uploaded notes, so I can generate relevant quizzes even if I'm unsure what to ask for.

#### Quiz Taking & Results

- As a student, I want to see my score immediately after completing a quiz as a percentage and fraction (e.g., 85% - 17/20 correct), so I get instant feedback.
- As a student, I want to see which questions I got wrong with detailed explanations of why the correct answer is right, so I can learn from my mistakes.
- As a student, I want to see the correct answers with clickable references to specific sections/page numbers of my notes or sources, so I can review the material in context.
- As a student, I want to see a breakdown of my performance by topic and difficulty level after completing a quiz, so I can identify specific areas needing improvement.
- As a student, I want to be able to flag individual quiz questions as unclear, incorrect, or poorly worded, with an optional comment field, so the system can improve.

#### Quiz History & Management

- As a student, I want to be able to see my quiz history showing:
  > - Quiz topic
  > - Date taken
  > - Score achieved
  > - Number of questions
  > - Time to completion
  > - Difficulty level
- As a student, I want to be able to save a quiz to my favorites, so I can easily retake important quizzes.
- As a student, I want to be able to retake any saved quiz, with questions reshuffled if possible, so I can practice until I master the material.
- As a student, I want to see my historical performance on retaken quizzes (attempt 1, attempt 2, etc.), so I can track improvement over time.
- As a student, I want to be able to delete quiz attempts from my history, so I can remove practice runs or unwanted results.

---

### **Presentation Feature**

#### Presentation Generation & Configuration

- As a student, I want to be able to generate presentations for a provided topic using my uploaded lecture materials, URLs, and all relevant file types in my notebook, so I can create study materials or class presentations.
- As a student on the free plan, I want to generate up to 2 presentations per month, so I can evaluate the feature.
- As a student on paid plans, I want unlimited presentation generation, so I can create as many presentations as I need.
- As a student, I want the system to suggest related topics based on my uploaded materials, so I can create presentations that align well with my content.
- As a student, I want to see a warning if my uploaded materials don't match my requested presentation topic (below 70% relevance), with the option to proceed anyway or adjust my topic, so I make informed decisions.
- As a student, I want to specify the number of slides in my presentation (5, 10, 15, or 20 slides), so I can control the length based on my needs.
- As a student, I want to choose the presentation aspect ratio before generation:
  > - 16:9 Standard (for widescreen displays and modern projectors)
  > - 4:3 Classic (for older projectors and square screens)
- As a student, I want to select from 4 themes before generating my presentation, so I get my preferred style immediately:
  > - **Dark:** Modern dark theme with high contrast
  > - **White:** Clean, minimal white background
  > - **Official:** Professional corporate style with blue accents
  > - **Classic:** Traditional academic presentation style

#### Presentation Editing (Paid Plans Only)

- As a student on the free plan, I want to be able to view and download my generated presentations but NOT edit them, so I'm encouraged to upgrade for full functionality.
- As a student on paid plans, I want to be able to edit text content directly in each slide by clicking on text boxes, so I can refine the presentation content.
- As a student on paid plans, I want to be able to regenerate a single slide by providing a specific prompt (e.g., "Make this slide focus more on applications"), so I can improve individual slides without regenerating the entire presentation.
- As a student on paid plans, I want to be able to add new slides between existing slides, so I can expand my presentation where needed.
- As a student on paid plans, I want to be able to delete individual slides, so I can remove unnecessary or redundant content.
- As a student on paid plans, I want to be able to reorder slides by dragging and dropping, so I can adjust the presentation flow.
- As a student on paid plans, I want to be able to switch themes after generation, so I can try different visual styles.
- As a student on paid plans, I want to undo/redo editing actions (up to 10 steps), so I can experiment without fear of losing work.

#### Speaker Notes

- As a student, I want automatic speaker notes generated under each slide, so I have guidance for presenting the material.
- As a student on paid plans, I want to customize speaker notes tone:
  > - **Professional:** Formal, business-appropriate language
  > - **Casual:** Conversational, friendly tone
  > - **Academic:** Scholarly language with technical terminology
- As a student on paid plans, I want to customize speaker notes length:
  > - **Brief:** 2-3 sentence summary per slide
  > - **Standard:** 1 short paragraph per slide
  > - **Detailed:** 2-3 paragraphs with examples and elaboration
- As a student, I want to manually edit speaker notes in a text editor, so I can add my personal insights and speaking cues.
- As a student, I want speaker notes to reference specific parts of my uploaded materials, so I can cite sources during presentation.

#### Presentation Management & Export

- As a student, I want to be able to save presentations to my notebook, so I can access them later.
- As a student, I want to download my presentation as a PPTX file (Microsoft PowerPoint format), so I can edit it in PowerPoint or Google Slides.
- As a student, I want to download my presentation as a PDF file, so I can share it easily or print handouts.
- As a student, I want export files to include speaker notes as slide notes in the PPTX format and as annotations in the PDF, so they're preserved in the export.
- As a student, I want to export my presentation to Canva with one click **(Phase 2 - Aspirational)**, so I can use advanced design tools for further customization.
- As a student, I want to see a thumbnail preview of each slide in my saved presentations, so I can identify them visually.
- As a student, I want to be able to delete saved presentations, so I can clean up old or practice presentations.
- As a student, I want to be able to duplicate a presentation, so I can create variations without starting from scratch.

---

### **Learning Progress & Analytics**

#### Syllabus Generation & Topic Tracking

- As a student, I want FRESHR to automatically extract and organize topics from my uploaded notes into a hierarchical syllabus structure (main topics → subtopics), so I can see what material I have at a glance.
- As a student, I want to be able to manually edit, add, or remove topics from my auto-generated syllabus, so I can customize it to match my course structure.
- As a student, I want to see the percentage of coverage for each topic based on my quiz attempts, so I know where I've focused my study efforts.
- As a student, I want syllabus generation and topic tracking to be per-notebook, so I can track my progress for each course separately.

#### Performance Tracking (Paid Plans Only)

- As a student on paid plans, I want to see which topics I'm performing well on (>80% average quiz score across all attempts), marked with a green indicator, so I can identify my strengths.
- As a student on paid plans, I want to see which topics I need more practice on (<70% average quiz score), marked with a red indicator and recommended study actions, so I can focus my time effectively.
- As a student on paid plans, I want to visualize my progress over time with:
  > - **Line graphs:** Showing quiz score trends by week/month
  > - **Bar charts:** Comparing performance across different topics
  > - **Pie charts:** Showing time spent on each topic based on quiz attempts
  > - **Progress pointers:** Visual indicators of overall notebook completion percentage
- As a student on paid plans, I want to see my overall notebook progress as a percentage complete based on topics covered (quizzes taken) and mastered (>80% score), so I can track toward completion.
- As a student on paid plans, I want to see my quiz attempt frequency by topic displayed in a heatmap or bar chart, so I know where I'm spending the most time.

#### Progress Reports (Paid Plans Only)

- As a student on paid plans, I want to opt in to receive monthly progress reports via email, so I get regular updates about my learning.
- As a student on paid plans, I want to be able to opt out of email progress reports at any time in my settings, so I control my inbox.
- As a student on paid plans, I want monthly progress reports to include:
  > - Total quizzes taken this month
  > - Average score across all quizzes
  > - Most improved topics (biggest score increase)
  > - Topics needing attention (lowest scores or declining performance)
  > - Study time trends (days active, quiz frequency)
  > - Total presentations created
  > - Total flashcards studied
  > - Comparison to previous month's metrics
- As a student on paid plans, I want to be able to view and download past progress reports in my account dashboard, so I can reference historical data.
- As a student on paid plans, I want FRESHR to recommend which topics to study next based on my performance data, so I can optimize my learning path.

---

### **Flashcard Feature**

#### Flashcard Generation

- As a student, I want to automatically generate flashcards from my uploaded notes, with the system identifying key terms and concepts, so I can create study materials efficiently.
- As a student on the free plan, I want to create up to 50 flashcards total across all notebooks, so I can try the feature.
- As a student on paid plans, I want unlimited flashcard creation, so I can build comprehensive study sets.
- As a student, I want to be able to specify how many flashcards to generate (10, 25, 50, 100) from my notes, so I can control the study set size.
- As a student, I want flashcards to include source references showing which section of my notes each card came from, so I can review context if needed.
- As a student, I want to be able to manually create flashcards by typing the front (question/term) and back (answer/definition), so I can add custom content.

#### Flashcard Editing & Organization

- As a student, I want to be able to edit both the front and back of any flashcard, so I can refine definitions and explanations.
- As a student, I want to be able to add new flashcards manually to an auto-generated set, so I can include additional concepts the AI missed.
- As a student, I want to be able to delete individual flashcards from a set, so I can remove duplicates or irrelevant cards.
- As a student, I want to be able to tag flashcards by topic or category (e.g., "Vocabulary," "Formulas," "Dates"), so I can organize them effectively.
- As a student, I want to be able to merge flashcard sets from different sources or notebooks, so I can create comprehensive study materials for exams.
- As a student, I want to be able to split large flashcard sets into smaller themed subsets, so I can study more focused topics.

#### Flashcard Study Features (Paid Plans Only)

- As a student on paid plans, I want to study flashcards in random shuffle mode, so I don't memorize based on sequence.
- As a student on paid plans, I want to mark flashcards as "Got it," "Almost," or "Need practice" during study sessions, so the system knows which cards to show me more often.
- As a student on paid plans, I want to use spaced repetition algorithms that show me difficult cards more frequently and easy cards less often, so I learn more efficiently.
- As a student on paid plans, I want to track my flashcard study progress including:
  > - Total cards studied today/this week
  > - Accuracy rate (% marked as "Got it")
  > - Cards mastered (consistently marked "Got it" over multiple sessions)
  > - Cards needing review
- As a student on paid plans, I want to receive study reminders for flashcard sets I haven't reviewed in over 3 days, so I maintain consistent practice.

#### Flashcard Export & Sharing

- As a student, I want to export flashcards as a PDF with terms on one side and definitions on the other for printing, so I can study offline.
- As a student on paid plans, I want to export flashcards to Anki format (.apkg), so I can use them in my preferred study app.
- As a student, I want to export flashcards as a CSV file, so I can import them into spreadsheets or other tools.

---

### **Chat & AI Tutor Feature**

#### Chat Functionality

- As a student, I want to be able to start a new chat session within a specific notebook, so the AI tutor has context from my uploaded notes and can give relevant answers.
- As a student on the free plan, I want to send up to 10 chat messages per day, so I can try the AI tutor feature.
- As a student on paid plans, I want unlimited chat messages, so I can ask as many questions as I need.
- As a student, I want to be able to ask the AI tutor questions about topics in my notes, so I can get explanations and clarification.
- As a student, I want the AI to cite specific sections, page numbers, or paragraphs from my uploaded notes when answering questions, so I can verify information and review source material.
- As a student, I want to be able to ask follow-up questions in the same chat session, so I can dive deeper into topics without starting over.
- As a student, I want to be able to switch between different notebooks during a chat session without losing my conversation, so I can reference multiple courses.
- As a student, I want the AI to ask me clarifying questions if my query is ambiguous, so I get the most relevant answer.

#### Chat History & Management

- As a student, I want to view my complete chat history organized by date and notebook, so I can find past conversations.
- As a student, I want each chat session to be automatically titled based on the main topic discussed, so my history is organized and searchable.
- As a student, I want to be able to manually rename chat sessions, so I can use my own naming system.
- As a student, I want to be able to search my chat history by keyword, so I can quickly find specific discussions.
- As a student, I want to be able to delete individual chat sessions, so I can clean up my history.
- As a student, I want to be able to bookmark or favorite important chat messages for quick reference later.
- As a student, I want to see a "Recently Asked" section showing my last 5 questions across all notebooks, so I can easily return to recent topics.

#### Quick Notes from Chat

- As a student, I want to be able to generate a formatted summary of my chat conversation as "quick notes" with one click, so I can save key insights.
- As a student, I want quick notes to automatically save to my current notebook with a title like "Chat Summary - [Topic] - [Date]", so they're easy to find later.
- As a student, I want to be able to edit quick notes before saving them, so I can refine the content or add my own observations.
- As a student, I want quick notes to include references to the original chat messages, so I can return to the full conversation if needed.

#### Source Verification

- As a student, I want all AI answers to clearly indicate whether information came from:
  > - My uploaded notes (with specific page/section reference)
  > - Verified external educational sources (with URL or citation)
  > - General AI knowledge
- As a student, I want to see when the AI supplements with web sources, clearly marked as external information, so I know what's from my materials vs. online.
- As a student, I want to be able to click on note references to jump directly to that section in my uploaded file (if supported), so I can quickly verify answers.
- As a student, I want to be able to report incorrect or misleading AI responses with a "Report Issue" button, so the system can improve and I can get corrected information.

---

### **Research & Academic Writing Tools (Paid Plans Only)**

#### Research Paper Support

- As a student on paid plans, I want to be able to generate an outline for a research paper based on my topic and uploaded notes, so I have a starting structure.
- As a student on paid plans, I want the AI to suggest thesis statements based on my topic and materials, so I can refine my argument.
- As a student on paid plans, I want to be able to search for academic sources directly within FRESHR using keywords, so I don't need to switch between tools.
- As a student on paid plans, I want to be able to save and organize research sources (URLs, PDFs, citations) within my notebook, so everything is in one place.
- As a student on paid plans, I want to be able to add notes and annotations to saved sources, so I can track important points and quotes.

#### Citation Generation

- As a student on paid plans, I want to be able to generate properly formatted citations in multiple academic formats:
  > - **APA (7th edition)** - Most common in social sciences
  > - **MLA (9th edition)** - Common in humanities
  > - **Chicago (17th edition)** - Used in history and some humanities
  > - **IEEE** - Used in engineering and computer science
  > - **Harvard** - Used internationally
- As a student on paid plans, I want to paste a URL or DOI and have FRESHR automatically generate a properly formatted citation by pulling metadata, so I save time and avoid errors.
- As a student on paid plans, I want to manually create citations by filling in fields (author, title, date, etc.) if automatic generation doesn't work, so I can still cite unusual sources.
- As a student on paid plans, I want to create a bibliography from all my saved sources with one click in my chosen format, so I can easily complete my references section.
- As a student on paid plans, I want to be able to export my bibliography as a formatted text document or Word file, so I can paste it into my paper.
- As a student on paid plans, I want to verify citation accuracy by seeing the source metadata FRESHR used, so I can catch any errors before submitting my paper.

#### Diagram Creation

- As a student on paid plans, I want to be able to create simple diagrams within FRESHR:
  > - **Flowcharts** - For processes and decision trees
  > - **Mind maps** - For brainstorming and concept connections
  > - **Concept maps** - For showing relationships between ideas
  > - **Venn diagrams** - For comparisons and overlaps
  > - **Cycle diagrams** - For repeating processes
- As a student on paid plans, I want to describe a process in text and have FRESHR generate a flowchart automatically, so I can quickly create visuals.
- As a student on paid plans, I want to manually edit AI-generated diagrams (add/remove nodes, change labels, adjust connections), so I have full control over the final result.
- As a student on paid plans, I want to export diagrams as high-resolution images (PNG 300dpi) or vector files (SVG), so I can include them in papers and presentations.
- As a student on paid plans, I want to save diagrams to my notebook for reuse, so I don't have to recreate them.

---

### **Subscription & Billing**

#### Plan Management

- As a student, I want to see a clear side-by-side comparison table of Free, Monthly Pro, and Yearly Pro plans before subscribing, so I can make an informed decision.
- As a new student, I want to start with a 7-day free trial of all Pro features (no credit card required), so I can fully test the platform before committing.
- As a student, I want to be clearly notified 2 days before my free trial ends, with a reminder of when I'll be charged if I don't cancel, so there are no surprises.
- As a student on the free plan, I want to be able to upgrade to Monthly Pro or Yearly Pro at any time with immediate access to features, so I can unlock functionality when I need it.
- As a student on Monthly Pro, I want to be able to upgrade to Yearly Pro and receive a prorated credit for my remaining monthly subscription, so I'm not double-charged.
- As a student on a paid plan, I want to be able to downgrade to Free at the end of my current billing cycle (not immediately), so I get what I paid for and don't lose access mid-month.
- As a student, I want to receive a confirmation email when I change my subscription plan, including the new plan details and effective date, so I have a record of the change.

#### Payment Management

- As a student, I want to be able to add, update, or remove payment methods including:
  > - Credit cards (Visa, Mastercard, American Express, Discover)
  > - Debit cards
  > - PayPal
  > - Apple Pay / Google Pay **(Phase 2)**
- As a student, I want my payment information to be securely stored and encrypted (PCI-DSS compliant), so my financial data is protected.
- As a student, I want to see which payment method is currently set as primary, so I know which will be charged.
- As a student, I want to receive a detailed receipt via email after each successful payment showing:
  > - Transaction date
  > - Amount charged
  > - Plan purchased
  > - Billing period covered
  > - Payment method used (last 4 digits)
  > - Transaction ID
- As a student, I want to be notified 3 days before my subscription auto-renews, with the amount that will be charged and the option to cancel, so I can make an informed decision.
- As a student, I want to be notified immediately if my payment fails, with clear instructions to update my payment method and a grace period (7 days) before my account is downgraded, so I can maintain my subscription.
- As a student, I want to be able to view my complete payment history in my account settings, so I can track my expenses.
- As a student, I want to be able to download past receipts as PDF files, so I can keep records for my own bookkeeping.

#### Refunds & Cancellation

- As a student, I want to be able to request a full refund within 14 days of my initial purchase if I'm unsatisfied, no questions asked, so I'm protected as a customer.
- As a student, I want to cancel my subscription at any time with access maintained until the end of the current billing period, so I get what I paid for.
- As a student, I want to receive a confirmation email immediately when I cancel, clearly stating:
  > - Cancellation is confirmed
  > - The exact date my paid access will end
  > - A reminder to download or export any important data before the end date
  > - Information about what happens to my account after cancellation (data retention policy)
- As a student who cancelled, I want the option to easily reactivate my subscription before it ends, so I can change my mind without losing my data.

---

### **Privacy & Data Control**

#### Data Export & Portability

- As a student, I want to be able to download all my data in standard formats with one click from my account settings:
  > - **Notes/Files:** Original uploaded files in their native formats
  > - **Quizzes:** JSON or CSV with questions, answers, and my results
  > - **Presentations:** PPTX and PDF formats
  > - **Flashcards:** CSV format compatible with Anki
  > - **Chat History:** PDF or TXT format with timestamps
  > - **Progress Data:** CSV with all quiz scores and analytics
- As a student, I want my data export to be prepared as a downloadable ZIP file within 24 hours, so I can get everything in one package.
- As a student, I want to receive an email notification when my data export is ready to download, so I don't have to keep checking.

#### Account Deletion & Data Retention

- As a student, I want to be able to permanently delete my account and all associated data from my account settings, so I can exercise my right to be forgotten under GDPR.
- As a student, I want to receive a clear warning before account deletion explaining:
  > - All data will be permanently deleted (notebooks, quizzes, presentations, chat history)
  > - This action cannot be undone
  > - I have a 7-day grace period to cancel the deletion
  > - What data, if any, will be retained for legal/compliance reasons (e.g., payment records for tax purposes)
- As a student, I want to receive a confirmation email with a unique cancellation link if I change my mind during the 7-day grace period, so I don't accidentally lose my account.
- As a student who cancels my paid subscription, I want my data retained for 90 days after my subscription ends, so I can resubscribe without losing my work.
- As a student on the free plan who becomes inactive, I want my data retained for 30 days after my last login, with an email warning before deletion, so I don't lose work due to temporary inactivity.

#### Privacy Controls

- As a student, I want to control whether my data (uploaded notes, quizzes, presentations) can be used for AI training, with a clear opt-in/opt-out toggle in settings, so I maintain privacy over my learning materials.
- As a student, I want to view FRESHR's complete data privacy policy during signup with a checkbox to confirm I've read it, so I understand how my data will be used.
- As a student, I want to view and manage my privacy settings at any time, including:
  > - AI training data usage (opt-in/opt-out)
  > - Email communication preferences
  > - Progress report opt-in/opt-out
  > - Data sharing for research purposes (if applicable)
- As a student, I want to be notified via email if FRESHR's privacy policy changes in any material way, so I can review updates and decide if I want to continue using the service.

---

### **Error Handling & System Feedback**

#### AI Generation Failures

- As a student, I want to see a clear, specific error message if quiz generation fails, explaining:
  > - Why it failed (insufficient content, server error, content too complex, etc.)
  > - What I can do to fix it (add more notes, try a different topic, try again later)
  > - Whether my quiz generation limit was consumed (for free users)
- As a student, I want to be able to retry quiz generation immediately if it fails without consuming another attempt from my daily limit, so server errors don't waste my quota.
- As a student, I want to see a clear error message if presentation generation fails, with specific reasons (files couldn't be processed, topic unclear, system overload), so I understand what went wrong.
- As a student, I want partial presentations to be automatically saved if generation fails midway, so I don't lose all progress and can potentially continue from where it stopped.
- As a student, I want to be offered alternative actions if generation fails repeatedly (contact support, use different content, try a simpler prompt), so I'm not stuck.

#### System Status & Performance

- As a student, I want to see a loading indicator during quiz/presentation/flashcard generation showing:
  > - What's happening ("Analyzing your notes...", "Generating questions...", "Creating slides...")
  > - Estimated time remaining (or progress percentage)
- As a student, I want to be notified if FRESHR is experiencing high demand and generation may take longer than usual (>2 minutes), so I can set expectations or try again later.
- As a student, I want to be able to cancel a generation in progress if it's taking too long, so I'm not stuck waiting and can try a different approach.
- As a student, I want to see a system status indicator in the header (green = all systems operational, yellow = degraded performance, red = service disruption), so I know if issues are on my end or FRESHR's end.

#### Upload & File Processing Errors

- As a student, I want to see specific error messages if file upload fails:
  > - "File too large (52MB). Maximum size is 50MB. Try compressing or splitting your file."
  > - "File type .xyz not supported. Supported types: PDF, DOCX, TXT, JPG, PNG, PPTX"
  > - "Upload interrupted. Check your internet connection and try again."
  > - "File appears corrupted. Try re-exporting or using a different file."
- As a student, I want to be notified if OCR (text extraction from images) fails, with suggestions to upload a clearer image or a text-based document instead.
- As a student, I want to be notified if an uploaded file contains no extractable text (blank PDF, image-only DOCX), so I know why content generation won't work.

---

### **User Feedback & Quality Improvement**

#### Rating & Reporting

- As a student, I want to be able to rate each generated quiz on a 5-star scale with an optional comment, so I can provide feedback on quality.
- As a student, I want to be able to report specific quiz questions as incorrect, unclear, or poorly worded by clicking a flag icon, with the option to explain the issue, so the system can improve.
- As a student, I want to be able to rate each generated presentation on a 5-star scale with categories (Content quality, Design, Relevance, Speaker notes), so FRESHR can improve its generation algorithms.
- As a student, I want to be able to submit detailed feedback about poor quality outputs through a feedback form that asks:
  > - What feature did you use? (Quiz, Presentation, Flashcards, Chat)
  > - What went wrong?
  > - What did you expect?
  > - Can we contact you for follow-up? (optional email)
- As a student, I want to see an acknowledgment message after submitting feedback, thanking me for helping improve FRESHR.
- As a student, I want to receive a follow-up message (via email or in-app notification) if my feedback led to specific improvements or bug fixes, so I feel heard and valued.

---

## Admin

### **Access & Dashboard**

#### Authentication & Session Management

- As an admin, I want to log in to the FRESHR admin dashboard using secure credentials (email + password), so unauthorized users cannot access administrative functions.
- As an admin, I want to be required to enable and use 2FA (two-factor authentication via authenticator app) for admin account access, so the dashboard has an additional mandatory security layer.
- As an admin, I want my admin session to automatically expire after 30 minutes of inactivity, so the system remains secure if I leave my desk.
- As an admin, I want to be prompted to re-authenticate with my password before accessing highly sensitive areas (financial data, user deletion, system settings), so critical actions require active confirmation.

#### Admin Account Management

- As a super admin, I want to be able to view a list of all admin accounts showing:
  > - Name
  > - Email
  > - Role (Super Admin, Support Admin, Finance Admin)
  > - Last login date
  > - Account status (Active, Suspended)
- As a super admin, I want to be able to create new admin accounts with specific role assignments, so we can grant appropriate access levels.
- As a super admin, I want to be able to suspend or delete admin accounts immediately if needed, so we can respond quickly to security concerns or staff changes.
- As a super admin, I want to be able to view all actions taken by a specific admin account, so I can audit individual admin activity.

#### Dashboard Overview

- As an admin, I want to see the following key metrics on my dashboard homepage:
  > - **User Metrics:**
  > - Total active users (logged in within last 30 days)
  > - New signups today/this week/this month
  > - Free users count
  > - Paid users count (Monthly + Yearly)
  > - Trial users count
  > - **Financial Metrics:**
  > - MRR (Monthly Recurring Revenue)
  > - New revenue this month
  > - Churn rate (cancellations %)
  > - **Feature Usage:**
  > - Quizzes generated today
  > - Presentations generated today
  > - Total storage used across all users
  > - **System Health:**
  > - AI generation success rate (last 24 hours)
  > - Average response time
  > - Active support tickets
- As an admin, I want to be able to customize which widgets appear on my dashboard, so I can see the metrics most relevant to my role.

---

### **Student Management**

#### User List & Filtering

- As an admin, I want to see a paginated list of all students (50 per page), so I can browse the user base.
- As an admin, I want to be able to filter students by the following categories:
  > - **Plan Type:** Free, Monthly Pro, Yearly Pro, Trial Active, Trial Expired
  > - **Account Status:** Active, Suspended, Banned, Pending Deletion
  > - **Registration Date:** Last 7 days, Last 30 days, Last 90 days, Custom date range
  > - **Activity Level:** Active (logged in within 7 days), Inactive (7-30 days), Dormant (30+ days)
  > - **Payment Status:** Payment current, Payment failed, Refund issued
  > - **Storage Usage:** Under 50%, 50-80%, 80-100%, Over limit
- As an admin, I want to be able to apply multiple filters simultaneously (e.g., "Paid users + High storage usage + Active in last 7 days"), so I can find specific user segments.
- As an admin, I want to be able to save custom filter combinations with names (e.g., "At-risk users"), so I can quickly access frequently used searches.

#### Sorting & Search

- As an admin, I want to be able to sort the student list by:
  > - Date account created (newest/oldest)
  > - Last login date (most/least recent)
  > - Total quizzes generated (most/least)
  > - Total presentations generated (most/least)
  > - Storage used (most/least)
  > - Lifetime value (highest/lowest revenue)
  > - Account status (alphabetical)
- As an admin, I want to be able to search for students by:
  > - Email address (exact or partial match)
  > - Full name (exact or partial match)
  > - User ID
- As an admin, I want search results to highlight the matched terms, so I can quickly verify I found the right user.

#### User Actions & Moderation

- As an admin, I want to be able to suspend a student account temporarily with predefined durations:
  > - 7 days (minor policy violation)
  > - 30 days (moderate violation)
  > - 90 days (serious violation)
  > - Custom duration (enter specific date)
- As an admin, I want to be able to permanently ban a student account, so I can remove users who severely violate terms of service.
- As an admin, I want to be required to provide a reason (from dropdown + optional text) when suspending or banning an account, so all moderation actions are documented:
  > - Spam / Abuse
  > - Payment fraud
  > - Terms of Service violation
  > - Inappropriate content
  > - Multiple accounts
  > - Other (explain)
- As an admin, I want suspended or banned students to receive an automated email notification immediately explaining:
  > - The action taken (suspension or ban)
  > - The reason provided
  > - The duration (for suspensions)
  > - How to appeal (email address or form)
- As an admin, I want to be able to reverse a suspension or ban with a single click, so I can quickly correct mistaken actions or respond to successful appeals.
- As an admin, I want to see a complete moderation history for each user (all suspensions, bans, reversals with dates and reasons), so I can understand the full context.
- As an admin, I want to be able to view a list of all currently suspended and banned accounts in a dedicated section, so I can review moderation status.

#### Data Export

- As an admin, I want to be able to export filtered student lists as CSV files including selected columns (name, email, plan, registration date, etc.), so I can perform external analysis.
- As an admin, I want to be able to schedule automated weekly or monthly user report exports to be emailed to specified addresses, so stakeholders stay informed.

---

### **Bulk Communications**

- As an admin, I want to be able to send bulk emails to filtered groups of students (by plan type, registration date, activity level, specific user IDs), so I can communicate effectively with targeted segments.
- As an admin, I want to be able to select from pre-made email templates for common communications:
  > - Welcome new users
  > - Trial ending reminder (auto-sent 2 days before)
  > - Subscription renewal reminder (auto-sent 3 days before)
  > - Payment failed notification
  > - New feature announcements
  > - Service disruption notifications
  > - We miss you (dormant users re-engagement)
- As an admin, I want to be able to create and save custom email templates with merge tags ({{first_name}}, {{plan_type}}, {{expiration_date}}), so emails are personalized.
- As an admin, I want to preview bulk emails before sending, with a test send option to my own email, so I can catch errors and verify formatting.
- As an admin, I want to be able to schedule bulk emails to send at a specific date and time (in recipient's timezone if possible), so I can optimize delivery timing.
- As an admin, I want to see delivery statistics for sent bulk emails:
  > - Total sent
  > - Successfully delivered
  > - Bounced (with reasons)
  > - Opened (% open rate)
  > - Clicked (if email contains links)
  > - Unsubscribed
- As an admin, I want to be able to view a log of all bulk emails sent (date, recipients, template used, sender admin), so we have a complete communication history.

---

### **Financial Management**

#### Financial Dashboard

- As an admin, I want to see a comprehensive financial dashboard displaying:

  **Revenue Metrics:**
  - **Monthly Recurring Revenue (MRR):** Total monthly subscription revenue
  - **Annual Recurring Revenue (ARR):** MRR × 12
  - **New MRR:** Revenue from new subscriptions this month
  - **Expansion MRR:** Revenue from upgrades (Free→Paid, Monthly→Yearly)
  - **Contraction MRR:** Revenue lost from downgrades
  - **Churned MRR:** Revenue lost from cancellations
  - **Net New MRR:** New + Expansion - Contraction - Churned

  **User Economics:**
  - **Average Revenue Per User (ARPU):** Total MRR / Total paid users
  - **Customer Lifetime Value (CLV):** Average revenue per customer over their entire subscription
  - **Customer Acquisition Cost (CAC):** If marketing spend data is available

  **Conversion Metrics:**
  - **Free-to-Paid Conversion Rate:** % of free users who upgraded in the last 30/90 days
  - **Trial-to-Paid Conversion Rate:** % of trial users who converted to paid subscriptions
  - **Monthly-to-Yearly Upgrade Rate:** % of monthly users who upgraded to yearly

  **Churn Analysis:**
  - **Monthly Churn Rate:** % of paid users who cancelled this month
  - **Revenue Churn Rate:** % of MRR lost to cancellations
  - **Reasons for cancellation:** If exit survey data is available (too expensive, not enough value, switching to competitor, etc.)

- As an admin, I want to see all financial metrics with month-over-month (MoM) and year-over-year (YoY) comparisons, displayed with percentage change and trend arrows, so I can quickly identify growth or decline.
- As an admin, I want to be able to view financial data by custom date ranges (this week, this month, this quarter, this year, custom), so I can analyze different periods.
- As an admin, I want to see financial data visualized in charts:
  - **Line charts:** MRR over time, ARR growth trend
  - **Bar charts:** Revenue by plan type, new vs. churned revenue
  - **Pie charts:** Revenue distribution (Monthly vs. Yearly)

#### Revenue Breakdown & Details

- As an admin, I want to see revenue broken down by:
  - **Subscription plan:** Free (if monetized via ads/other), Monthly Pro, Yearly Pro
  - **New vs. renewal subscriptions**
  - **Payment method:** Credit card, PayPal, etc.
  - **Geographic region:** If user location data is available
- As an admin, I want to see a list of upcoming subscription renewals for the next 7 days, 30 days, and 90 days, with total expected revenue, so I can forecast revenue.
- As an admin, I want to see the top 10 highest-value customers (by lifetime value), so we can identify VIP users for special support or retention efforts.

#### Payment Health Monitoring

- As an admin, I want to see a dashboard of payment issues:
  - **Failed payments:** Count and total revenue at risk
  - **Reasons for failure:** Expired card, insufficient funds, card declined, etc.
  - **Users with failed payments:** List with contact details
  - **Recovery rate:** % of failed payments successfully recovered
- As an admin, I want to see a list of failed payment attempts from the last 30 days with:
  - Student name and email
  - Plan type
  - Amount failed
  - Failure reason
  - Number of retry attempts
  - Days until account downgrade
- As an admin, I want to be able to manually retry failed payments or send payment update reminders to users, so we can recover lost revenue.
- As an admin, I want to see total refunds issued per month with:
  - Number of refunds
  - Total refund amount
  - Reasons for refund (if provided by user or admin)
  - Refund rate (% of revenue refunded)

#### Financial Reports & Export

- As an admin, I want to be able to export financial reports as PDF or Excel files for sharing with stakeholders or accounting, with customizable date ranges and metric selection.
- As an admin, I want to be able to schedule automated monthly financial summary reports to be emailed to specified addresses (CFO, CEO, etc.).

---

### **Comprehensive User Profile View**

When viewing a specific user's profile, **as an admin**, I want to see the following information organized in clear sections:

#### **Account Information**

- Full name
- Email address (with "Send email" button)
- Phone number (if provided)
- Physical address (if provided)
- User ID (unique identifier)
- Account creation date
- Last login date and IP address
- Email verification status
- Account status with indicator:
  - 🟢 Active
  - 🟡 Trial Active (days remaining)
  - 🔴 Suspended (until date, with reason)
  - ⚫ Banned (reason)
  - 🟣 Pending Deletion (deletion date)

#### **Subscription & Payment**

- Current plan type: Free, Monthly Pro, Yearly Pro, Trial
- Subscription start date
- Next billing date (for paid plans)
- Trial end date (if applicable)
- Payment method: Type and last 4 digits
- Payment history table:
  > - Date
  > - Amount
  > - Plan purchased
  > - Status (Success, Failed, Refunded)
  > - Transaction ID
- Lifetime value (total amount paid)
- Outstanding balance or failed payments (if any)
- Refund history (if any)

#### **Usage Statistics**

- Number of notebooks created
- Total storage used / storage limit (with progress bar)
- Storage breakdown by file type
- Total quizzes generated:
  > - Lifetime total
  > - This month
  > - Average per week
- Total presentations generated:
  > - Lifetime total
  > - This month
- Total flashcards created
- Total chat messages sent (lifetime and this month)
- Average quiz score across all quizzes
- Most active topics studied (top 5)
- Feature adoption:
  - Has used quizzes: ✓/✗
  - Has used presentations: ✓/✗
  - Has used flashcards: ✓/✗
  - Has used chat: ✓/✗
  - Has used research tools: ✓/✗
- Last activity: "Generated quiz 2 hours ago"

#### **Support History**

- Support tickets opened (with status: Open, In Progress, Resolved, Closed)
- Reported issues:
  - Quiz quality reports
  - Presentation quality reports
  - Bug reports
  - Feature requests
- Feedback submissions (with ratings)
- Admin notes on account (internal notes not visible to user)
  - With timestamp and admin name
  - "Add note" button for admins to document important interactions

#### **Account Actions**

- **Edit user details** (name, email, phone)
- **Reset password** (send reset email)
- **Suspend account** (specify duration and reason)
- **Ban account** (permanently, with reason)
- **Reverse suspension/ban**
- **Delete account** (with confirmation and data export option)
- **Manually adjust subscription** (upgrade, downgrade, extend trial)
- **Issue refund** (specify amount and reason)
- **Add admin note** (internal documentation)
- **View audit log for this user** (all admin actions taken on this account)

---

### **Audit Logs & Compliance**

- As an admin, I want all admin actions to be automatically logged with the following details:
  - Timestamp (exact date and time)
  - Admin name and email
  - Action type (user suspended, email sent, financial report accessed, settings changed, etc.)
  - Target (user ID or system component affected)
  - Details (reason for suspension, email template used, etc.)
  - IP address of admin
- As an admin, I want to be able to view audit logs filtered by:
  - **Date range:** Last 7 days, 30 days, 90 days, custom
  - **Admin user:** All actions by a specific admin
  - **Action type:** Suspensions, bans, deletions, financial access, bulk emails, setting changes
  - **Target user:** All actions affecting a specific student
- As an admin, I want audit logs to be immutable (cannot be edited or deleted by any admin) and retained for at least 1 year, so we maintain compliance and can investigate issues.
- As an admin, I want to be notified immediately (email + in-app alert) if suspicious admin activity is detected:
  - 5+ failed login attempts in 10 minutes
  - Bulk user deletions (>10 users)
  - Mass suspensions
  - Unusual financial report access patterns
- As an admin, I want to be able to export audit logs as CSV files for external compliance audits or investigations.

---

### **System Analytics & Reporting**

#### Feature Usage Analytics

- As an admin, I want to see overall platform statistics:
  - **Active users:** Daily active users (DAU), weekly active users (WAU), monthly active users (MAU)
  - **New user registrations:** Chart over time (daily, weekly, monthly)
  - **Feature adoption rates:**
    - % of users who have used quizzes
    - % of users who have used presentations
    - % of users who have used flashcards
    - % of users who have used chat
    - % of users who have used research tools
  - **Engagement metrics:**
    - Average session duration
    - Average sessions per user per week
    - Most popular times for platform usage (heatmap by hour/day)
  - **Content creation:**
    - Total quizzes generated (all time, this month)
    - Total presentations generated (all time, this month)
    - Total flashcards created (all time, this month)
    - Total chat messages sent (all time, this month)
- As an admin, I want to see which features are most/least used (ranked by usage %), so we can prioritize development and identify underutilized features.
- As an admin, I want to see a funnel analysis showing:
  - Signups → Email verification → First notebook created → First file uploaded → First quiz/presentation generated
  - Drop-off rates at each step

#### AI System Performance

- As an admin, I want to see AI generation success rates:
  - Quiz generation success rate (% of attempts that complete successfully)
  - Presentation generation success rate
  - Flashcard generation success rate
  - Average generation time for each feature
- As an admin, I want to see AI generation failure reasons broken down:
  - Insufficient content (most common)
  - Server error / timeout
  - Content filtering (inappropriate content detected)
  - Rate limit exceeded
  - Unknown error
- As an admin, I want to see user satisfaction metrics:
  - Average quiz rating (1-5 stars)
  - Average presentation rating (1-5 stars)
  - Number of quality reports filed
  - Most common quality complaints

#### System Health Monitoring

- As an admin, I want to see real-time system health metrics:
  - **Server uptime:** % uptime over last 24 hours, 7 days, 30 days
  - **API response times:** Average, median, 95th percentile
  - **Database query performance:** Slow query count, average query time
  - **AI generation queue:** Current queue length, average wait time
  - **Error rates:** Total errors in last hour/day, errors by feature
  - **Storage usage:** Total storage used across all users, storage growth rate
- As an admin, I want to receive automated alerts (email + SMS for critical issues) if system performance degrades:
  - Response time >3 seconds for 5 minutes
  - Error rate >5% for 10 minutes
  - AI generation queue >100 for 15 minutes
  - Server uptime <99% over 24 hours
- As an admin, I want to see historical system performance charts, so I can identify patterns and plan infrastructure scaling.

---

### **User Feedback Management**

- As an admin, I want to see aggregated user feedback scores:
  - Average quiz rating (with trend line)
  - Average presentation rating (with trend line)
  - Average overall platform rating (if we collect this)
  - Net Promoter Score (NPS) - if we ask "How likely are you to recommend FRESHR?"
- As an admin, I want to view all user-submitted feedback organized by:
  - **Feature:** Quizzes, Presentations, Flashcards, Chat, Research Tools, General
  - **Rating:** 1 star, 2 stars, 3 stars, 4 stars, 5 stars
  - **Status:** New, In Review, Addressed, Won't Fix
  - **Date:** Newest first, oldest first
- As an admin, I want to be able to view individual feedback submissions with:
  - User name and email (with link to full profile)
  - Feature used
  - Rating and written comment
  - Date submitted
  - Related quiz/presentation ID (if applicable)
  - Current status and assigned admin (if any)
- As an admin, I want to be able to respond to user feedback directly, so users know we're listening and can receive updates on their issues.
- As an admin, I want to be able to categorize and tag feedback (Bug, Feature Request, Usability Issue, Content Quality, etc.), so we can organize and prioritize issues.
- As an admin, I want to see the most commonly reported issues (by tag and frequency), so development focuses on high-impact items.
- As an admin, I want to be able to mark feedback as "Addressed" and automatically notify the user, so they know their feedback led to improvements.

---

## Free vs Paid Plan Comparison

| Feature                           | Free Plan                              | Monthly Pro Plan                                       | Yearly Pro Plan                                        |
| :-------------------------------- | :------------------------------------- | :----------------------------------------------------- | :----------------------------------------------------- |
| **Price**                         | $0/month                               | $19.99/month                                           | $159.99/year (Save 33% - $6.67/month equivalent)       |
| **Free Trial**                    | N/A                                    | 7 days (no credit card required)                       | 7 days (no credit card required)                       |
| **Storage Limit**                 | 500 MB                                 | 5 GB                                                   | 10 GB                                                  |
| **Files per Notebook**            | 5 files maximum                        | Unlimited                                              | Unlimited                                              |
| **Notebook Creation**             | 2 notebooks maximum                    | Unlimited notebooks                                    | Unlimited notebooks                                    |
| **Quiz Generation**               | 5 quizzes per day                      | Unlimited                                              | Unlimited                                              |
| **Quiz Formats**                  | Multiple choice only                   | Multiple choice (True/False & Short Answer in Phase 2) | Multiple choice (True/False & Short Answer in Phase 2) |
| **Presentation Generation**       | 2 presentations per month              | Unlimited                                              | Unlimited                                              |
| **Presentation Editing**          | ❌ View & download only                | ✅ Full editing (text, slides, reordering, themes)     | ✅ Full editing (text, slides, reordering, themes)     |
| **Presentation Themes**           | 2 themes (White, Classic)              | All 4 themes (Dark, White, Official, Classic)          | All 4 themes (Dark, White, Official, Classic)          |
| **Speaker Notes**                 | ✅ Basic auto-generated                | ✅ Customizable (tone & length)                        | ✅ Customizable (tone & length)                        |
| **Flashcard Creation**            | 50 flashcards total                    | Unlimited                                              | Unlimited                                              |
| **Flashcard Study Mode**          | ❌ Basic view only                     | ✅ Spaced repetition, shuffle, progress tracking       | ✅ Spaced repetition, shuffle, progress tracking       |
| **Chat with AI Tutor**            | 10 messages per day                    | Unlimited                                              | Unlimited                                              |
| **Quick Notes from Chat**         | ✅ Available                           | ✅ Available                                           | ✅ Available                                           |
| **Progress Tracking & Analytics** | ❌ Not available                       | ✅ Full analytics, graphs, topic performance           | ✅ Full analytics, graphs, topic performance           |
| **Syllabus Auto-Generation**      | ❌ Not available                       | ✅ Auto-generated & editable                           | ✅ Auto-generated & editable                           |
| **Email Progress Reports**        | ❌ Not available                       | ✅ Monthly (opt-in)                                    | ✅ Monthly (opt-in)                                    |
| **Research Tools**                | ❌ Not available                       | ✅ Citations, bibliography, diagrams                   | ✅ Citations, bibliography, diagrams                   |
| **Citation Formats**              | ❌ Not available                       | ✅ APA, MLA, Chicago, IEEE, Harvard                    | ✅ APA, MLA, Chicago, IEEE, Harvard                    |
| **Diagram Creation**              | ❌ Not available                       | ✅ Flowcharts, mind maps, concept maps                 | ✅ Flowcharts, mind maps, concept maps                 |
| **Data Export**                   | ✅ All data exportable                 | ✅ All data exportable                                 | ✅ All data exportable                                 |
| **Priority Support**              | Standard email support (48hr response) | Priority email support (24hr response)                 | Priority email support (12hr response)                 |
| **Early Access to Features**      | ❌                                     | ❌                                                     | ✅ Beta access to Phase 2 & 3 features                 |
| **Ads**                           | ❌ No ads (clean experience for all)   | ❌ No ads                                              | ❌ No ads                                              |

### **Plan-Specific User Limits Summary**

#### **Free Plan Key Restrictions:**

- 500 MB storage (enough for ~50-100 PDFs depending on size)
- 2 notebooks (good for 2 main courses)
- 5 files per notebook (10 files total)
- 5 quizzes per day (35/week - substantial for testing)
- 2 presentations per month
- 50 flashcards total
- 10 chat messages per day
- No editing of presentations after generation
- No progress tracking or analytics
- No research tools (citations, diagrams)

#### **What Happens When Free Users Hit Limits:**

- **Storage:** Cannot upload more files until they delete old ones or upgrade
- **Notebooks:** Cannot create 3rd notebook, prompted to upgrade
- **Files:** Cannot upload 6th file to a notebook, prompted to upgrade
- **Quizzes:** After 5th quiz in a day, "Daily limit reached. Upgrade for unlimited quizzes" message
- **Presentations:** After 2nd presentation in a month, "Monthly limit reached. Upgrade to create more presentations"
- **Chat:** After 10th message in a day, "Daily limit reached. Upgrade for unlimited AI tutoring"

---

## Technical Specifications

### **File Processing Requirements**

#### **Supported File Formats & Processing:**

**PDF Documents (.pdf):**

- Max size: 50 MB per file
- Processing: Full text extraction using PDFMiner or PyPDF2
- OCR: Applied to scanned PDFs using Tesseract OCR if no text layer detected
- Metadata: Extract page count, creation date, author if available
- Use case: Lecture notes, textbooks, research papers

**Word Documents (.docx, .doc):**

- Max size: 50 MB per file
- Processing: Text extraction using python-docx
- Preserve: Basic formatting (headers, lists, tables)
- Metadata: Extract creation date, author, modification date
- Use case: Student notes, essays, outlines

**PowerPoint Files (.pptx):**

- Max size: 50 MB per file
- Processing: Text extraction from slides and speaker notes using python-pptx
- Import only: Users cannot edit imported presentations; can only reference content
- Use case: Professor's lecture slides, student presentation research

**Text Files (.txt):**

- Max size: 50 MB per file
- Processing: Direct text read with UTF-8 encoding
- Use case: Plain notes, code snippets, raw text content

**Images (.jpg, .jpeg, .png):**

- Max size: 50 MB per file
- Processing: OCR text extraction using Tesseract OCR or cloud OCR API (Google Vision, AWS Textract)
- Supported: Scanned documents, whiteboard photos, handwritten notes (if legible)
- Quality recommendation: Minimum 300 DPI for best OCR results
- Use case: Photos of notes, screenshots, diagrams with text

**Audio Files (.mp3, .wav) - Phase 2:**

- Max size: 50 MB per file
- Processing: Speech-to-text transcription using Whisper API or Google Speech-to-Text
- Languages: English (MVP), expand to multiple languages in Phase 2
- Use case: Lecture recordings, voice notes

#### **Content Quality Standards:**

**Minimum Content Thresholds:**

- **Quiz Generation:** 500 words of coherent text minimum
- **Presentation Generation:** 1,000 words of coherent text minimum
- **Flashcard Generation:** 300 words minimum
- **Syllabus Generation:** 500 words minimum

**Topic Extraction & Matching:**

- Use sentence transformers or OpenAI embeddings to convert text to vectors
- Calculate cosine similarity between user's topic query and note content
- **Relevance Thresholds:**
  - ≥ 0.70: High relevance - proceed with generation
  - 0.50 - 0.69: Medium relevance - show warning, offer to supplement with web sources
  - < 0.50: Low relevance - reject and suggest adding relevant content or changing topic
- Topic extraction algorithm:
  1. Preprocess text (remove stop words, lemmatization)
  2. Extract key phrases using TF-IDF or RAKE
  3. Use embeddings to cluster related concepts
  4. Create hierarchical topic structure (main topics → subtopics)
  5. Label clusters with most representative terms

---

### **AI Generation Specifications**

#### **Quiz Generation:**

**Question Types (MVP):**

- Multiple choice with 4 answer options
- One correct answer per question
- Difficulty levels based on Bloom's Taxonomy:
  - **Easy:** Knowledge & Comprehension (factual recall, definitions)
  - **Medium:** Application & Analysis (applying concepts, comparing)
  - **Hard:** Synthesis & Evaluation (creating solutions, critiquing)

**Quality Requirements:**

- Questions must be unambiguous and clearly worded
- Incorrect answers (distractors) must be plausible but clearly wrong
- All questions must be answerable from provided content
- Each question must cite source (page/section number from notes)

**Generation Process:**

1. Analyze uploaded notes and extract key concepts
2. Identify facts, relationships, and patterns suitable for testing
3. Generate questions at specified difficulty level
4. Create plausible distractors based on common misconceptions
5. Validate questions for clarity and answerability
6. Attach source citations

**Web Supplementation (when notes are <500 words):**

- Search for educational content from trusted sources (Khan Academy, educational institutions, Wikipedia)
- Clearly mark which questions came from web sources vs. user notes
- Prioritize user notes when sufficient content exists

#### **Presentation Generation:**

**Slide Structure:**

- Title slide with topic and date
- Content slides with clear headers and bullet points or visuals
- Conclusion/summary slide
- Each slide should have 3-5 bullet points maximum for readability

**Speaker Notes Generation:**

- Auto-generate for all slides
- Brief: 2-3 sentences per slide
- Standard: 1 paragraph (5-7 sentences)
- Detailed: 2-3 paragraphs with examples
- Include source references for credibility

**Theme Specifications:**

- **Dark:** Dark background (#1a1a1a), light text (#ffffff), high contrast
- **White:** White background (#ffffff), dark text (#333333), minimal
- **Official:** Blue corporate theme (#0066cc accents), professional fonts
- **Classic:** Traditional academic style, serif fonts, simple

**Generation Process:**

1. Analyze topic and uploaded materials
2. Create outline with logical flow (introduction → main points → conclusion)
3. Distribute content across specified number of slides
4. Generate slide text content
5. Apply selected theme
6. Generate speaker notes for each slide
7. Add source citations in speaker notes

#### **Flashcard Generation:**

**Content Selection:**

- Identify key terms, definitions, concepts, formulas
- Extract question-answer pairs from notes
- Prioritize information tested in quizzes or mentioned multiple times

**Quality Requirements:**

- Front (question) should be concise (1-2 sentences)
- Back (answer) should be clear and complete
- Each card should test one concept
- Include source reference for review

---

### **Data Retention & Deletion Policy**

**Active Paid Users:**

- Retain all data indefinitely while subscription is active
- No automatic deletion

**Cancelled Paid Subscriptions:**

- Retain all user data for 90 days after subscription ends
- Send email warnings at 60 days, 30 days, and 7 days before deletion
- User can reactivate subscription to prevent deletion
- After 90 days: Permanently delete all content (notebooks, files, quizzes, presentations, flashcards, chat history)
- Retain anonymized analytics and financial records for compliance (5 years)

**Free Plan Users (Inactive):**

- Retain data for 30 days after last login
- Send email warning at 15 days and 3 days before deletion
- After 30 days of inactivity: Permanently delete all content
- User can log in to prevent deletion

**Requested Account Deletion:**

- 7-day grace period with cancellation option
- After 7 days: Permanently delete all user content
- Retain anonymized financial transaction records for tax/compliance purposes (5 years as required by law)
- Retain anonymized usage analytics (no personal identifiers)

**Data Anonymization Process:**

- Remove all personally identifiable information (name, email, phone, address)
- Replace user ID with anonymous ID
- Keep aggregated data for platform analytics

---

## Phase Roadmap

### **MVP (Phase 1) - Target: 3-4 months**

**Core Features (Must Have):**

- User authentication (signup, login, logout, password reset)
- Email verification
- Notebook creation and management (with free/paid limits)
- File upload and storage (PDF, DOCX, TXT, Images with OCR)
- Quiz generation (multiple choice, difficulty levels)
- Quiz taking and results with explanations
- Quiz history and retake functionality
- Presentation generation (PPTX export)
- Basic speaker notes
- Presentation download (PPTX)
- 4 presentation themes (Dark, White, Official, Classic)
- Flashcard creation (basic: create, edit, save)
- Chat with AI tutor (with daily limits for free users)
- Quick notes from chat
- Payment processing (Zinypay)
- Basic admin dashboard (user list, filtering, sorting)
- User feedback collection (rating system)
- Presentation editing for paid users (text editing, slide regeneration, add/delete/reorder slides)

### Phase 2

- ✅ 7-day free trial (no credit card required)
- ✅ Plan upgrade/downgrade flows
- ✅ Admin authentication with 2FA
- ✅ User suspension and ban functionality
- ✅ Bulk email to users
- ✅ Basic financial summary (MRR, ARR, user counts)
- ✅ Subscription management (Free, Monthly Pro, Yearly Pro)
- ✅ Chat history viewing
- ✅ Storage quota management and warnings
- Advanced quiz formats (true/false, short answer with auto-grading)

**Technical Stack Decisions Needed:**

- Frontend: React + Next.js
- Backend: Python + Django
- Database: PostgreSQL for structured data + Vector DB (Pinecone/Weaviate) for embeddings
- File Storage: AWS S3
- AI Provider: OpenAI API
- Payment: Zinypay
- Email: AWS SES
- Authentication: custom JWT

**Success Criteria for MVP:**

- 95%+ AI generation success rate
- <3 second average response time for queries
- 5%+ free-to-paid conversion rate
- <5% monthly churn rate
- 90%+ user satisfaction (4+ stars)

---

### **Phase 2 - Target: 6-9 months post-MVP**

**Enhanced Features:**

- ✅ Theme switching after generation
- ✅ Customizable speaker notes (tone and length)
- ✅ Flashcard study modes (spaced repetition, shuffle, progress tracking)
- ✅ Flashcard export (Anki format, PDF)
- ✅ Full progress tracking and analytics dashboard
- ✅ Auto-generated syllabus from notes
- ✅ Monthly email progress reports
- ✅ Research tools (citations in APA/MLA/Chicago/IEEE/Harvard)
- ✅ Bibliography generation
- ✅ Diagram creation (flowcharts, mind maps, concept maps)
- ✅ Audio file upload and transcription
- ✅ Canva integration for presentation export (if API partnership established)
- ✅ Additional storage purchase option (5GB increments)
- ✅ Apple Pay / Google Pay payment options
- ✅ Admin role-based access control (Super Admin, Support Admin, Finance Admin)
- ✅ Advanced admin analytics (feature usage, funnel analysis, cohort analysis)
- ✅ Audit log system with filtering
- ✅ Enhanced financial dashboard (CLV, CAC, detailed churn analysis)
- ✅ User suspension (temporary, not just ban)
- ✅ Improved feedback management system

**Nice-to-Have:**

- Collaborative notebooks (share with classmates)
- Mobile apps (iOS and Android)
- Browser extension for quick note capture
- Integration with learning management systems (Canvas, Blackboard, Moodle)

---

### **Phase 3 - Target: 12+ months post-MVP**

**Advanced Features:**

- Offline mode for mobile apps
- Advanced AI tutor capabilities (Socratic teaching, personalized learning paths)
- Study groups and collaboration features
- Live tutoring sessions (if feasible)
- Integration with university systems
- API for third-party integrations
- White-label option for institutions
- Multi-language support (Spanish, French, German, Mandarin, etc.)
- Video lecture upload and transcription
- Advanced gamification (leaderboards, achievements, study streaks)

---

**Next Steps:**

1. Review and approve this requirements document
2. Create technical architecture diagram
3. Design database schema
4. Create wireframes and user flow diagrams
5. Set up development environment
6. Begin sprint planning for MVP development

**Document Version Control:**

- Version 1.0 - January 2026 - Initial production-ready document
