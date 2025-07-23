# Construction Daily Bulletin

A beautiful, simple, and clean construction bulletin app built with Next.js and TypeScript. This app allows construction teams to post daily summaries of what took place each day, complete with action items (checklists) for tracking progress.

## Features

- **Daily Bulletin Creation**: Create detailed daily summaries of construction activities
- **Action Items**: Add and manage checklists for each bulletin post
- **Interactive UI**: Mark action items as complete, add new items, and delete items
- **Clean Design**: Beautiful, responsive interface with Tailwind CSS
- **Date Grouping**: Posts are automatically grouped by date for easy navigation
- **Real-time Updates**: All changes are reflected immediately in the UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd construction-bulletin
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating a New Bulletin

1. Click the "Create New Daily Bulletin" button
2. Fill in the required fields:
   - **Title**: A brief summary of the day's activities
   - **Author**: Your name or the team member creating the bulletin
   - **Daily Summary**: Detailed description of what happened on the construction site
3. Optionally add action items (checklist items) for follow-up tasks
4. Click "Create Bulletin" to save

### Managing Action Items

- **Mark Complete**: Click the circle icon to toggle completion status
- **Add New Items**: Use the "Add Item" button on any bulletin post
- **Delete Items**: Hover over an action item and click the X icon
- **Track Progress**: Completed items are shown with a checkmark and strikethrough text

### Deleting Posts

Click the trash icon in the top-right corner of any bulletin post to delete it (requires confirmation).

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Headless UI** - Accessible UI components
- **Heroicons** - Beautiful SVG icons
- **date-fns** - Date formatting and manipulation
- **UUID** - Generate unique identifiers

## Project Structure

```
construction-bulletin/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── BulletinPostCard.tsx
│   │   └── CreatePostForm.tsx
│   ├── context/
│   │   └── BulletinContext.tsx
│   └── types/
│       └── index.ts
├── public/
├── package.json
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Customization

The app uses Tailwind CSS for styling. You can customize the design by modifying the classes in the components or updating the Tailwind configuration in `tailwind.config.js`.

## License

MIT License
