-- Seed Capabilities content types onto related activities.
-- Replaces legacy freeform values (chat / build / automate / AI Mastery).

-- Skills
UPDATE activities SET content_type = 'Skills' WHERE id IN (
  '61d8fafc-0190-441a-abc9-6774f25ca702', -- Build automated workflows with Claude Skills
  '025e6a42-4bbc-4d5f-82e7-47a64651f565', -- Auto-Generate any Dashboard with Skills
  'cd36540e-fef6-402c-bfb1-d8512c98b6a0'  -- Activate Claude Plugins for Specialized Tasks
);

-- Projects
UPDATE activities SET content_type = 'Projects' WHERE id IN (
  'f8adee41-cfc0-4295-8b5c-64fe47bda3a1', -- The New Hire Onboarding Hub with Copilot Projects
  '1f2e0991-68a0-4d68-bb74-45777848a2c8', -- Vendor Evaluation Hub Project in ChatGPT Projects
  '06eaf9ed-0b1b-408d-958b-e3f015ad2701', -- Organize Work into Claude Projects
  'a77d6d27-1496-44de-bbe5-a9baaa53c7a7'  -- Optimize Work & Save Time with Projects
);

-- Vibe coding
UPDATE activities SET content_type = 'Vibe coding' WHERE id IN (
  '3b383d76-2f25-41f9-91cc-85902811e22b', -- Vibe Coding with AI
  'b69b405c-40c9-4492-aaf6-faf972418fa2', -- Build a Website with Lovable
  '517c2b8c-9253-4219-ac6c-5b19619d6e3e', -- Build and Publish an Interactive App with Artifacts
  '7dc32a59-c0fa-411a-a58f-1d2ae4cdbc0b', -- Build Live Sales Dashboard with Google AI Studio
  '29364c5b-b83a-4b9e-bc74-d4c66b00b3a6', -- Build an Android App
  '1202378e-c87f-4a88-8afe-9697702a7b05'  -- Real-Time Text Editing with Gemini Canvas
);

-- Scheduled actions
UPDATE activities SET content_type = 'Scheduled actions' WHERE id IN (
  '4b4a8251-e920-450e-8435-08d9dc5702e4', -- Schedule Tasks to Run Automatically
  '70e2fb2c-0558-4ef1-a408-d2fc295a571e', -- Schedule tasks to run automatically in ChatGPT
  '0717f5fc-6891-42c4-8b92-ab2dbc03652a', -- Automate Your Weekly Email Action Items
  'f61b58be-c4f4-4238-ae48-247b86f05d8a', -- Automate workflows with Zapier
  'f84115c8-ac57-4c21-a321-f9d912dc5c19', -- Automate workflows with ChatGPT
  '6da3cb4e-aab6-45f4-86ac-01887e6a6bdf', -- Customer Escalation Automation with Google Workspace Studio
  '018b4e24-5d71-4359-8d43-b78465e64a7f'  -- Use Copilot Cowork to automate daily tasks
);

-- AI agents
UPDATE activities SET content_type = 'AI agents' WHERE id IN (
  '0394ff28-8764-4df9-a0ae-bd37520aaa5d', -- Build Voice AI Appointment Booking Agent using Vapi
  '905137ba-712b-478b-b11b-678f5b8b2353', -- Build a Chat Agent for your Website Using ChatBase
  '8a7cb602-f98a-4a27-aad2-6b8e5e7aacf3', -- Build a Voice Agent using VoiceFlow
  'ce198302-d0f0-47bd-aa72-d31451e86cea', -- Build a custom trained chatbot on your data with Botpress
  '85b645d5-c56a-4f94-a568-71a6da9955b5', -- Control Your Laptop from Anywhere with Dispatch
  '928c8ea9-7327-4c87-a060-fae1fb572fc3', -- Letting Claude Access Your Browser And Take Actions
  '6101b362-2ee6-4f86-a9a2-2ac15814620b', -- Train AI on your own voice with ElevenLabs
  '402c33d0-c9cf-404f-b556-4cdbf0f3fbc7', -- Running a Copilot Cowork Task on Mobile
  '5a0f9bcc-489f-4be7-b83b-df7a6c810146'  -- ChatGPT : The new features including Work
);

-- Coding agents
UPDATE activities SET content_type = 'Coding agents' WHERE id IN (
  '45db04a3-64b6-4444-bfa6-49dd721b37bb'  -- ChatGPT Codex: Your AI Software Engineering Agent
);

-- Clear legacy content types from activities not mapped above
UPDATE activities
SET content_type = ''
WHERE content_type IS NOT NULL
  AND content_type <> ''
  AND content_type NOT IN (
    'Skills',
    'Projects',
    'Vibe coding',
    'Scheduled actions',
    'AI agents',
    'Coding agents'
  );
