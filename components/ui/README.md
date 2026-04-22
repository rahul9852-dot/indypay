# UI Components

## SectionHeader

A reusable component for section headers across the website.

### Usage

```tsx
import SectionHeader from '@/components/ui/SectionHeader';

// Basic usage
<SectionHeader
  title="Your Section Title"
/>

// With label and description
<SectionHeader
  label="Section Label"
  title="Your Section Title"
  description="Optional description text"
/>

// Left-aligned
<SectionHeader
  label="Section Label"
  title="Your Section Title"
  description="Optional description text"
  align="left"
/>

// Custom label color
<SectionHeader
  label="Section Label"
  title="Your Section Title"
  labelColor="text-blue-600"
/>
```

### Props

- `label` (optional): Small uppercase text above the title
- `title` (required): Main heading text
- `description` (optional): Descriptive text below the title
- `align` (optional): 'left' or 'center' (default: 'center')
- `labelColor` (optional): Tailwind color class (default: 'text-[#7B4DB5]')

### Examples in Use

- Platform section: "Why Choose Us"
- HowItWorks section: "How It Works"
- Can be used in any section that needs a consistent header style
