# TRC AI Front End

This project provides an interface for the Reward Collection tools. Files uploaded in the Knowledge Base are stored in Supabase Storage.

## Supabase Setup

1. [Create a Supabase project](https://supabase.com/).
2. In your project, create a **public bucket** named `knowledge-base`.
3. Copy your project URL and anon key from the Supabase dashboard.
4. Create a `.env.local` file in this repo and set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   OPENAI_API_KEY=your-openai-key
   ```
5. Install dependencies and run the development server:
   ```
   npm install
   npm run dev
   ```

The Knowledge Base page will allow you to upload images, PDFs and spreadsheets to Supabase Storage and remove them when needed.
