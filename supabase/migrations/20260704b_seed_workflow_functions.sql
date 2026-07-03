-- Seed activity_functions catalog
INSERT INTO activity_functions (name) VALUES
  ('Sales'),
  ('Marketing'),
  ('Customer Support'),
  ('Finance'),
  ('HR'),
  ('Operations'),
  ('IT/Tech'),
  ('Leadership'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- Assign functions to each workflow (from AI_Workflow_Function_Mapping.xlsx)
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance']::text[] WHERE id = '0394ff28-8764-4df9-a0ae-bd37520aaa5d'; -- Build Voice AI Appointment Booking Agent using Vapi
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Other']::text[] WHERE id = 'afca5874-0d4d-4781-a0bd-a024c51b281e'; -- The De-Escalation Gemini Gem: Legal Risk Response Builder
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = '06e49f4e-792a-48af-8777-ecb5fe397f50'; -- Build a Personal Email Writing Custom GPT
UPDATE activities SET functions = ARRAY['Customer Support', 'HR', 'Leadership']::text[] WHERE id = 'f8adee41-cfc0-4295-8b5c-64fe47bda3a1'; -- The New Hire Onboarding Hub with Copilot Projects
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '8c97469b-ad17-4a71-be25-d41e87d0fc82'; -- Claude Memory Setup
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = 'f23a0d77-e63f-446c-b143-e0022b7977d3'; -- Build a Factual Knowledge Base using NotebookLM
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'Finance', 'HR', 'Operations']::text[] WHERE id = '1f2e0991-68a0-4d68-bb74-45777848a2c8'; -- Vendor Evaluation Hub Project in ChatGPT Projects
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '010e8dbb-bd36-4089-b031-d12696080075'; -- Connect Claude to Your Apps
UPDATE activities SET functions = ARRAY['Marketing', 'Other']::text[] WHERE id = '1202378e-c87f-4a88-8afe-9697702a7b05'; -- Real-Time Text Editing with Gemini Canvas
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = 'e1fd938d-b907-4f38-ba0d-f577ec21c00c'; -- Pick the Right Model and Thinking Level in Claude
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '06eaf9ed-0b1b-408d-958b-e3f015ad2701'; -- Organize Work into Claude Projects
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '61d8fafc-0190-441a-abc9-6774f25ca702'; -- Build automated workflows with Claude Skills
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '0717f5fc-6891-42c4-8b92-ab2dbc03652a'; -- Automate Your Weekly Email Action Items
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = '025e6a42-4bbc-4d5f-82e7-47a64651f565'; -- Auto-Generate any Dashboard with Skills
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Other']::text[] WHERE id = 'cd36540e-fef6-402c-bfb1-d8512c98b6a0'; -- Activate Claude Plugins for Specialized Tasks
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership']::text[] WHERE id = '517c2b8c-9253-4219-ac6c-5b19619d6e3e'; -- Build and Publish an Interactive App with Artifacts
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '908e4c7a-f98b-4e3b-8ed5-7b9254095e46'; -- Set Up Claude Cowork on Your Desktop
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '5dc0a566-8188-45eb-a453-ba1b133f801b'; -- Edit Real Files with Claude Cowork
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '4b4a8251-e920-450e-8435-08d9dc5702e4'; -- Schedule Tasks to Run Automatically
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '85b645d5-c56a-4f94-a568-71a6da9955b5'; -- Control Your Laptop from Anywhere with Dispatch
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'Finance', 'HR', 'Leadership']::text[] WHERE id = '7dc32a59-c0fa-411a-a58f-1d2ae4cdbc0b'; -- Build Live Sales Dashboard with Google AI Studio
UPDATE activities SET functions = ARRAY['Marketing', 'HR']::text[] WHERE id = '2f1bc7e1-37fe-41f4-bd84-db8e8b71d38f'; -- Generate High Quality Images with PICTURE Prompt
UPDATE activities SET functions = ARRAY['Marketing', 'Operations', 'IT/Tech', 'Leadership']::text[] WHERE id = 'b69b405c-40c9-4492-aaf6-faf972418fa2'; -- Build a Website with Lovable
UPDATE activities SET functions = ARRAY['Marketing', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = '823792f4-fe34-4e0a-8150-ae36a1442361'; -- Generate Flowchart from Text Using Napkin AI
UPDATE activities SET functions = ARRAY['Customer Support', 'Operations']::text[] WHERE id = '6da3cb4e-aab6-45f4-86ac-01887e6a6bdf'; -- Customer Escalation Automation with Google Workspace Studio
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '09ecf5a9-9586-4ca1-9633-fe6ff257e2a2'; -- Import Your Memories into AI
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '4caad432-850e-42e4-8dd3-7da63e45e6c9'; -- Set Custom Instructions
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '805336e7-391e-4def-96f5-0cd82483ace0'; -- Connect AI to Your Apps
UPDATE activities SET functions = ARRAY['Operations', 'Other']::text[] WHERE id = 'a77d6d27-1496-44de-bbe5-a9baaa53c7a7'; -- Optimize Work & Save Time with Projects
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support']::text[] WHERE id = '6101b362-2ee6-4f86-a9a2-2ac15814620b'; -- Train AI on your own voice with ElevenLabs
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'Operations', 'IT/Tech']::text[] WHERE id = '905137ba-712b-478b-b11b-678f5b8b2353'; -- Build a Chat Agent for your Website Using ChatBase
UPDATE activities SET functions = ARRAY['Operations', 'IT/Tech']::text[] WHERE id = '09a7d335-12c5-40cf-9c81-283b7535bdf5'; -- RAG How AI Finds Answers in Your Documents
UPDATE activities SET functions = ARRAY['IT/Tech']::text[] WHERE id = '29364c5b-b83a-4b9e-bc74-d4c66b00b3a6'; -- Build an Android App
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'IT/Tech']::text[] WHERE id = '8a7cb602-f98a-4a27-aad2-6b8e5e7aacf3'; -- Build a Voice Agent using VoiceFlow
UPDATE activities SET functions = ARRAY['Customer Support', 'IT/Tech']::text[] WHERE id = 'ce198302-d0f0-47bd-aa72-d31451e86cea'; -- Build a custom trained chatbot on your data with Botpress
UPDATE activities SET functions = ARRAY['IT/Tech', 'Leadership']::text[] WHERE id = '3b383d76-2f25-41f9-91cc-85902811e22b'; -- Vibe Coding with AI
UPDATE activities SET functions = ARRAY['IT/Tech']::text[] WHERE id = '5774d38f-2066-4703-b528-1f92afac5ee3'; -- Run Open Source LLMs Locally on Your Laptop
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '0c9cbf1f-a399-4fee-ad7d-d9574284ace6'; -- Temporary One-Time AI Chat
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Finance', 'HR', 'Leadership', 'Other']::text[] WHERE id = 'cc059f14-a253-4323-92e1-3fa2d25d64ad'; -- Deep Research
UPDATE activities SET functions = ARRAY['HR', 'Other']::text[] WHERE id = '7c6f320c-33e6-49c2-afb6-53aa679e4b8f'; -- Guided Learning
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = 'e3a02557-a45c-4cbc-92aa-8f28cec6f1e4'; -- Customize Copilot Cowork for better results
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '018b4e24-5d71-4359-8d43-b78465e64a7f'; -- Use Copilot Cowork to automate daily tasks
UPDATE activities SET functions = ARRAY['Marketing', 'HR']::text[] WHERE id = '4bd267d3-fec8-42f8-bd29-da2c8aae81ef'; -- Generate AI Video & Slide Deck Overviews in NotebookLM
UPDATE activities SET functions = ARRAY['Marketing', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = '14b99936-4032-45ae-a011-f861fafc1a5c'; -- Organize Files with Claude Cowork
UPDATE activities SET functions = ARRAY['Other']::text[] WHERE id = '69f4853b-3552-405a-b78b-d85e7d571211'; -- Dictate your prompts with Wisprflow
UPDATE activities SET functions = ARRAY['Finance', 'HR', 'Leadership', 'Other']::text[] WHERE id = '402c33d0-c9cf-404f-b556-4cdbf0f3fbc7'; -- Running a Copilot Cowork Task on Mobile
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = '70e2fb2c-0558-4ef1-a408-d2fc295a571e'; -- Schedule tasks to run automatically in ChatGPT
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Finance', 'Leadership']::text[] WHERE id = '82f91847-f73f-4534-b40e-37416e0b4b2c'; -- Websearch with Perplexity AI
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'Finance', 'HR', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '45db04a3-64b6-4444-bfa6-49dd721b37bb'; -- ChatGPT Codex: Your AI Software Engineering Agent
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'HR', 'Leadership']::text[] WHERE id = 'ac90e2bd-c2eb-4712-86de-a8f78553df3b'; -- Automate Your Presentations With Gamma AI
UPDATE activities SET functions = ARRAY['Operations', 'IT/Tech']::text[] WHERE id = '928c8ea9-7327-4c87-a060-fae1fb572fc3'; -- Letting Claude Access Your Browser And Take Actions
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership']::text[] WHERE id = '3ac91dca-2619-4e5b-9830-d9671a71a8f1'; -- Design PPTs with ChatGPT
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership']::text[] WHERE id = '158da244-4d2a-4370-8824-d6e5b82932bd'; -- Design PPTs with Claude
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership']::text[] WHERE id = '0221431f-f9de-4eb2-8c61-95bc92317268'; -- Design PPTs with Gemini
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership']::text[] WHERE id = '20cd0e34-5b5d-4dd4-8da5-c7f0ccc40124'; -- Design PPTs with Notebook LM
UPDATE activities SET functions = ARRAY['Marketing', 'Leadership']::text[] WHERE id = 'e95d8f43-c094-45e7-99aa-6353e733023a'; -- Compare Presentation from Claude, ChatGPT, Gemini & Notebook LM
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = '2445c4a1-4296-4082-9d70-f31a4aba6794'; -- Analyze Data with Claude
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = 'bb7a294d-95b8-4053-ba5d-d4bfc7b405c8'; -- Analyze Data with ChatGPT
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = 'd022e36a-bacb-4818-917a-caa9c1a5c3fa'; -- Analyze Data with Gemini
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'Leadership', 'Other']::text[] WHERE id = 'cac3584c-da4d-43df-b4f0-a6018986f736'; -- Analyze Data with Shortcut AI
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = '3b734fb8-5762-4bbd-8880-c57e9dcefaf6'; -- Compare AI Tools for Data Analysis
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'Other']::text[] WHERE id = '4a9ecd76-a803-4cff-8ec5-20e84bfc076b'; -- Generate AI Avatar Video with HeyGen
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'Other']::text[] WHERE id = 'decf3ea7-42bb-44cd-b522-260474c29311'; -- Generate Video with Kling
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'Other']::text[] WHERE id = '6d7741b9-7551-4570-aab1-57f299e9f377'; -- Generate Video with Google Flow
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'Other']::text[] WHERE id = 'e3cfb6ea-bd4d-4efa-a92e-44bc8d8aa28f'; -- Generate Videos with Gemini
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'Other']::text[] WHERE id = 'a4e9a78e-bdf9-4345-95f9-f69c2f1ff4fb'; -- Turn Slides into Videos with Google Vids
UPDATE activities SET functions = ARRAY['Marketing', 'Customer Support', 'HR', 'Other']::text[] WHERE id = 'ded2706a-b6a2-4321-b6c6-1627b118e1d8'; -- Create Video Overviews with NotebookLM
UPDATE activities SET functions = ARRAY['Operations', 'IT/Tech', 'Other']::text[] WHERE id = 'f61b58be-c4f4-4238-ae48-247b86f05d8a'; -- Automate workflows with Zapier
UPDATE activities SET functions = ARRAY['Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'Operations', 'IT/Tech', 'Leadership', 'Other']::text[] WHERE id = 'f84115c8-ac57-4c21-a321-f9d912dc5c19'; -- Automate workflows with ChatGPT
