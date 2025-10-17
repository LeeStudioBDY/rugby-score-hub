# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/752f2f39-93f3-443a-b284-6c7b23cb8bad

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/752f2f39-93f3-443a-b284-6c7b23cb8bad) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Option 1: Render.com (Recommended)

This project is configured for easy deployment to Render.com. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Add environment variables (Supabase credentials)
4. Deploy!

### Option 2: Lovable

Simply open [Lovable](https://lovable.dev/projects/752f2f39-93f3-443a-b284-6c7b23cb8bad) and click on Share -> Publish.

## Environment Variables

Create a `.env` file based on `.env.example`:

```
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

## Database Setup

This project uses Supabase as the backend. After creating your Supabase project:

1. Run the migrations in `supabase/migrations/` in order
2. Verify that Row Level Security (RLS) policies are enabled
3. Test that the database is accessible with the anon key
